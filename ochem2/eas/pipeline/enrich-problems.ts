import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { z } from 'zod'

// ── TOPIC_ENUM ────────────────────────────────────────────────────────────────
//
// EDIT THIS before running --enrich.
// 1. Run --propose (full run, no --dry-run).
// 2. Review ochem2/eas/pipeline/topic-proposals.json.
// 3. Consolidate/rename into your final labels and add them here.
// 4. Then run --enrich.
//
const TOPIC_ENUM = [
  'Activating & Deactivating Groups',
  'Directing Effects (Ortho/Para vs Meta)',
  'Multi-Substituent Competition',
  'Synthesis Planning & Sequencing',
  'Blocking & Protecting Groups',
  'Electrophile Generation (Friedel-Crafts)',
  'Nucleophilic Aromatic Substitution (SNAr)',
  'Benzyne Mechanism',
  'Sigma Complex & Arenium Ion Stability',
  'NMR & Structure Determination',
] as const

// ── Config ────────────────────────────────────────────────────────────────────

const HAIKU  = 'claude-haiku-4-5-20251001'
const SONNET = 'claude-sonnet-4-6'

const PRICING: Record<string, { input: number; output: number }> = {
  [HAIKU]:  { input: 0.80, output: 4.00 },
  [SONNET]: { input: 3.00, output: 15.00 },
}

const P1_EST   = { input: 500, output: 25  }   // per problem, Phase 1
const P2_EST   = { input: 900, output: 350 }   // per problem, Phase 2
const EST_ROWS = 157
const DRY_LIMIT = 3

// ── CLI flags ─────────────────────────────────────────────────────────────────

const ARGV    = process.argv.slice(2)
const PROPOSE = ARGV.includes('--propose')
const ENRICH  = ARGV.includes('--enrich')
const DRY_RUN = ARGV.includes('--dry-run')

// ── Types ─────────────────────────────────────────────────────────────────────

type DbProblem = {
  id: string
  question_text_raw: string
  solution_text_raw: string
  question_analysis: { skill_tested: string; disguise: string; recognition_cue: string } | null
  topic: string | null
}

type DbStep = {
  problem_id: string
  step_order: number
  do_this: string
  why: string
}

type EnrichmentOutput = {
  topic: string
  difficulty: number
  high_yield: boolean
  hint_1: string
  hint_2: string
  checklist_hint: string
  common_trap: string
  memory_trick: string
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const TopicProposalSchema = z.object({
  topic: z.string().min(1).max(60),
})

function buildEnrichmentSchema(topicEnum: readonly string[]) {
  return z.object({
    topic: z.enum(topicEnum as [string, ...string[]]),
    difficulty: z.number().int().min(1).max(10),
    high_yield: z.boolean(),
    hint_1: z.string().min(10).refine(
      v => v.startsWith('Look for') || v.startsWith('You will see'),
      { message: 'hint_1 must start with "Look for" or "You will see"' },
    ),
    hint_2: z.string().min(10),
    checklist_hint: z.string().refine(
      v => !/(consider|think about)/i.test(v),
      { message: 'checklist_hint must not contain "consider" or "think about"' },
    ),
    common_trap: z.string().min(10),
    memory_trick: z.string().min(5),
  })
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const PROPOSE_TOOL: Anthropic.Tool = {
  name: 'propose_topic',
  description: 'Propose a 2-5 word topic label for an EAS practice problem',
  input_schema: {
    type: 'object' as const,
    properties: {
      topic: {
        type: 'string',
        description:
          'A 2-5 word topic label for the TYPE of EAS reasoning this problem tests. Think in terms of skills, not reactions. Examples: "EAS regiochemistry", "activating and deactivating groups", "directing effects", "intramolecular acylation", "multi-substituent analysis".',
      },
    },
    required: ['topic'],
  },
}

function buildEnrichTool(topicEnum: readonly string[]): Anthropic.Tool {
  return {
    name: 'enrich_problem',
    description: 'Output pedagogy enrichment fields for an EAS practice problem',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: {
          type: 'string',
          enum: [...topicEnum],
          description: 'Which topic this problem belongs to — must be exactly one of the allowed values',
        },
        difficulty: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          description:
            '1 = immediate pattern recognition, 10 = multi-step inference with an unusual prerequisite. Most EAS problems fall between 3 and 7.',
        },
        high_yield: {
          type: 'boolean',
          description:
            'true if this skill pattern appears across multiple problems in the corpus or is a classic exam staple that students must master',
        },
        hint_1: {
          type: 'string',
          description:
            'A surface-level nudge. MUST start with "Look for" or "You will see". Must NOT reveal the reasoning move or the answer — surface observation only.',
        },
        hint_2: {
          type: 'string',
          description:
            'The next reasoning move — what to DO with the observation from hint_1. Stronger but still not the complete answer.',
        },
        checklist_hint: {
          type: 'string',
          description:
            'Numbered action steps. Every item must start with an action verb. NEVER use "consider" or "think about". Example: "1. Identify the substituent attached to the ring. 2. Classify it as electron-donating or electron-withdrawing. 3. Apply the directing rule to find ortho/para or meta positions."',
        },
        common_trap: {
          type: 'string',
          description:
            'The specific wrong action students actually take — not a knowledge gap. Describe what they do wrong. Good: "Students draw the incoming group at the meta position because they confuse the carbonyl (C=O) with an electron-donating group." Bad: "Students do not understand directing effects."',
        },
        memory_trick: {
          type: 'string',
          description:
            '1-2 sentences MAX, speakable aloud in 5 seconds. A mnemonic or pattern-trigger. No filler. Example: "Oxygen shares — EDG, ortho/para. Carbonyl takes — EWG, meta."',
        },
      },
      required: [
        'topic', 'difficulty', 'high_yield',
        'hint_1', 'hint_2', 'checklist_hint',
        'common_trap', 'memory_trick',
      ],
    },
  }
}

// ── System prompts ────────────────────────────────────────────────────────────

const ENRICH_SYSTEM = `You are an expert organic chemistry tutor writing pedagogy content for a practice platform.

VOICE RULES — HARD REQUIREMENTS, no exceptions:
1. Plain English leads. Every organic chemistry term appears in parentheses after its plain-English equivalent on first use in each field: "electron-donating groups (groups that push electrons toward the ring)".
2. Never leave jargon unexplained in any field. Treat each field as if the reader has not read the others.
3. No unexplained abbreviations anywhere.
4. Write as if speaking to a student who just got this question wrong.

FIELD RULES:
- hint_1: MUST begin with "Look for" or "You will see". Surface observation only — no reasoning move, no answer.
- hint_2: Name the reasoning move — what to DO with the observation. Still not the final answer.
- checklist_hint: Numbered action steps with action verbs only. "Consider" and "think about" are banned from every step.
- common_trap: Describe the wrong action students take, not what they fail to know.
- memory_trick: 1-2 sentences MAX, speakable in under 5 seconds. No filler phrases.
- difficulty 1-10: 1 = immediate pattern match, 10 = rare multi-step inference.
- high_yield: true when this pattern recurs across many problems or is a classic exam staple.`

// ── Cost tracking ─────────────────────────────────────────────────────────────

let runModel        = ''
let runInputTokens  = 0
let runOutputTokens = 0

function trackUsage(usage: { input_tokens: number; output_tokens: number }) {
  runInputTokens  += usage.input_tokens
  runOutputTokens += usage.output_tokens
}

function runningCost(): number {
  const p = PRICING[runModel]
  if (!p) return 0
  return (runInputTokens * p.input + runOutputTokens * p.output) / 1_000_000
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ── Plan printout ─────────────────────────────────────────────────────────────

function printPlan(): void {
  const p1cost = (
    EST_ROWS * P1_EST.input  * PRICING[HAIKU].input +
    EST_ROWS * P1_EST.output * PRICING[HAIKU].output
  ) / 1_000_000

  const p2cost = (
    EST_ROWS * P2_EST.input  * PRICING[SONNET].input +
    EST_ROWS * P2_EST.output * PRICING[SONNET].output
  ) / 1_000_000

  console.log(`
===================================================================
  enrich-problems.ts  —  EAS pedagogy enrichment
===================================================================

Fills: topic, difficulty, high_yield, hint_1, hint_2,
       checklist_hint, common_trap, memory_trick
Table: o2_eas_problems (~${EST_ROWS} rows)
Skip:  rows with topic already set (idempotent)

USAGE
  npm run enrich-eas-problems -- --propose [--dry-run]
  npm run enrich-eas-problems -- --enrich  [--dry-run]
  --dry-run  limits to ${DRY_LIMIT} problems; combine with either flag

WORKFLOW
  1. Run --propose          → generates topic-proposals.json
  2. Review + edit TOPIC_ENUM at top of this file
  3. Run --enrich           → writes all 8 fields to DB

PHASE 1  --propose
  Model:        ${HAIKU}
  Problems:     ~${EST_ROWS}
  Est. tokens:  ${(EST_ROWS * P1_EST.input).toLocaleString()} in / ${(EST_ROWS * P1_EST.output).toLocaleString()} out
  Rates:        \$${PRICING[HAIKU].input}/MTok in,  \$${PRICING[HAIKU].output}/MTok out
  Est. cost:    \$${p1cost.toFixed(3)}

PHASE 2  --enrich
  Model:        ${SONNET}
  Problems:     ~${EST_ROWS} (skips rows where topic is already set)
  Est. tokens:  ${(EST_ROWS * P2_EST.input).toLocaleString()} in / ${(EST_ROWS * P2_EST.output).toLocaleString()} out
  Rates:        \$${PRICING[SONNET].input}/MTok in, \$${PRICING[SONNET].output}/MTok out
  Est. cost:    \$${p2cost.toFixed(3)}

TOTAL ESTIMATE  \$${(p1cost + p2cost).toFixed(3)}

No API calls are made without --propose or --enrich.
===================================================================
`)
}

// ── Phase 1 ───────────────────────────────────────────────────────────────────

async function proposeLabel(anthropic: Anthropic, p: DbProblem): Promise<string> {
  const qa = p.question_analysis!
  const userPrompt = `Propose a 2-5 word topic label for this EAS practice problem.

Skill tested: ${qa.skill_tested}
Recognition cue: ${qa.recognition_cue}
Question (first 300 chars): ${p.question_text_raw.slice(0, 300)}

The label must name the TYPE of EAS reasoning required — a skill category, not a reaction name.`

  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 60,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [PROPOSE_TOOL],
    tool_choice: { type: 'tool', name: 'propose_topic' },
  })

  trackUsage(response.usage)

  const block = response.content.find(b => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') throw new Error('No tool_use block')

  return TopicProposalSchema.parse(block.input).topic
}

async function phase1(anthropic: Anthropic, problems: DbProblem[]): Promise<void> {
  runModel = HAIKU
  const eligible = problems.filter(p => p.question_analysis !== null)
  const subset   = DRY_RUN ? eligible.slice(0, DRY_LIMIT) : eligible

  console.log(`\nPhase 1 — topic proposals`)
  console.log(`Model:    ${HAIKU}`)
  console.log(`Problems: ${subset.length}${DRY_RUN ? ` (dry-run, limit ${DRY_LIMIT})` : ''}\n`)

  const labels: string[] = []
  const failures: string[] = []

  for (let i = 0; i < subset.length; i++) {
    const p = subset[i]
    process.stdout.write(`[${i + 1}/${subset.length}] ${p.id}... `)
    try {
      const label = await proposeLabel(anthropic, p)
      labels.push(label)
      process.stdout.write(`"${label}"  |  running: $${runningCost().toFixed(4)}\n`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`FAILED: ${msg}\n`)
      failures.push(`${p.id}: ${msg}`)
    }
    if (i < subset.length - 1) await delay(80)
  }

  // Frequency sort
  const freq = new Map<string, number>()
  for (const l of labels) freq.set(l, (freq.get(l) ?? 0) + 1)
  const sorted = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => ({ topic, count }))

  console.log('\nTopic proposals (frequency sorted):')
  sorted.forEach(({ topic, count }) =>
    console.log(`  ${String(count).padStart(3)}x  ${topic}`),
  )

  if (!DRY_RUN) {
    const outPath = 'ochem2/eas/pipeline/topic-proposals.json'
    writeFileSync(outPath, JSON.stringify(sorted, null, 2), 'utf-8')
    console.log(`\nSaved: ${outPath}`)
  } else {
    console.log('\n(dry-run — topic-proposals.json not written)')
  }

  console.log(`\n--- Phase 1 done ---`)
  console.log(`Labeled: ${labels.length}  |  Failed: ${failures.length}`)
  console.log(`Tokens:  ${runInputTokens.toLocaleString()} in / ${runOutputTokens.toLocaleString()} out`)
  console.log(`Cost:    $${runningCost().toFixed(4)}`)
  if (failures.length) failures.forEach(f => console.log(`  FAIL: ${f}`))
}

// ── Phase 2 ───────────────────────────────────────────────────────────────────

async function enrichProblem(
  anthropic: Anthropic,
  p: DbProblem,
  steps: DbStep[],
  enrichTool: Anthropic.Tool,
  schema: ReturnType<typeof buildEnrichmentSchema>,
): Promise<EnrichmentOutput> {
  const qa = p.question_analysis!

  const stepsText = steps
    .slice()
    .sort((a, b) => a.step_order - b.step_order)
    .map((s, i) => `${i + 1}. DO: ${s.do_this}\n   WHY: ${s.why}`)
    .join('\n\n')

  const userPrompt = `Enrich this EAS practice problem with pedagogy fields.

QUESTION:
${p.question_text_raw}

SOLUTION REFERENCE (internal — re-express everything, never copy):
${p.solution_text_raw || '[not captured]'}

SKILL ANALYSIS:
Skill tested:    ${qa.skill_tested}
Disguise:        ${qa.disguise}
Recognition cue: ${qa.recognition_cue}

SOLUTION STEPS:
${stepsText || '[no steps available]'}`

  const response = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 1200,
    system: ENRICH_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [enrichTool],
    tool_choice: { type: 'tool', name: 'enrich_problem' },
  })

  trackUsage(response.usage)

  const block = response.content.find(b => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') throw new Error('No tool_use block')

  return schema.parse(block.input) as EnrichmentOutput
}

async function phase2(
  anthropic: Anthropic,
  supabase: ReturnType<typeof createClient>,
  problems: DbProblem[],
  stepsByProblem: Map<string, DbStep[]>,
): Promise<void> {
  if (TOPIC_ENUM.length === 0) {
    console.error('\nERROR: TOPIC_ENUM is empty.')
    console.error('Run --propose first, review ochem2/eas/pipeline/topic-proposals.json,')
    console.error('then edit TOPIC_ENUM at the top of this file before running --enrich.\n')
    process.exit(1)
  }

  runModel = SONNET
  const enrichTool = buildEnrichTool(TOPIC_ENUM)
  const schema     = buildEnrichmentSchema(TOPIC_ENUM)

  const eligible = problems.filter(p => p.topic === null)
  const subset   = DRY_RUN ? eligible.slice(0, DRY_LIMIT) : eligible

  console.log(`\nPhase 2 — enrichment`)
  console.log(`Model:              ${SONNET}`)
  console.log(`Problems to enrich: ${subset.length}${DRY_RUN ? ` (dry-run, limit ${DRY_LIMIT})` : ''}`)
  console.log(`Already enriched:   ${problems.length - eligible.length} (skipped)`)
  console.log(`TOPIC_ENUM:         [${[...TOPIC_ENUM].join(', ')}]\n`)

  let updated = 0
  const failures: string[] = []

  for (let i = 0; i < subset.length; i++) {
    const p = subset[i]
    process.stdout.write(`[${i + 1}/${subset.length}] ${p.id}... `)
    try {
      const enrichment = await enrichProblem(
        anthropic, p, stepsByProblem.get(p.id) ?? [], enrichTool, schema,
      )

      if (!DRY_RUN) {
        const { error } = await supabase
          .from('o2_eas_problems')
          .update({
            topic:          enrichment.topic,
            difficulty:     enrichment.difficulty,
            high_yield:     enrichment.high_yield,
            hint_1:         enrichment.hint_1,
            hint_2:         enrichment.hint_2,
            checklist_hint: enrichment.checklist_hint,
            common_trap:    enrichment.common_trap,
            memory_trick:   enrichment.memory_trick,
          })
          .eq('id', p.id)
        if (error) throw new Error(`DB update: ${error.message}`)
      }

      updated++
      process.stdout.write(
        `ok [${enrichment.topic}, diff:${enrichment.difficulty}]  |  running: $${runningCost().toFixed(4)}\n`,
      )
      if (DRY_RUN) {
        console.log(`\n  topic:          ${enrichment.topic}`)
        console.log(`  difficulty:     ${enrichment.difficulty}`)
        console.log(`  high_yield:     ${enrichment.high_yield}`)
        console.log(`  hint_1:         ${enrichment.hint_1}`)
        console.log(`  hint_2:         ${enrichment.hint_2}`)
        console.log(`  checklist_hint: ${enrichment.checklist_hint}`)
        console.log(`  common_trap:    ${enrichment.common_trap}`)
        console.log(`  memory_trick:   ${enrichment.memory_trick}\n`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`FAILED: ${msg}\n`)
      failures.push(`${p.id}: ${msg}`)
    }
    if (i < subset.length - 1) await delay(200)
  }

  console.log(`\n--- Phase 2 done ---`)
  console.log(`Updated:  ${updated}  |  Failed: ${failures.length}`)
  console.log(`Tokens:   ${runInputTokens.toLocaleString()} in / ${runOutputTokens.toLocaleString()} out`)
  console.log(`Cost:     $${runningCost().toFixed(4)}`)
  if (DRY_RUN) console.log(`(dry-run — no DB writes)`)
  if (failures.length) failures.forEach(f => console.log(`  FAIL: ${f}`))
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!PROPOSE && !ENRICH) {
    printPlan()
    return
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    console.error('Invoke via: npm run enrich-eas-problems -- --propose')
    process.exit(1)
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY')
    process.exit(1)
  }

  const anthropic = new Anthropic()
  const supabase  = createClient(url, key)

  process.stdout.write('Fetching o2_eas_problems... ')
  const { data: rows, error: fetchErr } = await supabase
    .from('o2_eas_problems')
    .select('id, question_text_raw, solution_text_raw, question_analysis, topic')
    .order('source')
    .order('chapter')
    .order('problem_number')

  if (fetchErr) { console.error(fetchErr.message); process.exit(1) }
  const problems = rows as DbProblem[]
  console.log(`${problems.length} rows`)

  if (PROPOSE) {
    await phase1(anthropic, problems)
    return
  }

  if (ENRICH) {
    process.stdout.write('Fetching o2_eas_solution_steps... ')
    const { data: stepRows, error: stepsErr } = await supabase
      .from('o2_eas_solution_steps')
      .select('problem_id, step_order, do_this, why')

    if (stepsErr) { console.error(stepsErr.message); process.exit(1) }

    const stepsByProblem = new Map<string, DbStep[]>()
    for (const s of stepRows as DbStep[]) {
      const list = stepsByProblem.get(s.problem_id) ?? []
      list.push(s)
      stepsByProblem.set(s.problem_id, list)
    }
    console.log(`${(stepRows as DbStep[]).length} steps across ${stepsByProblem.size} problems`)

    await phase2(anthropic, supabase, problems, stepsByProblem)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
