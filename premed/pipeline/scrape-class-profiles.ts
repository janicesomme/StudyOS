import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { isPathAllowed } from '../src/lib/robots.js'
import {
  buildExtractionPrompt,
  estimateTokens,
  htmlToText,
  isLowQualityExtraction,
  truncateForExtraction,
  ExtractedSchoolStatsSchema,
  type ExtractedSchoolStats,
} from '../src/lib/school-stats-extraction.js'
import { loadSchoolIdMap, upsertSchoolStats } from '../src/lib/school-stats-store.js'
import { SCHOOL_SEEDS, type SchoolSeed } from './seed-schools.js'

// ── Config ───────────────────────────────────────────────────────────────────

const HAIKU = 'claude-haiku-4-5-20251001'
const SONNET = 'claude-sonnet-5'
const PRICING: Record<string, { input: number; output: number }> = {
  [HAIKU]: { input: 0.8, output: 4.0 },
  [SONNET]: { input: 3.0, output: 15.0 },
}
const HARD_BUDGET_CAP = 5.0
const USER_AGENT = 'StudyOSPremedBot/1.0 (+research use; contact: crm2263@gmail.com)'
const RETRY_QUEUE_PATH = 'premed/source-data/scrape-retry-queue.json'
const ESTIMATED_OUTPUT_TOKENS_PER_PAGE = 150 // small structured JSON row

const ARGV = process.argv.slice(2)
const PHASE: 'haiku' | 'sonnet-retry' = ARGV.includes('--phase=sonnet-retry') ? 'sonnet-retry' : 'haiku'
const GO = ARGV.includes('--go')

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ── Discovery: robots.txt check + fetch (zero API cost) ─────────────────────

type PageResult = {
  school: SchoolSeed
  url: string
  status: 'fetched' | 'robots-disallowed' | 'fetch-failed' | 'no-url'
  text?: string
  httpStatus?: number
  error?: string
}

async function checkRobotsAndFetch(school: SchoolSeed): Promise<PageResult> {
  if (!school.class_profile_url) return { school, url: '', status: 'no-url' }
  const url = school.class_profile_url

  let origin: string
  let path: string
  try {
    const parsed = new URL(url)
    origin = parsed.origin
    path = parsed.pathname
  } catch {
    return { school, url, status: 'fetch-failed', error: 'invalid URL' }
  }

  try {
    const robotsRes = await fetch(`${origin}/robots.txt`, { headers: { 'User-Agent': USER_AGENT } })
    if (robotsRes.ok) {
      const robotsTxt = await robotsRes.text()
      if (!isPathAllowed(robotsTxt, path)) {
        return { school, url, status: 'robots-disallowed' }
      }
    }
    // No robots.txt, or it 404'd — standard crawler behavior is to proceed unrestricted.
  } catch {
    // Network error fetching robots.txt — proceed rather than blocking on an unreachable file.
  }

  try {
    const pageRes = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!pageRes.ok) {
      return { school, url, status: 'fetch-failed', httpStatus: pageRes.status, error: `HTTP ${pageRes.status}` }
    }
    const html = await pageRes.text()
    const text = truncateForExtraction(htmlToText(html, url))
    return { school, url, status: 'fetched', text, httpStatus: pageRes.status }
  } catch (err) {
    return { school, url, status: 'fetch-failed', error: err instanceof Error ? err.message : String(err) }
  }
}

async function discoverQueue(): Promise<PageResult[]> {
  const results: PageResult[] = []
  for (const school of SCHOOL_SEEDS) {
    results.push(await checkRobotsAndFetch(school))
  }
  return results
}

// ── Cost tracking ────────────────────────────────────────────────────────────

let runModel = HAIKU
let runInputTokens = 0
let runOutputTokens = 0

function trackUsage(model: string, usage: { input_tokens: number; output_tokens: number }) {
  runModel = model
  runInputTokens += usage.input_tokens
  runOutputTokens += usage.output_tokens
}

function runningCost(): number {
  const p = PRICING[runModel]
  return (runInputTokens * p.input + runOutputTokens * p.output) / 1_000_000
}

function estimatedCallCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model]
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000
}

// ── Cost gate ────────────────────────────────────────────────────────────────

function printPlan(phase: 'haiku' | 'sonnet-retry', pages: PageResult[]): void {
  const fetched = pages.filter(p => p.status === 'fetched')
  const robotsBlocked = pages.filter(p => p.status === 'robots-disallowed')
  const fetchFailed = pages.filter(p => p.status === 'fetch-failed')
  const noUrl = pages.filter(p => p.status === 'no-url')

  const model = phase === 'haiku' ? HAIKU : SONNET
  let totalInput = 0
  for (const page of fetched) totalInput += estimateTokens(buildExtractionPrompt(page.school.name, page.text!))
  const totalOutput = fetched.length * ESTIMATED_OUTPUT_TOKENS_PER_PAGE
  const estCost = (totalInput * PRICING[model].input + totalOutput * PRICING[model].output) / 1_000_000

  console.log(`\n===================================================================`)
  console.log(`  scrape-class-profiles.ts — phase: ${phase}`)
  console.log(`===================================================================\n`)
  console.log(`Schools in seed list:       ${SCHOOL_SEEDS.length}`)
  console.log(`  no class-profile URL:     ${noUrl.length}`)
  console.log(`  blocked by robots.txt:    ${robotsBlocked.length}`)
  console.log(`  fetch failed:             ${fetchFailed.length}`)
  console.log(`  fetched OK (queued):      ${fetched.length}`)
  console.log('')
  console.log(`Model:            ${model}`)
  console.log(`Pages queued:     ${fetched.length}`)
  console.log(`Est. tokens:      ${totalInput.toLocaleString()} in / ${totalOutput.toLocaleString()} out`)
  console.log(`Rates:            $${PRICING[model].input}/MTok in, $${PRICING[model].output}/MTok out`)
  console.log(`Est. cost:        $${estCost.toFixed(4)}`)
  console.log(`Hard budget cap:  $${HARD_BUDGET_CAP.toFixed(2)} (aborts mid-run if projected spend would exceed it)`)

  if (fetchFailed.length) {
    console.log(`\nFetch failures:`)
    fetchFailed.forEach(p => console.log(`  ${p.school.name}: ${p.error}`))
  }
  if (robotsBlocked.length) {
    console.log(`\nRobots-blocked:`)
    robotsBlocked.forEach(p => console.log(`  ${p.school.name}: ${p.url}`))
  }

  console.log('')
  console.log(
    GO
      ? `--go passed — proceeding with ${fetched.length} extraction calls.`
      : `NO API CALLS MADE. Re-run with --go to proceed (requires explicit approval).`
  )
  console.log(`===================================================================\n`)
}

// ── Extraction ───────────────────────────────────────────────────────────────

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: 'extract_school_stats',
  description: 'Extract medical school class-profile admissions statistics from page text. Use null for anything not explicitly stated.',
  input_schema: {
    type: 'object' as const,
    properties: {
      median_gpa: { type: ['number', 'null'], description: 'Median or average undergraduate GPA of the entering class, or null if not stated' },
      median_mcat: { type: ['integer', 'null'], description: 'Median or average total MCAT score of the entering class, or null if not stated' },
      pct_instate: { type: ['number', 'null'], description: 'Percent of the entering class who are in-state residents, or null if not stated' },
      pct_gap_year: { type: ['number', 'null'], description: 'Percent of the entering class who took gap year(s) before matriculating, or null if not stated' },
      median_clinical_hours: { type: ['integer', 'null'], description: 'Median clinical experience hours of the entering class, or null if not stated' },
      median_research_hours: { type: ['integer', 'null'], description: 'Median research experience hours of the entering class, or null if not stated' },
      pct_with_publications: { type: ['number', 'null'], description: 'Percent of the entering class with at least one publication, or null if not stated' },
      cycle_year: { type: ['integer', 'null'], description: 'The entering-class year these stats describe (e.g. "Class of 2029" -> 2029), or null if not stated' },
    },
    required: [
      'median_gpa',
      'median_mcat',
      'pct_instate',
      'pct_gap_year',
      'median_clinical_hours',
      'median_research_hours',
      'pct_with_publications',
      'cycle_year',
    ],
  },
}

async function extractStats(anthropic: Anthropic, model: string, school: SchoolSeed, pageText: string): Promise<ExtractedSchoolStats> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 300,
    messages: [{ role: 'user', content: buildExtractionPrompt(school.name, pageText) }],
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: 'tool', name: 'extract_school_stats' },
  })
  trackUsage(model, response.usage)

  const block = response.content.find(b => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') throw new Error('No tool_use block in response')
  return ExtractedSchoolStatsSchema.parse(block.input)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
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

  let queue: PageResult[]
  if (PHASE === 'haiku') {
    console.log('Discovering pages (robots.txt + fetch — no API calls)...')
    queue = await discoverQueue()
  } else {
    if (!existsSync(RETRY_QUEUE_PATH)) {
      console.log(`No retry queue found at ${RETRY_QUEUE_PATH} — run the haiku phase first.`)
      return
    }
    const retryNames: string[] = JSON.parse(readFileSync(RETRY_QUEUE_PATH, 'utf-8'))
    if (retryNames.length === 0) {
      console.log('Retry queue is empty — nothing to do.')
      return
    }
    console.log(`Re-fetching ${retryNames.length} page(s) queued for Sonnet retry...`)
    const allPages = await discoverQueue()
    queue = allPages.filter(p => retryNames.includes(p.school.name))
  }

  printPlan(PHASE, queue)
  if (!GO) return // hard stop — no API calls without explicit --go

  const anthropic = new Anthropic()
  const model = PHASE === 'haiku' ? HAIKU : SONNET
  runModel = model

  const schoolIdMap = await loadSchoolIdMap(supabase)
  const fetched = queue.filter(p => p.status === 'fetched')
  const lowQuality: string[] = []
  const upserted: string[] = []

  for (let i = 0; i < fetched.length; i++) {
    const page = fetched[i]
    const estInput = estimateTokens(buildExtractionPrompt(page.school.name, page.text!))
    const projectedCost = runningCost() + estimatedCallCost(model, estInput, ESTIMATED_OUTPUT_TOKENS_PER_PAGE)
    if (projectedCost > HARD_BUDGET_CAP) {
      console.log(
        `\nBUDGET CAP REACHED ($${HARD_BUDGET_CAP.toFixed(2)}) — stopping before "${page.school.name}" (${i + 1}/${fetched.length}). ${fetched.length - i} page(s) not processed.`
      )
      break
    }

    process.stdout.write(`[${i + 1}/${fetched.length}] ${page.school.name}... `)
    try {
      const stats = await extractStats(anthropic, model, page.school, page.text!)
      const schoolId = schoolIdMap.get(page.school.name)
      if (!schoolId) throw new Error('school not found in pm_schools — run seed-schools first')

      if (isLowQualityExtraction(stats)) {
        lowQuality.push(page.school.name)
        process.stdout.write(`no usable stats found  |  running: $${runningCost().toFixed(4)}\n`)
      } else {
        await upsertSchoolStats(supabase, schoolId, stats, page.url)
        upserted.push(page.school.name)
        process.stdout.write(`ok  |  running: $${runningCost().toFixed(4)}\n`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`FAILED: ${msg}\n`)
      lowQuality.push(page.school.name) // treat extraction errors the same as low-quality — worth a retry
    }
    if (i < fetched.length - 1) await delay(80)
  }

  console.log(`\n--- ${PHASE} phase done ---`)
  console.log(`Upserted: ${upserted.length}  |  Low-quality/failed: ${lowQuality.length}`)
  console.log(`Tokens:   ${runInputTokens.toLocaleString()} in / ${runOutputTokens.toLocaleString()} out`)
  console.log(`Cost:     $${runningCost().toFixed(4)}`)

  if (PHASE === 'haiku') {
    if (lowQuality.length > 0) {
      writeFileSync(RETRY_QUEUE_PATH, JSON.stringify(lowQuality, null, 2), 'utf-8')
      console.log(`\n${lowQuality.length} page(s) need a Sonnet retry — queue written to ${RETRY_QUEUE_PATH}.`)
      console.log(`Run: npm run scrape-class-profiles -- --phase=sonnet-retry   (prints its own cost estimate; needs its own --go)`)
    } else if (existsSync(RETRY_QUEUE_PATH)) {
      writeFileSync(RETRY_QUEUE_PATH, '[]', 'utf-8')
    }
  } else {
    if (lowQuality.length > 0) {
      console.log(
        `\n${lowQuality.length} page(s) still had no usable stats after the Sonnet retry — these pages likely don't publish this data in a model-extractable form (e.g. JS-rendered content plain fetch can't see). No further automatic retry.`
      )
    }
    writeFileSync(RETRY_QUEUE_PATH, '[]', 'utf-8')
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
