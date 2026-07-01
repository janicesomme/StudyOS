import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { z } from 'zod'
import { QuestionAnalysisSchema, SolutionStepSchema } from './schema.js'

const client = new Anthropic()

const SPECIFIC_SYSTEM = `You are an expert organic chemistry tutor decomposing end-of-chapter exam problems into structured expert thinking for a student learning platform.

Return ONLY a valid JSON object. No preamble. No markdown fences. Start with {.

HARD RULES:
1. GENERATIVE RULE FIRST. Every "why" opens with the underlying principle, then its consequences. Never "because X has Y" — always start with the rule itself: "The rule is: X always..."
2. PLAIN ENGLISH. Define every organic chemistry term inline the first time: term (plain-English definition).
3. Use "attached," never "hanging off."
4. THINKING MOVES only. "do_this" names what an expert DECIDES — the reasoning action, not the mechanical step. Good: "Identify which substituent is electron-donating." Bad: "React benzene with Br2."
5. RE-EXPRESS everything in your own words. Never copy source text. Copyright firewall.
6. skill_tested: ONE skill, stated as what the student must DO — not just the reaction name.
7. recognition_cue: SPECIFIC surface pattern that fires the expert framework — be concrete.
8. solution_steps: 3–5 ordered steps, each one thinking action. ALWAYS at least 3.

Output this exact JSON structure:
{
  "question_analysis": {
    "skill_tested": "...",
    "disguise": "...",
    "recognition_cue": "..."
  },
  "prior_knowledge_needed": ["...", "..."],
  "solution_steps": [
    { "do_this": "...", "why": "...", "vocab": { "term": "one-sentence definition" } }
  ]
}

Start your response with { immediately.`

const FRAMEWORK_SYSTEM = `You are writing expert reasoning FRAMEWORK steps for a class of organic chemistry exam problem.

You are NOT solving the specific problem. You are writing the COGNITIVE FRAMEWORK — the ordered thinking moves an expert runs on ANY problem of this class.

Return ONLY a valid JSON object. No preamble. No markdown fences. Start with {.

HARD RULES:
1. GENERATIVE RULE FIRST. Every "why" opens with the underlying principle, then its consequences.
2. PLAIN ENGLISH. Define every organic chemistry term inline: term (plain-English definition).
3. Use "attached," never "hanging off."
4. THINKING MOVES only. "do_this" names what an expert DECIDES — the reasoning action.
5. RE-EXPRESS in your own words. Never copy source text.
6. skill_tested: ONE skill, stated as what the student must DO.
7. recognition_cue: SPECIFIC surface pattern that fires the expert framework — be concrete.
8. solution_steps: 3–5 FRAMEWORK moves — cognitive steps an expert runs on ANY problem of this class. Do NOT solve the specific problem. Do NOT reference specific structures you cannot see.

Output this exact JSON structure:
{
  "question_analysis": {
    "skill_tested": "...",
    "disguise": "...",
    "recognition_cue": "..."
  },
  "prior_knowledge_needed": ["...", "..."],
  "solution_steps": [
    { "do_this": "...", "why": "...", "vocab": { "term": "one-sentence definition" } }
  ]
}

Start your response with { immediately.`

const DecompositionSchema = z.object({
  question_analysis: QuestionAnalysisSchema,
  prior_knowledge_needed: z.array(z.string()).default([]),
  solution_steps: z.array(SolutionStepSchema),
})

type Decomposition = z.infer<typeof DecompositionSchema>

interface RawProblem {
  id: string
  source: string
  chapter: number
  problem_number: string
  question_text_raw: string
  solution_text_raw: string
  pairing_confidence: string
  solution_status: string
  pairing_note?: string
  has_missing_structure: boolean
  [key: string]: unknown
}

interface DecomposedEntry extends RawProblem {
  question_analysis: { skill_tested: string; disguise: string; recognition_cue: string }
  prior_knowledge_needed: string[]
  solution_steps: unknown[]
  decomposition_type: 'specific' | 'framework'
}

function isSpecific(entry: RawProblem): boolean {
  // Klein embeds worked examples with "SOLUTION" in question_text_raw
  if (entry.question_text_raw.includes('SOLUTION')) return true
  // McMurry and Klein entries with substantive solution text
  if (entry.solution_text_raw.trim().length > 150) return true
  return false
}

async function decompose(
  entry: RawProblem,
  specific: boolean
): Promise<Decomposition> {
  const system = specific ? SPECIFIC_SYSTEM : FRAMEWORK_SYSTEM
  const modeNote = specific
    ? 'Decompose the specific reasoning for this problem.'
    : 'Write the cognitive FRAMEWORK — moves for ANY problem of this class. Do NOT solve this specific problem.'

  const structureNote = entry.has_missing_structure
    ? '\n\nNOTE: Chemical structure diagrams from the original are absent from the text. Where structures are essential, describe the TYPE of thinking an expert applies without inventing structural details.'
    : ''

  const userPrompt = `${modeNote}

PROBLEM (re-express everything, copy nothing):
${entry.question_text_raw}

SOLUTION REFERENCE (internal only — never copy):
${entry.solution_text_raw || '[No solution text captured]'}
${structureNote}

Return ONE JSON object starting with {.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in response')
  }

  const text = textBlock.text.trim()
  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`No JSON object found. Response: ${text.slice(0, 200)}`)
  }

  const raw = JSON.parse(text.slice(jsonStart, jsonEnd + 1))
  const parsed = DecompositionSchema.parse(raw)

  if (parsed.solution_steps.length < 2) {
    throw new Error(`Only ${parsed.solution_steps.length} step(s) returned`)
  }

  return parsed
}

async function processBook(
  inputPath: string,
  outputPath: string,
  bookLabel: string
): Promise<{ solved: number; decomposed: number; failed: number; firstGood: DecomposedEntry | null }> {
  const problems = JSON.parse(readFileSync(inputPath, 'utf-8')) as RawProblem[]
  const solved = problems.filter(p => p.solution_status === 'solved')

  console.log(`\n=== ${bookLabel} ===`)
  console.log(`Total: ${problems.length} | Solved: ${solved.length}`)

  const results: DecomposedEntry[] = []
  const failures: string[] = []

  for (let i = 0; i < solved.length; i++) {
    const p = solved[i]
    const specific = isSpecific(p)
    const mode = specific ? 'specific' : 'framework'
    process.stdout.write(`[${i + 1}/${solved.length}] ${p.problem_number} (${mode})... `)

    try {
      const decomp = await decompose(p, specific)
      const entry: DecomposedEntry = {
        ...p,
        ...decomp,
        decomposition_type: specific ? 'specific' : 'framework',
      }
      results.push(entry)
      console.log(`ok (${decomp.solution_steps.length} steps)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`FAILED: ${msg.slice(0, 120)}`)
      failures.push(`${p.problem_number}: ${msg}`)
      results.push({
        ...p,
        question_analysis: { skill_tested: '', disguise: '', recognition_cue: '' },
        prior_knowledge_needed: [],
        solution_steps: [],
        decomposition_type: specific ? 'specific' : 'framework',
      })
    }

    if (i < solved.length - 1) {
      await new Promise(r => setTimeout(r, 100))
    }
  }

  writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8')

  const decomposed = results.filter(r => r.solution_steps.length > 0).length
  const firstGood = results.find(r => r.solution_steps.length > 0) ?? null

  console.log(`\n${bookLabel}: ${decomposed}/${solved.length} ok, ${failures.length} failed`)
  if (failures.length) {
    failures.forEach(f => console.log('  FAIL:', f))
  }

  return { solved: solved.length, decomposed, failed: failures.length, firstGood }
}

async function main() {
  const OUTPUT_DIR = 'ochem2/eas/corpus/decomposed'
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const kleinStats = await processBook(
    'ochem2/eas/corpus/eas-klein.json',
    `${OUTPUT_DIR}/eas-klein-decomposed.json`,
    'Klein 3e'
  )

  const mcmurryStats = await processBook(
    'ochem2/eas/corpus/eas-mcmurry.json',
    `${OUTPUT_DIR}/eas-mcmurry-decomposed.json`,
    'McMurry 8e'
  )

  console.log('\n=== ALL DONE ===')
  console.log(`Klein:   ${kleinStats.decomposed}/${kleinStats.solved} decomposed, ${kleinStats.failed} failed`)
  console.log(`McMurry: ${mcmurryStats.decomposed}/${mcmurryStats.solved} decomposed, ${mcmurryStats.failed} failed`)

  if (kleinStats.firstGood) {
    const s = kleinStats.firstGood
    console.log('\n--- KLEIN SAMPLE ---')
    console.log(JSON.stringify({
      problem_number: s.problem_number,
      decomposition_type: s.decomposition_type,
      question_analysis: s.question_analysis,
      solution_steps: [s.solution_steps[0]],
    }, null, 2))
  }

  if (mcmurryStats.firstGood) {
    const s = mcmurryStats.firstGood
    console.log('\n--- McMURRY SAMPLE ---')
    console.log(JSON.stringify({
      problem_number: s.problem_number,
      decomposition_type: s.decomposition_type,
      question_analysis: s.question_analysis,
      solution_steps: [s.solution_steps[0]],
    }, null, 2))
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
