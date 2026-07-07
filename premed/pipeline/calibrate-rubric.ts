import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { JSDOM } from 'jsdom'
import { fileURLToPath } from 'url'
import { estimateReviewTokens, reviewEssay } from '../src/lib/committee-simulator.js'
import { scoresSummary } from '../src/lib/essay-reviews.js'
import type { EssayReview } from '../src/lib/committee-simulator.js'
import { getRubricCalibrationStats } from '../src/lib/rubric-calibration.js'
import { isPathAllowed } from '../src/lib/robots.js'
import { RUBRIC_VERSION } from '../src/lib/rubrics.js'
import { flagPresent, parseFlags, printCliError } from './cli-args.js'

// Scores the Committee Simulator rubric (essay-only mode) against a small set
// of published personal statements, so the dashboard can show a user's own
// scores against a real accepted-essay range. Never stores essay text —
// see docs/handoffs/2026-07-05-premed-session-12.md and PLAN.md.

export type EssayBlock = { text: string; wordCount: number }

function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
}

/**
 * Splits a Crimson-style page into essay blocks. Each block runs from a
 * `<strong>ESSAY</strong>` marker paragraph to the next `<strong>REVIEW</strong>`
 * marker paragraph (exclusive) — that REVIEW-to-disclaimer span is Crimson's
 * own third-person editorial commentary, never the applicant's essay, and is
 * never included here. Pull-quote paragraphs (`.shortcodes-wrapper`, which
 * duplicate a sentence already in an adjacent paragraph) and the literal
 * `___` divider paragraph are skipped. Throws if the parsed block count
 * doesn't match `expectedCount` — a wrong count means the split itself is
 * broken, not that one essay happened to be short.
 */
export function splitEssayBlocks(html: string, expectedCount: number): EssayBlock[] {
  const dom = new JSDOM(html)
  const doc = dom.window.document

  const essayMarkers = Array.from(doc.querySelectorAll('strong')).filter(el => el.textContent?.trim() === 'ESSAY')
  const blocks: EssayBlock[] = []

  for (const marker of essayMarkers) {
    const markerParagraph = marker.closest('p')
    if (!markerParagraph) continue

    const paragraphs: string[] = []
    let node = markerParagraph.nextElementSibling
    while (node) {
      if (node.tagName === 'P') {
        const nestedStrong = node.querySelector('strong')
        if (nestedStrong?.textContent?.trim() === 'REVIEW') break

        const isPullQuote = node.querySelector('.shortcodes-wrapper') !== null
        const text = (node.textContent ?? '').trim()
        if (!isPullQuote && text !== '___' && text.length > 0) paragraphs.push(text)
      }
      node = node.nextElementSibling
    }

    const text = paragraphs.join(' ')
    blocks.push({ text, wordCount: countWords(text) })
  }

  if (blocks.length !== expectedCount) {
    throw new Error(`Essay block parse failed: expected ${expectedCount} blocks, found ${blocks.length}`)
  }

  return blocks
}

export type CalibrationRow = {
  source_label: string
  source_url: string
  rubric_version: string
  scores: Record<string, number>
  model: string
}

/** Extracts only {dimension: score} pairs plus source/version/model metadata — discards evidenceQuotes, challengeQuestion, strengths, priorityFixes, verdict, consistencyFlags, and redFlags, none of which belong in a public reference table. */
export function buildCalibrationRow(review: EssayReview, sourceLabel: string, sourceUrl: string, rubricVersion: string, model: string): CalibrationRow {
  return {
    source_label: sourceLabel,
    source_url: sourceUrl,
    rubric_version: rubricVersion,
    scores: scoresSummary(review),
    model,
  }
}

/** Console-summary line for one parsed block — takes only a label and a word count, so it cannot leak essay text by construction. */
export function formatBlockSummary(label: string, wordCount: number): string {
  return `${label}: ${wordCount} words`
}

export function parseCalibrateRubricArgs(argv: string[]) {
  const flags = parseFlags(argv)
  return {
    go: flagPresent(flags, 'go'),
    force: flagPresent(flags, 'force'),
  }
}

// ── Config ───────────────────────────────────────────────────────────────────

const SOURCE_URL = 'https://www.thecrimson.com/topic/sponsored-successful-medical-essays-2019/'
const EXPECTED_ESSAY_COUNT = 10
const SONNET = 'claude-sonnet-5'
const PRICING = { input: 3.0, output: 15.0 } // $/MTok — matches premed/pipeline/review-essay.ts
const HARD_BUDGET_CAP = 5.0
// The actual max_tokens reviewEssay() passes to the API — used (not an average
// estimate) for every pre-call cost projection, so "stop before the cap" is a
// true worst-case guarantee rather than a usually-true heuristic.
const WORST_CASE_OUTPUT_TOKENS = 2000
const USER_AGENT = 'StudyOSPremedBot/1.0 (+research use; contact: crm2263@gmail.com)'

function estimatedCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * PRICING.input + outputTokens * PRICING.output) / 1_000_000
}

function labelFor(index: number): string {
  return `crimson-2019-essay-${String(index + 1).padStart(2, '0')}`
}

async function fetchSourcePage(): Promise<string> {
  const url = new URL(SOURCE_URL)
  const robotsRes = await fetch(`${url.origin}/robots.txt`, { headers: { 'User-Agent': USER_AGENT } })
  if (robotsRes.ok) {
    const robotsTxt = await robotsRes.text()
    if (!isPathAllowed(robotsTxt, url.pathname)) {
      throw new Error(`robots.txt disallows fetching ${SOURCE_URL} for this user agent`)
    }
  }
  const pageRes = await fetch(SOURCE_URL, { headers: { 'User-Agent': USER_AGENT } })
  if (!pageRes.ok) throw new Error(`Failed to fetch ${SOURCE_URL}: HTTP ${pageRes.status}`)
  return pageRes.text()
}

async function main() {
  const args = parseCalibrateRubricArgs(process.argv.slice(2))

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

  console.log(`Fetching ${SOURCE_URL} ...`)
  const html = await fetchSourcePage()
  const parsedBlocks = splitEssayBlocks(html, EXPECTED_ESSAY_COUNT)

  console.log(`\nParsed ${parsedBlocks.length} essay blocks:`)
  parsedBlocks.forEach((b, i) => console.log(`  ${formatBlockSummary(labelFor(i), b.wordCount)}`))

  // Idempotency pre-check — an app-level convenience, not the actual
  // guarantee (that's the DB UNIQUE constraint + upsert below).
  const { data: existingRows, error: existingError } = await supabase
    .from('pm_rubric_calibration')
    .select('source_label')
    .eq('source_url', SOURCE_URL)
    .eq('rubric_version', RUBRIC_VERSION)
  if (existingError) throw new Error(`Failed to check existing calibration rows: ${existingError.message}`)
  const existingLabels = new Set((existingRows ?? []).map((r: { source_label: string }) => r.source_label))

  const toProcess = args.force ? parsedBlocks.map((b, i) => ({ block: b, index: i })) : parsedBlocks.map((b, i) => ({ block: b, index: i })).filter(({ index }) => !existingLabels.has(labelFor(index)))
  const skipped = parsedBlocks.length - toProcess.length
  if (skipped > 0) {
    console.log(`\n${skipped} essay(s) already calibrated for rubric_version=${RUBRIC_VERSION} — skipping (pass --force to recalibrate).`)
  }

  if (toProcess.length === 0) {
    console.log('\nNothing to do — all essays already calibrated.')
    return
  }

  // Cost gate — worst-case projection, printed before any --go check.
  let projectedTotal = 0
  for (const { block } of toProcess) {
    const estInput = estimateReviewTokens({ essay: block.text })
    projectedTotal += estimatedCost(estInput, WORST_CASE_OUTPUT_TOKENS)
  }
  console.log(`\n===================================================================`)
  console.log(`  calibrate-rubric.ts — Committee Simulator (essay-only mode)`)
  console.log(`===================================================================\n`)
  console.log(`Essays to score:      ${toProcess.length}`)
  console.log(`Model:                ${SONNET}`)
  console.log(`Rates:                $${PRICING.input}/MTok in, $${PRICING.output}/MTok out`)
  console.log(`Worst-case est. cost: $${projectedTotal.toFixed(4)}  (using max_tokens=${WORST_CASE_OUTPUT_TOKENS} per call, not an average estimate)`)
  console.log(`Hard budget cap:      $${HARD_BUDGET_CAP.toFixed(2)}`)
  console.log('')
  if (projectedTotal > HARD_BUDGET_CAP) {
    console.log(`PROJECTED COST EXCEEDS BUDGET CAP — aborting.`)
    console.log(`===================================================================\n`)
    process.exit(1)
  }
  console.log(args.go ? '--go passed — proceeding with live calls.' : 'NO API CALLS MADE. Re-run with --go to proceed (requires explicit approval).')
  console.log(`===================================================================\n`)
  if (!args.go) return

  const anthropic = new Anthropic()
  let runningInputTokens = 0
  let runningOutputTokens = 0
  const runningCost = () => estimatedCost(runningInputTokens, runningOutputTokens)

  for (const { block, index } of toProcess) {
    const label = labelFor(index)
    const estInput = estimateReviewTokens({ essay: block.text })
    const projectedNext = runningCost() + estimatedCost(estInput, WORST_CASE_OUTPUT_TOKENS)
    if (projectedNext > HARD_BUDGET_CAP) {
      console.log(`\nBUDGET CAP REACHED ($${HARD_BUDGET_CAP.toFixed(2)}) — stopping before "${label}".`)
      break
    }

    process.stdout.write(`[${label}] scoring... `)
    try {
      const { review, usage } = await reviewEssay(anthropic, SONNET, { essay: block.text })
      runningInputTokens += usage.input_tokens
      runningOutputTokens += usage.output_tokens

      const row = buildCalibrationRow(review as EssayReview, label, SOURCE_URL, RUBRIC_VERSION, SONNET)
      const { error: upsertError } = await supabase
        .from('pm_rubric_calibration')
        .upsert(row, { onConflict: 'rubric_version,source_url,source_label' })
      if (upsertError) throw new Error(`Failed to save calibration row: ${upsertError.message}`)

      process.stdout.write(`ok  |  running: $${runningCost().toFixed(4)}\n`)
    } catch (err) {
      // Error messages reference the label/stage only — never the essay text.
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`FAILED (${label}): ${msg}\n`)
    }
  }

  console.log(`\n--- calibration run done ---`)
  console.log(`Tokens: ${runningInputTokens.toLocaleString()} in / ${runningOutputTokens.toLocaleString()} out  |  cost: $${runningCost().toFixed(4)}`)

  const stats = await getRubricCalibrationStats(supabase)
  console.log(`\nCalibration stats (per dimension):`)
  for (const [dimension, s] of Object.entries(stats)) {
    console.log(`  ${dimension}: min=${s.min} median=${s.median} max=${s.max} n=${s.n}`)
  }
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  main().catch(err => {
    printCliError(err)
    process.exit(1)
  })
}
