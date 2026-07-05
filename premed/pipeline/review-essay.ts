import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { estimateReviewTokens, reviewEssay } from '../src/lib/committee-simulator.js'
import { saveEssayReview } from '../src/lib/essay-reviews.js'
import { aggregateActivities, getProfile, listActivities } from '../src/lib/profiles.js'
import { RUBRIC_VERSION } from '../src/lib/rubrics.js'
import { findSchool } from '../src/lib/school-comparison.js'
import { flagPresent, optionalString, parseFlags, printCliError, requireString } from './cli-args.js'
import { printEssayReview } from './report.js'

// npm run review-essay -- --user <id> --file draft.txt [--school "Tulane"] [--go]
//
// One Sonnet call per invocation. Prints a cost estimate and requires --go
// (same cost-gate protocol as scrape-class-profiles.ts) before making the
// call — no live API spend without explicit approval.

const SONNET = 'claude-sonnet-5'
const PRICING = { input: 3.0, output: 15.0 } // $/MTok
const HARD_BUDGET_CAP = 5.0
const ESTIMATED_OUTPUT_TOKENS = 900 // 5-6 dimensions x (quotes + challenge) + strengths/fixes/verdict

export function parseReviewEssayArgs(argv: string[]) {
  const flags = parseFlags(argv)
  return {
    user: requireString(flags, 'user'),
    file: requireString(flags, 'file'),
    school: optionalString(flags, 'school'),
    go: flagPresent(flags, 'go'),
  }
}

function estimatedCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * PRICING.input + outputTokens * PRICING.output) / 1_000_000
}

function printPlan(essayWords: number, estInputTokens: number, school: { name: string } | null): void {
  const estCost = estimatedCost(estInputTokens, ESTIMATED_OUTPUT_TOKENS)
  console.log(`\n===================================================================`)
  console.log(`  review-essay.ts — Committee Simulator`)
  console.log(`===================================================================\n`)
  console.log(`Essay length:     ~${essayWords} words`)
  console.log(`School:           ${school ? school.name : '(none — mission_fit not scored)'}`)
  console.log(`Model:            ${SONNET}`)
  console.log(`Est. tokens:      ${estInputTokens.toLocaleString()} in / ~${ESTIMATED_OUTPUT_TOKENS.toLocaleString()} out`)
  console.log(`Rates:            $${PRICING.input}/MTok in, $${PRICING.output}/MTok out`)
  console.log(`Est. cost:        $${estCost.toFixed(4)}`)
  console.log(`Hard budget cap:  $${HARD_BUDGET_CAP.toFixed(2)}`)
  console.log('')
  console.log(
    estCost > HARD_BUDGET_CAP
      ? `PROJECTED COST EXCEEDS BUDGET CAP — aborting.`
      : `NO API CALL MADE YET. Re-run with --go to proceed (requires explicit approval).`
  )
  console.log(`===================================================================\n`)
}

async function main() {
  const args = parseReviewEssayArgs(process.argv.slice(2))

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  if (!ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY in .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const essay = readFileSync(args.file, 'utf-8')
  const profile = await getProfile(supabase, args.user)
  if (!profile) throw new Error(`No profile found for user_id=${args.user}. Run profile-create first.`)
  const activities = await listActivities(supabase, profile.id)
  const activitySummaries = aggregateActivities(activities)
  const school = args.school ? await findSchool(supabase, args.school) : null
  if (args.school && !school) console.log(`(No school matching "${args.school}" found in pm_schools — mission_fit will not be scored.)`)

  const promptInput = {
    essay,
    activitySummaries,
    school: school?.name,
    missionKeywords: school?.mission_keywords ?? undefined,
  }
  const estInputTokens = estimateReviewTokens(promptInput)
  printPlan(essay.trim().split(/\s+/).length, estInputTokens, school)

  const estCost = estimatedCost(estInputTokens, ESTIMATED_OUTPUT_TOKENS)
  if (estCost > HARD_BUDGET_CAP) process.exit(1)
  if (!args.go) return

  const anthropic = new Anthropic()
  const { review, usage } = await reviewEssay(anthropic, SONNET, promptInput)
  const actualCost = estimatedCost(usage.input_tokens, usage.output_tokens)
  console.log(`Actual usage: ${usage.input_tokens.toLocaleString()} in / ${usage.output_tokens.toLocaleString()} out  |  cost: $${actualCost.toFixed(4)}\n`)

  const saved = await saveEssayReview(supabase, {
    profile_id: profile.id,
    essay,
    rubric_version: RUBRIC_VERSION,
    review,
    model: SONNET,
  })

  printEssayReview(review)
  console.log(`\nSaved: pm_essay_reviews id=${saved.id}`)
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  main().catch(err => {
    printCliError(err)
    process.exit(1)
  })
}
