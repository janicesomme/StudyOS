import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { analyzeProfile, type CellStats, type GapAnalysis } from '../src/lib/gap-analyzer.js'

// ── CLI args ─────────────────────────────────────────────────────────────────
// Accepts both space-separated ("--gpa 3.6") and "=" ("--gpa=3.6") forms.

export function parseCliArgs(argv: string[]): { gpa: number; mcat: number } {
  const values = new Map<string, string>()
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const eq = arg.indexOf('=')
    if (eq !== -1) {
      values.set(arg.slice(2, eq), arg.slice(eq + 1))
    } else {
      values.set(arg.slice(2), argv[i + 1])
      i++
    }
  }

  const gpaRaw = values.get('gpa')
  const mcatRaw = values.get('mcat')
  if (!gpaRaw) throw new Error('Missing required --gpa <number> flag.')
  if (!mcatRaw) throw new Error('Missing required --mcat <number> flag.')

  const gpa = Number(gpaRaw)
  const mcat = Number(mcatRaw)
  if (!Number.isFinite(gpa)) throw new Error(`--gpa must be a number, got "${gpaRaw}".`)
  if (!Number.isFinite(mcat)) throw new Error(`--mcat must be a number, got "${mcatRaw}".`)

  return { gpa, mcat }
}

// ── Report formatting ────────────────────────────────────────────────────────

function formatRate(cell: CellStats): string {
  if (cell.acceptance_rate !== null) return `${cell.acceptance_rate.toFixed(1)}%`
  return cell.note ?? 'n/a'
}

function formatCounts(cell: CellStats): string {
  const a = cell.applicants ?? '<10'
  const acc = cell.acceptees ?? '<10'
  return `applicants=${a} acceptees=${acc}`
}

function trendArrow(delta: GapAnalysis['delta']): string {
  if (!delta || delta.acceptance_rate_delta === null) return '(n/a)'
  if (delta.acceptance_rate_delta > 0) return `+${delta.acceptance_rate_delta.toFixed(1)} pts ↑`
  if (delta.acceptance_rate_delta < 0) return `${delta.acceptance_rate_delta.toFixed(1)} pts ↓`
  return '0.0 pts →'
}

function printReport(result: GapAnalysis): void {
  console.log('=== Premed Gap Analyzer ===')
  console.log(`Profile: GPA ${result.profile.gpa.toFixed(2)}, MCAT ${result.profile.mcat}`)
  console.log(`Your cell: GPA ${result.gpa_band}  x  MCAT ${result.mcat_band}`)
  console.log('')

  console.log('--- Your odds by cycle ---')
  for (const cycle of result.cycles) {
    console.log(`  ${cycle.cycle_year}: ${formatRate(cycle.mainCell)}  (${formatCounts(cycle.mainCell)})`)
  }
  if (result.delta) {
    console.log(`  Trend ${result.delta.from_cycle_year} -> ${result.delta.to_cycle_year}: ${trendArrow(result.delta)}`)
    if (result.delta.note) console.log(`  Note: ${result.delta.note}`)
  }
  console.log('')

  const latestCycle = result.cycles[result.cycles.length - 1]
  console.log(`--- +/-1 band sensitivity (cycle_year=${latestCycle.cycle_year}) ---`)
  const rows: Array<[string, string, CellStats | null]> = [
    ['GPA band up', result.neighborBands.gpaUp ?? '(none — already top band)', latestCycle.neighbors.gpaUp],
    ['Your cell', result.gpa_band, latestCycle.mainCell],
    ['GPA band down', result.neighborBands.gpaDown ?? '(none — already bottom band)', latestCycle.neighbors.gpaDown],
    ['MCAT band up', result.neighborBands.mcatUp ?? '(none — already top band)', latestCycle.neighbors.mcatUp],
    ['MCAT band down', result.neighborBands.mcatDown ?? '(none — already bottom band)', latestCycle.neighbors.mcatDown],
  ]
  for (const [label, band, cell] of rows) {
    const rate = cell ? formatRate(cell) : 'n/a'
    console.log(`  ${label.padEnd(16)} ${band.padEnd(20)} ${rate}`)
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { gpa, mcat } = parseCliArgs(process.argv.slice(2))

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const result = await analyzeProfile(supabase, { gpa, mcat })
  printReport(result)
}

function isZodError(err: unknown): err is { issues: { path: (string | number)[]; message: string }[] } {
  return typeof err === 'object' && err !== null && Array.isArray((err as { issues?: unknown }).issues)
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  main().catch(err => {
    if (isZodError(err)) {
      console.error('Invalid profile input:')
      for (const issue of err.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`)
    } else {
      console.error(err instanceof Error ? err.message : err)
    }
    process.exit(1)
  })
}
