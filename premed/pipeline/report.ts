// Shared terminal report formatting for premed/pipeline/*.ts CLIs
// (analyze-profile.ts, profile-cli.ts, seed-archetypes.ts).

import type { CellStats, GapAnalysis } from '../src/lib/gap-analyzer.js'
import type { PmActivity, PmProfile } from '../src/lib/schemas.js'

export function formatRate(cell: CellStats): string {
  if (cell.acceptance_rate !== null) return `${cell.acceptance_rate.toFixed(1)}%`
  return cell.note ?? 'n/a'
}

export function formatCounts(cell: CellStats): string {
  const a = cell.applicants ?? '<10'
  const acc = cell.acceptees ?? '<10'
  return `applicants=${a} acceptees=${acc}`
}

export function trendArrow(delta: GapAnalysis['delta']): string {
  if (!delta || delta.acceptance_rate_delta === null) return '(n/a)'
  if (delta.acceptance_rate_delta > 0) return `+${delta.acceptance_rate_delta.toFixed(1)} pts ↑`
  if (delta.acceptance_rate_delta < 0) return `${delta.acceptance_rate_delta.toFixed(1)} pts ↓`
  return '0.0 pts →'
}

export function printGapAnalysis(result: GapAnalysis): void {
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

export function printProfile(profile: PmProfile): void {
  console.log('=== Profile ===')
  console.log(`user_id: ${profile.user_id}`)
  console.log(
    `GPA: ${profile.gpa_cum ?? 'n/a'}  MCAT: ${profile.mcat_total ?? 'n/a'}  ` +
      `state: ${profile.state_residence ?? 'n/a'}  grad_year: ${profile.grad_year ?? 'n/a'}  ` +
      `gap_years: ${profile.gap_years}`
  )
}

export function printActivities(activities: PmActivity[]): void {
  console.log('=== Activities ===')
  if (activities.length === 0) {
    console.log('  (none)')
    return
  }
  for (const a of activities) {
    console.log(`  ${a.category.padEnd(24)} completed=${a.hours_completed}h planned=${a.hours_planned}h`)
  }
}
