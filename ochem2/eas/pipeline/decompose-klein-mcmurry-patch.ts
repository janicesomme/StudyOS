import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'
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
8. solution_steps: 3–5 FRAMEWORK moves — cognitive steps an expert runs on ANY problem of this class. Do NOT solve the specific problem.

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

interface DecomposedEntry {
  id: string
  problem_number: string
  question_text_raw: string
  solution_text_raw: string
  has_missing_structure: boolean
  decomposition_type: 'specific' | 'framework'
  solution_steps: unknown[]
  [key: string]: unknown
}

async function decompose(entry: DecomposedEntry): Promise<Decomposition> {
  const specific = entry.decomposition_type === 'specific'
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
${String(entry.solution_text_raw) || '[No solution text captured]'}
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

async function patchFile(filePath: string, label: string): Promise<{ fixed: number; stillFailed: number }> {
  const records = JSON.parse(readFileSync(filePath, 'utf-8')) as DecomposedEntry[]
  const targets = records.filter(r => !r.solution_steps || r.solution_steps.length === 0)

  console.log(`\n=== ${label} patch ===`)
  console.log(`${targets.length} empty entries to retry`)

  let fixed = 0
  let stillFailed = 0

  for (let i = 0; i < targets.length; i++) {
    const entry = targets[i]
    process.stdout.write(`[${i + 1}/${targets.length}] ${entry.problem_number} (${entry.decomposition_type})... `)

    try {
      const decomp = await decompose(entry)
      const idx = records.findIndex(r => r.id === entry.id)
      records[idx] = {
        ...records[idx],
        question_analysis: decomp.question_analysis,
        prior_knowledge_needed: decomp.prior_knowledge_needed,
        solution_steps: decomp.solution_steps,
      }
      fixed++
      console.log(`ok (${decomp.solution_steps.length} steps)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`FAILED: ${msg.slice(0, 120)}`)
      stillFailed++
    }

    // Longer delay to avoid overload
    if (i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 800))
    }
  }

  writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8')
  console.log(`${label}: ${fixed}/${targets.length} fixed, ${stillFailed} still failed`)

  return { fixed, stillFailed }
}

async function main() {
  const kleinResult = await patchFile(
    'ochem2/eas/corpus/decomposed/eas-klein-decomposed.json',
    'Klein 3e'
  )

  const mcmurryResult = await patchFile(
    'ochem2/eas/corpus/decomposed/eas-mcmurry-decomposed.json',
    'McMurry 8e'
  )

  console.log('\n=== PATCH DONE ===')
  console.log(`Klein:   ${kleinResult.fixed} fixed, ${kleinResult.stillFailed} still failed`)
  console.log(`McMurry: ${mcmurryResult.fixed} fixed, ${mcmurryResult.stillFailed} still failed`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
