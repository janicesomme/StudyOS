import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { z } from 'zod'

// ── Env ───────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ── Zod schemas ───────────────────────────────────────────────────────────────

const SolutionStepSchema = z.object({
  do_this: z.string().min(1),
  why: z.string().min(1),
  vocab: z.record(z.string(), z.string()).optional(),
})

const QuestionAnalysisSchema = z.object({
  skill_tested: z.string(),
  disguise: z.string(),
  recognition_cue: z.string(),
})

const DecomposedProblemSchema = z.object({
  id: z.string(),
  source: z.string(),
  chapter: z.number(),
  problem_number: z.string(),
  question_text_raw: z.string(),
  solution_text_raw: z.string(),
  solution_status: z.enum(['solved', 'unsolved']),
  has_missing_structure: z.boolean(),
  question_analysis: QuestionAnalysisSchema,
  prior_knowledge_needed: z.array(z.string()),
  solution_steps: z.array(SolutionStepSchema).min(1),
  decomposition_type: z.enum(['specific', 'framework']),
}).passthrough()

type DecomposedProblem = z.infer<typeof DecomposedProblemSchema>

// ── Load + validate ───────────────────────────────────────────────────────────

const SOURCE_FILES = [
  'ochem2/eas/corpus/decomposed/eas-smith-decomposed.json',
  'ochem2/eas/corpus/decomposed/eas-klein-decomposed.json',
  'ochem2/eas/corpus/decomposed/eas-mcmurry-decomposed.json',
]

function loadAndValidate(): { valid: DecomposedProblem[]; skipped: string[] } {
  const valid: DecomposedProblem[] = []
  const skipped: string[] = []

  for (const file of SOURCE_FILES) {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as unknown[]
    console.log(`${file}: ${raw.length} records`)

    for (const entry of raw) {
      const result = DecomposedProblemSchema.safeParse(entry)
      if (result.success) {
        valid.push(result.data)
      } else {
        const id = (entry as { id?: string }).id ?? '(unknown)'
        const msg = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
        skipped.push(`${id}: ${msg}`)
      }
    }
  }

  return { valid, skipped }
}

// ── Insert helpers ────────────────────────────────────────────────────────────

async function upsertProblems(problems: DecomposedProblem[]): Promise<number> {
  const rows = problems.map(p => ({
    id: p.id,
    source: p.source,
    chapter: p.chapter,
    problem_number: p.problem_number,
    question_text_raw: p.question_text_raw,
    solution_text_raw: p.solution_text_raw,
    question_analysis: p.question_analysis,
    prior_knowledge_needed: p.prior_knowledge_needed,
    decomposition_type: p.decomposition_type,
    solution_status: p.solution_status,
    has_missing_structure: p.has_missing_structure,
  }))

  // Batch in chunks of 50 to stay well under payload limits
  const CHUNK = 50
  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error } = await supabase
      .from('o2_eas_problems')
      .upsert(chunk, { onConflict: 'id' })
    if (error) throw new Error(`problems upsert failed (chunk ${i}): ${error.message}`)
    inserted += chunk.length
    process.stdout.write(`  problems ${inserted}/${rows.length}\r`)
  }
  return inserted
}

async function upsertSteps(problems: DecomposedProblem[]): Promise<number> {
  const rows = problems.flatMap(p =>
    p.solution_steps.map((step, idx) => ({
      problem_id: p.id,
      step_order: idx + 1,
      do_this: step.do_this,
      why: step.why,
      vocab: step.vocab ?? null,
    }))
  )

  const CHUNK = 100
  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error } = await supabase
      .from('o2_eas_solution_steps')
      .upsert(chunk, { onConflict: 'problem_id,step_order' })
    if (error) throw new Error(`steps upsert failed (chunk ${i}): ${error.message}`)
    inserted += chunk.length
    process.stdout.write(`  steps ${inserted}/${rows.length}\r`)
  }
  return inserted
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Loading and validating...')
  const { valid, skipped } = loadAndValidate()

  console.log(`\nValidation: ${valid.length} ok, ${skipped.length} skipped`)
  if (skipped.length) {
    skipped.forEach(s => console.log('  SKIP:', s))
  }

  if (valid.length === 0) {
    console.error('Nothing to insert.')
    process.exit(1)
  }

  console.log('\nInserting problems...')
  const problemCount = await upsertProblems(valid)

  console.log('\nInserting solution steps...')
  const stepCount = await upsertSteps(valid)

  console.log('\n\n=== DONE ===')
  console.log(`o2_eas_problems:       ${problemCount} rows`)
  console.log(`o2_eas_solution_steps: ${stepCount} rows`)
  console.log(`o2_eas_images:         0 rows (empty — populate later)`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
