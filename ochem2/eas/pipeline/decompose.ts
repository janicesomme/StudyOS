import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { z } from 'zod'
import { QuestionAnalysisSchema, SolutionStepSchema } from './schema.js'

const client = new Anthropic()

const INPUT_PATH = 'ochem2/eas/corpus/eas-smith.json'
const OUTPUT_DIR = 'ochem2/eas/corpus/decomposed'
const OUTPUT_PATH = `${OUTPUT_DIR}/eas-smith-decomposed.json`

const SYSTEM_PROMPT = `You are an expert organic chemistry tutor decomposing end-of-chapter exam problems into structured expert thinking for a student learning platform.

HARD RULES — follow every one exactly:

1. GENERATIVE RULE FIRST. Every "why" field must open with the underlying principle or rule, then show what it produces. Never open with "because [molecule] has [property]." Open with the rule itself: "Electron-donating groups (groups that push electrons toward a ring) always increase ring reactivity and direct the incoming electrophile to the ortho and para positions."

2. PLAIN ENGLISH ALWAYS. Define every organic chemistry term the first time it appears in any field. Format: term (plain-English definition). No undefined jargon anywhere.

3. Use "attached" not "hanging off."

4. THINKING MOVES, not calculations. "do_this" must name what an expert DECIDES — the reasoning action, not the mechanical step. Good: "Identify which ring in the molecule is more electron-rich." Bad: "React benzene with Br2/FeBr3."

5. RE-EXPRESS EVERYTHING from scratch. The source text you receive is internal reference only. Never copy a phrase from it. Write every field as if explaining to a student who has never seen this problem. This is a copyright firewall.

6. skill_tested: exactly ONE skill, stated as what the student must actually do — not just the reaction name.

7. recognition_cue: the specific surface feature that fires in an expert's mind and triggers the right framework. Be concrete: not "EAS problem" but "two rings connected at a single bond, both bearing substituents, asked for a bromination product — scan each ring's substituents to compare electron density."

8. solution_steps are ordered. Each step is ONE thinking action. Split any step that does two things.

9. ALWAYS produce at least 2 solution_steps. If the problem depends on chemical diagrams that are not in the text, describe the thinking TYPE the student would apply — the reasoning framework — without inventing specific structural details you cannot see. Never return an empty solution_steps array.`

const DecompositionSchema = z.object({
  question_analysis: QuestionAnalysisSchema,
  prior_knowledge_needed: z.array(z.string()).default([]),
  solution_steps: z.array(SolutionStepSchema).default([]),
})

type Decomposition = z.infer<typeof DecompositionSchema>

interface RawProblem {
  id: string
  source: string
  chapter: number
  problem_number: string
  question_text_raw: string
  solution_text_raw: string
  pairing_confidence: 'high' | 'medium' | 'low'
  solution_status: 'solved' | 'unsolved'
  pairing_note?: string
  has_missing_structure: boolean
}

const DECOMPOSE_TOOL: Anthropic.Tool = {
  name: 'decompose_problem',
  description: 'Output a structured decomposition of an organic chemistry exam problem into expert thinking steps.',
  input_schema: {
    type: 'object' as const,
    properties: {
      question_analysis: {
        type: 'object',
        description: 'What this problem actually tests and how it is disguised',
        properties: {
          skill_tested: {
            type: 'string',
            description: 'The ONE skill the student must exercise — plain English, stated as an action, not just a reaction name',
          },
          disguise: {
            type: 'string',
            description: 'How the question surface hides what it is actually testing',
          },
          recognition_cue: {
            type: 'string',
            description: 'The specific surface pattern that fires in an expert mind and triggers the correct framework — be concrete',
          },
        },
        required: ['skill_tested', 'disguise', 'recognition_cue'],
      },
      prior_knowledge_needed: {
        type: 'array',
        items: { type: 'string' },
        description: 'Prerequisite concepts the student must already know — short plain-English phrases, no undefined jargon',
      },
      solution_steps: {
        type: 'array',
        description: 'Ordered expert thinking steps — each step is one reasoning action',
        items: {
          type: 'object',
          properties: {
            do_this: {
              type: 'string',
              description: 'The thinking action — one imperative, names the decision not the calculation',
            },
            why: {
              type: 'string',
              description: 'The generative rule behind this action — state the principle first, then its consequences',
            },
            vocab: {
              type: 'object',
              additionalProperties: { type: 'string' },
              description: 'OChem terms introduced in this step — term: one-sentence plain-English definition',
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
  const structureWarning = problem.has_missing_structure
    ? '\n\nNOTE: The original problem contained chemical structure diagrams that were not captured as text. Decompose based on what IS available. Where specific structures are essential, describe the TYPE of thinking the student would apply (e.g., "scan each substituent for electron donation or withdrawal") without inventing specific structural details.'
    : ''

  const userPrompt = `Decompose this organic chemistry problem into structured expert thinking.

PROBLEM (internal reference — re-express everything, copy nothing):
${problem.question_text_raw}

SOLUTION REFERENCE (internal only — never copy; use to understand the reasoning):
${problem.solution_text_raw || '[No solution text captured]'}
${structureWarning}`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [DECOMPOSE_TOOL],
    tool_choice: { type: 'tool', name: 'decompose_problem' },
  })

  const toolBlock = response.content.find(b => b.type === 'tool_use')
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('No tool_use block in response')
  }

  return DecompositionSchema.parse(toolBlock.input)
}

async function main() {
  const problems = JSON.parse(readFileSync(INPUT_PATH, 'utf-8')) as RawProblem[]
  const solved = problems.filter(p => p.solution_status === 'solved')

  console.log(`Smith corpus: ${problems.length} total, ${solved.length} solved`)

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const results: (RawProblem & Decomposition)[] = []
  const failures: string[] = []

  for (let i = 0; i < solved.length; i++) {
    const p = solved[i]
    process.stdout.write(`[${i + 1}/${solved.length}] ${p.problem_number}... `)

    try {
      const decomposition = await decompose(p)
      results.push({ ...p, ...decomposition })
      console.log('ok')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`FAILED: ${msg}`)
      failures.push(`${p.problem_number}: ${msg}`)
      results.push({
        ...p,
        question_analysis: { skill_tested: '', disguise: '', recognition_cue: '' },
        prior_knowledge_needed: [],
        solution_steps: [],
      })
    }

    if (i < solved.length - 1) {
      await new Promise(r => setTimeout(r, 80))
    }
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8')

  console.log(`\n--- DONE ---`)
  console.log(`${results.length} processed, ${failures.length} failed`)
  if (failures.length) {
    console.log('Failures:')
    failures.forEach(f => console.log(' ', f))
  }
  console.log(`Output: ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
