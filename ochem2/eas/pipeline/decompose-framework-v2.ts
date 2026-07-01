import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'
import { z } from 'zod'
import { SolutionStepSchema } from './schema.js'

const client = new Anthropic()
const TARGET_PATH = 'ochem2/eas/corpus/decomposed/eas-smith-decomposed.json'

const SYSTEM_PROMPT = `You are writing expert reasoning FRAMEWORK steps for a class of organic chemistry exam problem.

You are NOT solving the specific problem. You are writing the COGNITIVE FRAMEWORK — the ordered thinking moves an expert runs on ANY problem of this class.

HARD RULES:
1. GENERATIVE RULE FIRST. Every "why" opens with the underlying principle, not a consequence.
2. PLAIN ENGLISH. Define every organic chemistry term inline: term (plain-English definition).
3. Use "attached," never "hanging off."
4. THINKING MOVES only. "do_this" names what an expert DECIDES. Not "draw X" but "Identify which position is most electron-rich."
5. RE-EXPRESS in your own words. Never copy the source text.

OUTPUT FORMAT: Return ONLY a valid JSON array. No preamble, no explanation, no markdown fences. Start with [ and end with ].

Each element of the array is an object with:
  "do_this": string   — one cognitive action, imperative
  "why": string       — the generative rule behind this action, principle first
  "vocab": object     — optional, maps term strings to one-sentence definitions

Minimum 3 elements. Maximum 5. Start your response with [ immediately.`

const StepsSchema = z.array(SolutionStepSchema)

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

async function generateFramework(entry: RecordEntry): Promise<z.infer<typeof StepsSchema>> {
  const qa = entry.question_analysis

  const userPrompt = `Generate 3–5 expert reasoning FRAMEWORK steps for this class of organic chemistry problem. Return ONLY a JSON array starting with [.

WHAT THIS PROBLEM CLASS TESTS:
Skill: ${qa.skill_tested}
Disguise: ${qa.disguise}
Recognition: ${qa.recognition_cue}

PROBLEM TEXT (type context only — specific structures are missing):
${entry.question_text_raw}

Write framework steps — generic cognitive moves for ANY problem of this class. Output JSON array only.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in response')
  }

  // Extract JSON array — tolerate markdown fences if model adds them
  const text = textBlock.text.trim()
  const jsonStart = text.indexOf('[')
  const jsonEnd = text.lastIndexOf(']')
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`No JSON array found. Response was: ${text.slice(0, 200)}`)
  }

  const raw = JSON.parse(text.slice(jsonStart, jsonEnd + 1))
  const parsed = StepsSchema.parse(raw)

  if (parsed.length < 2) {
    throw new Error(`Only ${parsed.length} step(s)`)
  }
  return parsed
}

async function main() {
  const records = JSON.parse(readFileSync(TARGET_PATH, 'utf-8')) as RecordEntry[]

  const targets = records.filter(r => !r.solution_steps || r.solution_steps.length === 0)
  console.log(`Framework v2 pass: ${targets.length} entries (plain JSON, no tool use)`)

  let fixed = 0
  let failed = 0
  let lastFixed: { number: string; entry: RecordEntry; steps: unknown[] } | null = null

  for (let i = 0; i < targets.length; i++) {
    const entry = targets[i]
    process.stdout.write(`[${i + 1}/${targets.length}] ${entry.problem_number}... `)

    try {
      const steps = await generateFramework(entry)
      const idx = records.findIndex(r => r.id === entry.id)
      records[idx] = { ...records[idx], solution_steps: steps }
      fixed++
      lastFixed = { number: entry.problem_number, entry: records[idx] as RecordEntry, steps }
      console.log(`ok (${steps.length} steps)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`FAILED: ${msg.slice(0, 120)}`)
      failed++
    }

    if (i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 100))
    }
  }

  // Stamp decomposition_type on all 46 entries
  const frameworkIds = new Set(targets.map(t => t.id))
  for (const r of records) {
    if (!r.decomposition_type) {
      r.decomposition_type = frameworkIds.has(r.id) ? 'framework' : 'specific'
    }
    // Entries fixed this pass are framework
    if (frameworkIds.has(r.id) && r.solution_steps && (r.solution_steps as unknown[]).length > 0) {
      r.decomposition_type = 'framework'
    }
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
