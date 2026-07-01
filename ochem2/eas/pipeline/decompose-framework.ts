import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'
import { z } from 'zod'
import { SolutionStepSchema } from './schema.js'

const client = new Anthropic()
const TARGET_PATH = 'ochem2/eas/corpus/decomposed/eas-smith-decomposed.json'

const SYSTEM_PROMPT = `You are writing expert reasoning FRAMEWORK steps for a class of organic chemistry exam problem.

WHAT YOU ARE NOT DOING: You are NOT solving a specific problem. You are NOT writing "the answer."

WHAT YOU ARE DOING: Writing the COGNITIVE FRAMEWORK — the ordered thinking moves that an expert runs whenever they encounter this TYPE of problem. These steps should apply to ANY problem of this class, not just one specific instance.

HARD RULES:

1. GENERATIVE RULE FIRST. Every "why" field must open with the underlying principle, then show its consequence. Never open with "because X has Y." Open with the rule: "Electron-donating groups always..." or "The mechanism of EAS proceeds in two stages..."

2. PLAIN ENGLISH. Define every organic chemistry term the first time it appears in its field: term (plain-English definition in parentheses). No unexplained jargon.

3. Use "attached," never "hanging off."

4. THINKING MOVES only. "do_this" must name what an expert DECIDES — the reasoning action. Not "look at the compound" but "Identify the type of electrophile being used and what bond it will form with the ring." Not "draw the product" but "Locate the position on the ring where electron density is highest, because that is where the electrophile will bond."

5. RE-EXPRESS EVERYTHING. Write in your own words. Do not copy the question text.

6. MANDATORY: 3 to 5 steps. Structure:
   Step 1 — RECOGNIZE: What surface features tell an expert "this is a [type] problem"?
   Step 2 — RETRIEVE: What rule or mechanism governs this problem class? State it completely.
   Step 3+ — APPLY: What decisions does an expert make at each stage? What traps exist for this problem class?`

const StepsOnlySchema = z.object({
  solution_steps: z.array(SolutionStepSchema),
})

const STEPS_TOOL: Anthropic.Tool = {
  name: 'generate_framework_steps',
  description: 'Generate 3–5 expert reasoning framework steps for this class of organic chemistry problem. These are GENERIC steps — they describe HOW to think through any problem of this type, not the specific answer to this one problem.',
  input_schema: {
    type: 'object' as const,
    properties: {
      solution_steps: {
        type: 'array',
        description: '3 to 5 framework steps. Each step names a cognitive action (do_this) and the rule behind it (why). Generic enough to apply to any problem of this class.',
        items: {
          type: 'object',
          properties: {
            do_this: {
              type: 'string',
              description: 'One cognitive action — imperative, names the expert decision or recognition move. NOT the calculation itself.',
            },
            why: {
              type: 'string',
              description: 'The generative rule behind this action. State the principle first, then its consequences. Never open with "because."',
            },
            vocab: {
              type: 'object',
              additionalProperties: { type: 'string' },
              description: 'Organic chemistry terms introduced in this step — each with a one-sentence plain-English definition.',
            },
          },
          required: ['do_this', 'why'],
        },
      },
    },
    required: ['solution_steps'],
  },
}

interface QuestionAnalysis {
  skill_tested: string
  disguise: string
  recognition_cue: string
}

interface RecordEntry {
  id: string
  problem_number: string
  question_text_raw: string
  solution_text_raw: string
  has_missing_structure: boolean
  question_analysis: QuestionAnalysis
  prior_knowledge_needed?: string[]
  solution_steps?: unknown[]
  decomposition_type?: string
  [key: string]: unknown
}

async function generateFramework(entry: RecordEntry): Promise<z.infer<typeof StepsOnlySchema>> {
  const qa = entry.question_analysis

  const userPrompt = `Generate expert reasoning FRAMEWORK steps for this class of organic chemistry problem.

WHAT THIS PROBLEM CLASS TESTS (use as context for writing generic steps):
Skill tested: ${qa.skill_tested}
Disguise: ${qa.disguise}
Recognition cue: ${qa.recognition_cue}

PROBLEM TEXT (for understanding the problem TYPE — the specific structures were in diagrams and are not available):
${entry.question_text_raw}

Write 3–5 FRAMEWORK steps — the cognitive moves an expert runs on ANY problem of this class. Do not attempt to solve this specific problem. Generic by design.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [STEPS_TOOL],
    tool_choice: { type: 'tool', name: 'generate_framework_steps' },
  })

  const toolBlock = response.content.find(b => b.type === 'tool_use')
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('No tool_use block')
  }

  const parsed = StepsOnlySchema.parse(toolBlock.input)
  if (parsed.solution_steps.length < 2) {
    throw new Error(`Only ${parsed.solution_steps.length} step(s) — model did not comply`)
  }
  return parsed
}

async function main() {
  const records = JSON.parse(readFileSync(TARGET_PATH, 'utf-8')) as RecordEntry[]

  const targets = records.filter(r => !r.solution_steps || r.solution_steps.length === 0)
  console.log(`Framework pass: ${targets.length} entries with empty solution_steps`)

  let fixed = 0
  let failed = 0
  let lastFixed: { number: string; entry: RecordEntry; steps: unknown[] } | null = null

  for (let i = 0; i < targets.length; i++) {
    const entry = targets[i]
    process.stdout.write(`[${i + 1}/${targets.length}] ${entry.problem_number}... `)

    try {
      const result = await generateFramework(entry)
      const idx = records.findIndex(r => r.id === entry.id)
      records[idx] = { ...records[idx], solution_steps: result.solution_steps }
      fixed++
      lastFixed = { number: entry.problem_number, entry: records[idx] as RecordEntry, steps: result.solution_steps }
      console.log(`ok (${result.solution_steps.length} steps)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`FAILED: ${msg}`)
      failed++
    }

    if (i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 100))
    }
  }

  // Stamp decomposition_type on all 46 entries
  for (const r of records) {
    const wasTarget = targets.some(t => t.id === r.id)
    r.decomposition_type = wasTarget ? 'framework' : 'specific'
  }

  writeFileSync(TARGET_PATH, JSON.stringify(records, null, 2), 'utf-8')

  console.log(`\n--- DONE ---`)
  console.log(`${fixed}/${targets.length} fixed, ${failed} failed`)

  if (lastFixed) {
    console.log(`\n--- SAMPLE: ${lastFixed.number} (framework) ---`)
    console.log(JSON.stringify({
      problem_number: lastFixed.number,
      decomposition_type: 'framework',
      question_analysis: lastFixed.entry.question_analysis,
      solution_steps: lastFixed.steps,
    }, null, 2))
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
