import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getAllBaselines as getStaticAllBaselines,
  getBaseline as getStaticBaseline,
  type BaselineProvider,
  type CategoryBaseline,
} from './baselines.js'
import { ACTIVITY_CATEGORIES, type ActivityCategory } from './schemas.js'

const MIN_SCHOOLS_FOR_LIVE_DATA = 3

/**
 * pm_school_stats has exactly two hours-shaped columns: median_clinical_hours
 * and median_research_hours. There is no per-category breakdown for the
 * other 8 activity categories (nonclinical_volunteer, shadowing, leadership,
 * teaching, publication, extracurricular, other, and no schema change is in
 * scope this session to add one) — those always fall back to static.
 * pct_with_publications exists but is a percentage, not an hours metric, so
 * it can't back `publication`'s hours-shaped baseline either.
 * clinical_paid and clinical_volunteer both map to the same
 * median_clinical_hours column — pm_school_stats doesn't distinguish paid vs.
 * volunteer clinical hours, so this is a documented approximation, not a
 * precise per-category figure.
 */
const CATEGORY_TO_COLUMN: Partial<Record<ActivityCategory, 'median_clinical_hours' | 'median_research_hours'>> = {
  clinical_volunteer: 'median_clinical_hours',
  clinical_paid: 'median_clinical_hours',
  research: 'median_research_hours',
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

async function loadColumnValues(
  supabase: SupabaseClient,
  column: 'median_clinical_hours' | 'median_research_hours'
): Promise<number[]> {
  const { data, error } = await supabase.from('pm_school_stats').select(column)
  if (error) throw new Error(`Failed to load pm_school_stats.${column}: ${error.message}`)
  return (data ?? [])
    .map((row: Record<string, unknown>) => row[column])
    .filter((v: unknown): v is number => typeof v === 'number')
}

/**
 * Derives baselines from scraped pm_school_stats where a mapped column
 * exists and enough schools (>= MIN_SCHOOLS_FOR_LIVE_DATA) have non-null
 * data; falls back to the hardcoded static baseline otherwise — including
 * for every category with no mapped column at all. `competitive` becomes the
 * live median; `floor` is always retained from the static baseline (school
 * medians describe competitive-applicant stats, not a "meaningful minimum"
 * concept — there's no live analog to derive a floor from).
 */
export function createLiveBaselineProvider(supabase: SupabaseClient): BaselineProvider {
  async function getBaseline(category: ActivityCategory): Promise<CategoryBaseline> {
    const staticBaseline = await getStaticBaseline(category)
    const column = CATEGORY_TO_COLUMN[category]
    if (!column) return staticBaseline

    const values = await loadColumnValues(supabase, column)
    if (values.length < MIN_SCHOOLS_FOR_LIVE_DATA) return staticBaseline

    const liveCompetitive = Math.round(median(values))
    return {
      competitive: liveCompetitive,
      floor: staticBaseline.floor,
      note: `Live: median ${column}=${liveCompetitive}h across ${values.length} schools with data. Floor retained from static baseline (no live analog). Static note: ${staticBaseline.note}`,
    }
  }

  async function getAllBaselines(): Promise<Record<ActivityCategory, CategoryBaseline>> {
    const staticFallback = await getStaticAllBaselines()
    const result = { ...staticFallback }
    for (const category of ACTIVITY_CATEGORIES) {
      if (CATEGORY_TO_COLUMN[category]) result[category] = await getBaseline(category)
    }
    return result
  }

  return { getBaseline, getAllBaselines }
}
