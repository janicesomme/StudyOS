// Shared terminal report formatting for premed/pipeline/*.ts CLIs
// (analyze-profile.ts, profile-cli.ts, seed-archetypes.ts).

import type { CategoryGap } from '../src/lib/activity-gap.js'
import type { EssayReview } from '../src/lib/committee-simulator.js'
import type { ApplicantPoolPosition } from '../src/lib/corpus-stats.js'
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

export function printActivityGaps(gaps: CategoryGap[]): void {
  console.log('=== Activity Gap Read-out === (biggest gaps first)')
  for (const g of gaps) {
    const baselineText =
      g.baseline.competitive === null
        ? 'no established benchmark'
        : `floor=${g.baseline.floor}h competitive=${g.baseline.competitive}h`
    const statusText = g.status ?? 'not benchmarked'
    const gapText =
      g.gapToCompetitive === null ? 'n/a' : g.gapToCompetitive === 0 ? 'none (met/exceeded)' : `${g.gapToCompetitive}h`
    const plannedText = g.plannedClosesGap === null ? 'n/a' : g.plannedClosesGap ? 'yes' : 'no'

    console.log(`  ${g.category.padEnd(24)} you=${g.hoursCompleted}h (planned +${g.hoursPlanned}h)  baseline: ${baselineText}`)
    console.log(`    status=${statusText}  gap-to-competitive=${gapText}  planned hours close this gap: ${plannedText}`)
    console.log(`    note: ${g.baseline.note}`)
  }
}

function formatPercentile(p: number | null): string {
  return p !== null ? `${p.toFixed(1)}th percentile` : 'n/a'
}

export function printEssayReview(review: EssayReview): void {
  console.log('=== Committee Simulator Review ===')
  for (const d of review.dimensionScores) {
    console.log(`  ${d.dimension.padEnd(36)} score=${d.score}/5`)
    for (const q of d.evidenceQuotes) console.log(`    quote: "${q}"`)
    if (d.challengeQuestion) console.log(`    challenge: ${d.challengeQuestion}`)
  }
  console.log('')
  console.log('--- Strengths ---')
  review.strengths.forEach(s => console.log(`  - ${s}`))
  console.log('--- Priority fixes ---')
  review.priorityFixes.forEach(s => console.log(`  - ${s}`))
  if (review.consistencyFlags.length) {
    console.log('--- Consistency flags ---')
    review.consistencyFlags.forEach(s => console.log(`  - ${s}`))
  }
  console.log(`\nVerdict: ${review.verdict}`)
}

export function printApplicantPoolPosition(position: ApplicantPoolPosition): void {
  console.log(`=== Applicant Pool Position (cycle_year=${position.cycle_year}) ===`)
  console.log(`GPA band ${position.gpa_band}: ${formatPercentile(position.gpa_percentile_applicants)} of applicants, ${formatPercentile(position.gpa_percentile_acceptees)} of acceptees`)
  console.log(`MCAT band ${position.mcat_band}: ${formatPercentile(position.mcat_percentile_applicants)} of applicants, ${formatPercentile(position.mcat_percentile_acceptees)} of acceptees`)
  if (position.note) console.log(`  note: ${position.note}`)
}
