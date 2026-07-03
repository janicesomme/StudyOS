import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExtractedSchoolStats } from './school-stats-extraction.js'

export async function loadSchoolIdMap(supabase: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('pm_schools').select('id, name')
  if (error) throw new Error(`Failed to load pm_schools: ${error.message}`)
  const map = new Map<string, string>()
  for (const row of (data ?? []) as { id: string; name: string }[]) map.set(row.name, row.id)
  return map
}

/**
 * pm_school_stats' real UNIQUE constraint is (school_id, cycle_year) — not
 * (school_id, cycle_year, source) as originally scoped for this pipeline. No
 * schema changes this session (see docs/handoffs/2026-07-03-premed-session-5.md),
 * so this upserts on the real constraint: a second source writing the same
 * school+cycle_year would overwrite this row. Harmless today since
 * 'class_profile' is the only source this pipeline ever writes. The source
 * URL is folded into the single `source` text column (no separate
 * source_url column exists).
 */
export async function upsertSchoolStats(
  supabase: SupabaseClient,
  schoolId: string,
  stats: ExtractedSchoolStats,
  sourceUrl: string
): Promise<void> {
  if (stats.cycle_year === null) {
    throw new Error('cycle_year is null — cannot upsert (pm_school_stats.cycle_year is NOT NULL)')
  }
  const row = {
    school_id: schoolId,
    cycle_year: stats.cycle_year,
    median_gpa: stats.median_gpa,
    median_mcat: stats.median_mcat,
    pct_instate: stats.pct_instate,
    pct_gap_year: stats.pct_gap_year,
    median_clinical_hours: stats.median_clinical_hours,
    median_research_hours: stats.median_research_hours,
    pct_with_publications: stats.pct_with_publications,
    source: `class_profile:${sourceUrl}`,
  }
  const { error } = await supabase.from('pm_school_stats').upsert(row, { onConflict: 'school_id,cycle_year' })
  if (error) throw new Error(`Failed to upsert pm_school_stats for school_id=${schoolId}: ${error.message}`)
}
