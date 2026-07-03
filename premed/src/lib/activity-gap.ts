import { staticBaselineProvider, type BaselineProvider, type CategoryBaseline } from './baselines.js'
import { ACTIVITY_CATEGORIES, type ActivityCategory } from './schemas.js'

export type GapStatus = 'strong' | 'competitive' | 'below' | 'missing'

export type CategoryGap = {
  category: ActivityCategory
  hoursCompleted: number
  hoursPlanned: number
  baseline: CategoryBaseline
  /** null when the category has no baseline (competitive/floor both null). */
  status: GapStatus | null
  /** Hours still needed to reach `baseline.competitive`. 0 if already met/exceeded. null if no baseline. */
  gapToCompetitive: number | null
  /** Whether hoursCompleted + hoursPlanned would clear the competitive threshold. null if there's no gap to close (already met, or no baseline). */
  plannedClosesGap: boolean | null
}

export type ActivityHours = { category: ActivityCategory; hours_completed: number; hours_planned: number }

function sumByCategory(activities: ActivityHours[]): Record<ActivityCategory, { completed: number; planned: number }> {
  const totals = {} as Record<ActivityCategory, { completed: number; planned: number }>
  for (const category of ACTIVITY_CATEGORIES) totals[category] = { completed: 0, planned: 0 }
  for (const a of activities) {
    totals[a.category].completed += a.hours_completed
    totals[a.category].planned += a.hours_planned
  }
  return totals
}

/**
 * Status buckets use exactly the two given thresholds, no invented third
 * number: 0h -> missing; below floor -> below; [floor, competitive) ->
 * competitive; >= competitive -> strong. null when the category has no
 * baseline at all.
 */
export function computeStatus(hoursCompleted: number, baseline: CategoryBaseline): GapStatus | null {
  if (baseline.floor === null || baseline.competitive === null) return null
  if (hoursCompleted === 0) return 'missing'
  if (hoursCompleted < baseline.floor) return 'below'
  if (hoursCompleted < baseline.competitive) return 'competitive'
  return 'strong'
}

export function computeGap(
  hoursCompleted: number,
  hoursPlanned: number,
  baseline: CategoryBaseline
): { gapToCompetitive: number | null; plannedClosesGap: boolean | null } {
  if (baseline.competitive === null) return { gapToCompetitive: null, plannedClosesGap: null }

  const gap = Math.max(0, baseline.competitive - hoursCompleted)
  if (gap === 0) return { gapToCompetitive: 0, plannedClosesGap: null } // already met/exceeded — nothing to "close"

  const projected = hoursCompleted + hoursPlanned
  return { gapToCompetitive: gap, plannedClosesGap: projected >= baseline.competitive }
}

/**
 * Sums hours per category (a user may log multiple activities in the same
 * category), scores each of the 10 categories against its baseline, and
 * returns them ordered biggest-gap-first. Categories with no computable gap
 * (no baseline, or already met/exceeded) sort last, in category-enum order.
 * Defaults to the hardcoded static baselines; pass a live provider (see
 * baselines-live.ts) to score against pm_school_stats instead.
 */
export async function computeActivityGaps(
  activities: ActivityHours[],
  provider: BaselineProvider = staticBaselineProvider
): Promise<CategoryGap[]> {
  const totals = sumByCategory(activities)
  const baselines = await provider.getAllBaselines()

  const gaps: CategoryGap[] = ACTIVITY_CATEGORIES.map(category => {
    const { completed, planned } = totals[category]
    const baseline = baselines[category]
    const status = computeStatus(completed, baseline)
    const { gapToCompetitive, plannedClosesGap } = computeGap(completed, planned, baseline)
    return {
      category,
      hoursCompleted: completed,
      hoursPlanned: planned,
      baseline,
      status,
      gapToCompetitive,
      plannedClosesGap,
    }
  })

  return gaps.sort((a, b) => {
    if (a.gapToCompetitive === null && b.gapToCompetitive === null) return 0
    if (a.gapToCompetitive === null) return 1
    if (b.gapToCompetitive === null) return -1
    return b.gapToCompetitive - a.gapToCompetitive
  })
}
