import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'
import { z } from 'zod'
import { QuestionAnalysisSchema, SolutionStepSchema } from './schema.js'

const client = new Anthropic()
const TARGET_PATH = 'ochem2/eas/corpus/decomposed/eas-smith-decomposed.json'

const SYSTEM_PROMPT = `You are an expert organic chemistry tutor writing structured step-by-step thinking guides for a student learning platform.

HARD RULES — no exceptions:

1. GENERATIVE RULE FIRST. Every "why" field must open with the underlying principle, not a consequence. Never open with "because [molecule] has [property]." Open with the rule: "Electron-donating groups always..." or "The rule is: ..."

2. PLAIN ENGLISH. Define every organic chemistry term inline the first time it appears in any field: term (plain-English definition). No undefined jargon.

3. Use "attached," never "hanging off."

4. THINKING MOVES. "do_this" names what an expert DECIDES — the reasoning action, not the mechanical step. Good: "Identify which substituent is electron-donating." Bad: "Add Br2."

5. RE-EXPRESS EVERYTHING. Never copy a phrase from the source text. Write every field fresh as if explaining to a student. Copyright firewall.

6. MANDATORY — solution_steps MUST contain at least 3 entries. An empty solution_steps array is a failure. There are absolutely no exceptions to this rule.

WHEN STRUCTURES ARE MISSING OR SOLUTION TEXT IS THIN:
The steps are the EXPERT RECOGNITION AND REASONING FRAMEWORK — the cognitive moves an expert runs before drawing anything. Name the thinking, not the answer.

Required structure for any "draw the product" or "draw the mechanism" question:
  Step 1 (RECOGNIZE): What surface features tell an expert which problem type this is? (reagents, key words, structural signals)
  Step 2 (RETRIEVE): What rule or framework governs this problem type? State it explicitly.
  Step 3+ (APPLY): How does an expert execute that framework? What decisions do they make at each juncture?

Example for an EAS product question where specific structures are missing:
  do_this: "Identify every substituent attached directly to the aromatic ring."
  why: "Each substituent exerts a specific electronic effect on the ring — it either donates or withdraws electron density — and that effect controls both how reactive the ring is overall and which positions will be attacked preferentially. Without cataloging substituents first, no regiochemical prediction is possible."

NEVER return an empty solution_steps array. If specific structures are unavailable, produce the reasoning-type steps that WOULD apply to this class of problem.`

const DecompositionSchema = z.object({
  question_analysis: QuestionAnalysisSchema,
  prior_knowledge_needed: z.array(z.string()).default([]),
  solution_steps: z.array(SolutionStepSchema).default([]),
})

type Decomposition = z.infer<typeof DecompositionSchema>

interface RawProblem {
  id: string
  problem_number: string
  question_text_raw: string
  solution_text_raw: string
  has_missing_structure: boolean
  solution_status: string
  [key: string]: unknown
}

const DECOMPOSE_TOOL: Anthropic.Tool = {
  name: 'decompose_problem',
  description: 'Output a structured decomposition of an organic chemistry exam problem into expert thinking steps. solution_steps MUST contain at least 3 entries.',
  input_schema: {
    type: 'object' as const,
    properties: {
      question_analysis: {
        type: 'object',
        description: 'What this problem actually tests and how it is disguised',
        properties: {
          skill_tested: { type: 'string', description: 'The ONE skill the student must exercise — plain English, stated as an action' },
          disguise: { type: 'string', description: 'How the question surface hides what it is testing' },
          recognition_cue: { type: 'string', description: 'The specific surface pattern that fires in an expert mind — be concrete' },
        },
        required: ['skill_tested', 'disguise', 'recognition_cue'],
      },
      prior_knowledge_needed: {
        type: 'array',
        items: { type: 'string' },
        description: 'Prerequisite concepts — short plain-English phrases, no undefined jargon',
      },
      solution_steps: {
        type: 'array',
        description: 'REQUIRED: at least 3 ordered expert thinking steps. Empty arrays are not permitted.',
        minItems: 3,
        items: {
          type: 'object',
          properties: {
            do_this: { type: 'string', description: 'One thinking action — imperative, names the decision' },
            why: { type: 'string', description: 'The generative rule behind this action — state the principle first' },
            vocab: {
              type: 'object',
              additionalProperties: { type: 'string' },
              description: 'OChem terms in this step — term: one-sentence plain-English definition',
            },
          },
          required: ['do_this', 'why'],
        },
      },
    },
    required: ['question_analysis', 'prior_knowledge_needed', 'solution_steps'],
  },
}

async function decompose(problem: RawProblem): Promise<Decomposition> {
  const structureNote = problem.has_missing_structure
    ? '\n\nNOTE: Chemical structure diagrams were not captured. Produce reasoning-framework steps that apply to this problem TYPE. Step 1 = recognize the problem class. Step 2 = state the governing rule. Step 3+ = describe how an expert applies that rule. Minimum 3 steps required.'
    : ''

  const solutionNote = !problem.solution_text_raw || problem.solution_text_raw.trim() === problem.problem_number
    ? '\n\nNOTE: No solution text was captured for this problem. Use your organic chemistry knowledge to generate the steps. Minimum 3 steps required.'
    : ''

  const userPrompt = `Decompose this organic chemistry problem into structured expert thinking. Minimum 3 solution_steps required — this is mandatory.

PROBLEM (re-express everything, copy nothing):
${problem.question_text_raw}

SOLUTION REFERENCE (internal only — never copy; use to understand the reasoning):
${problem.solution_text_raw || '[No solution text captured]'}
${structureNote}${solutionNote}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [DECOMPOSE_TOOL],
    tool_choice: { type: 'tool', name: 'decompose_problem' },
  })

  const toolBlock = response.content.find(b => b.type === 'tool_use')
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('No tool_use block in response')
  }

  const parsed = DecompositionSchema.parse(toolBlock.input)
  if (parsed.solution_steps.length < 2) {
    throw new Error(`Only ${parsed.solution_steps.length} step(s) — model did not comply`)
  }
  return parsed
}

async function main() {
  const records = JSON.parse(readFileSync(TARGET_PATH, 'utf-8')) as RawProblem[]

  const targets = records.filter(r =>
    !r.solution_steps || (r.solution_steps as unknown[]).length === 0 || r.problem_number === '16.80'
  )

  console.log(`Patching ${targets.length} entries with claude-sonnet-4-6...`)

  let fixed = 0
  let failed = 0
  let lastFixed: { number: string; decomp: Decomposition } | null = null

  for (let i = 0; i < targets.length; i++) {
    const p = targets[i]
    process.stdout.write(`[${i + 1}/${targets.length}] ${p.problem_number}... `)

    try {
      const decomp = await decompose(p)
      const idx = records.findIndex(r => r.id === p.id)
      records[idx] = { ...records[idx], ...decomp }
      fixed++
      lastFixed = { number: p.problem_number, decomp }
      console.log(`ok (${decomp.solution_steps.length} steps)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`FAILED: ${msg}`)
      failed++
    }

    if (i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 100))
    }
  }

  writeFileSync(TARGET_PATH, JSON.stringify(records, null, 2), 'utf-8')

  console.log(`\n--- DONE ---`)
  console.log(`${fixed} fixed, ${failed} still failed`)

  if (lastFixed) {
    console.log(`\n--- SAMPLE: ${lastFixed.number} ---`)
    console.log(JSON.stringify(lastFixed.decomp, null, 2))
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
