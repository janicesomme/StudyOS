import type { SupabaseClient } from '@supabase/supabase-js'
import { buildBandOrder, mapToBand, type BandDef } from './gap-analyzer.js'

export type ApplicantPoolPosition = {
  cycle_year: number
  gpa_band: string
  mcat_band: string
  /** Percentile rank (0-100) among applicants at or below your GPA band. null if no data. */
  gpa_percentile_applicants: number | null
  /** Same, among acceptees only. */
  gpa_percentile_acceptees: number | null
  mcat_percentile_applicants: number | null
  mcat_percentile_acceptees: number | null
  note: string | null
}

type GridRow = { gpa_band: string; mcat_band: string; applicants: number | null; acceptees: number | null }

/**
 * Percentile rank = (count in bands at-or-below yours) / (total with data) * 100.
 * Suppressed cells (null count) are excluded from both numerator and
 * denominator — a documented small undercount, never fabricated.
 */
function percentileRank(
  rows: GridRow[],
  dimension: 'gpa_band' | 'mcat_band',
  bandOrder: BandDef[],
  matchedIndex: number,
  field: 'applicants' | 'acceptees'
): { percentile: number | null; suppressedCells: number } {
  let total = 0
  let atOrBelow = 0
  let suppressedCells = 0

  for (const row of rows) {
    const value = row[field]
    if (value === null) {
      suppressedCells++
      continue
    }
    const idx = bandOrder.findIndex(b => b.label === row[dimension])
    if (idx === -1) continue
    total += value
    if (idx <= matchedIndex) atOrBelow += value
  }

  return { percentile: total > 0 ? Math.round((atOrBelow / total) * 1000) / 10 : null, suppressedCells }
}

/**
 * Where a GPA/MCAT profile sits in the national applicant/acceptee pool for
 * one cycle year, using pm_facts_grid (the same real AAMC data the Gap
 * Analyzer uses) — no scraping, no external source, zero API cost. Band
 * mapping reuses gap-analyzer.ts's logic so both features agree on which
 * cell a profile falls into.
 */
export async function computeApplicantPoolPosition(
  supabase: SupabaseClient,
  profile: { gpa: number; mcat: number },
  cycleYear: number
): Promise<ApplicantPoolPosition> {
  const { data, error } = await supabase
    .from('pm_facts_grid')
    .select('gpa_band, mcat_band, applicants, acceptees')
    .eq('cycle_year', cycleYear)
  if (error) throw new Error(`Failed to load pm_facts_grid for cycle_year=${cycleYear}: ${error.message}`)
  const rows = (data ?? []) as GridRow[]
  if (rows.length === 0) throw new Error(`No pm_facts_grid rows found for cycle_year=${cycleYear}.`)

  const gpaBandOrder = buildBandOrder(rows.map(r => r.gpa_band))
  const mcatBandOrder = buildBandOrder(rows.map(r => r.mcat_band))
  const gpaMatch = mapToBand(profile.gpa, gpaBandOrder)
  const mcatMatch = mapToBand(profile.mcat, mcatBandOrder)

  const gpaApplicants = percentileRank(rows, 'gpa_band', gpaBandOrder, gpaMatch.index, 'applicants')
  const gpaAcceptees = percentileRank(rows, 'gpa_band', gpaBandOrder, gpaMatch.index, 'acceptees')
  const mcatApplicants = percentileRank(rows, 'mcat_band', mcatBandOrder, mcatMatch.index, 'applicants')
  const mcatAcceptees = percentileRank(rows, 'mcat_band', mcatBandOrder, mcatMatch.index, 'acceptees')

  // applicants/acceptees suppression is recorded independently per cell (see
  // ingest-facts.ts), so the two counts can differ even over the same rows.
  const applicantsSuppressed = gpaApplicants.suppressedCells
  const acceptedSuppressed = gpaAcceptees.suppressedCells
  const notes: string[] = []
  if (applicantsSuppressed > 0) notes.push(`${applicantsSuppressed} cell(s) suppressed on applicants (n<10)`)
  if (acceptedSuppressed > 0) notes.push(`${acceptedSuppressed} cell(s) suppressed on acceptees (n<10)`)

  return {
    cycle_year: cycleYear,
    gpa_band: gpaMatch.label,
    mcat_band: mcatMatch.label,
    gpa_percentile_applicants: gpaApplicants.percentile,
    gpa_percentile_acceptees: gpaAcceptees.percentile,
    mcat_percentile_applicants: mcatApplicants.percentile,
    mcat_percentile_acceptees: mcatAcceptees.percentile,
    note: notes.length > 0 ? `${notes.join(', ')} — excluded from this calculation, a small undercount.` : null,
  }
}
