import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ── Profile input ────────────────────────────────────────────────────────────
// Range bounds mirror the CHECK constraints on pm_profiles.gpa_cum / mcat_total
// in supabase/migrations/20260702000000_premed_foundation.sql.

export const ProfileSliceSchema = z.object({
  gpa: z.number().min(0).max(4.0),
  mcat: z.number().int().min(472).max(528),
})
export type ProfileSlice = z.infer<typeof ProfileSliceSchema>

// ── Band parsing ─────────────────────────────────────────────────────────────
// pm_facts_grid band labels come in three shapes (verified against the real
// AAMC Table A-23 workbooks): "X-Y" (inclusive both ends), "Less than X"
// (value < X), "Greater than X" (value > X). Every value in the legal GPA/MCAT
// range falls in exactly one band, with no gaps or overlaps at the boundaries.

const RANGE_RE = /^([\d.]+)-([\d.]+)$/
const LESS_THAN_RE = /^less than ([\d.]+)$/i
const GREATER_THAN_RE = /^greater than ([\d.]+)$/i

export type BandBounds = { min: number; minInclusive: boolean; max: number; maxInclusive: boolean }
export type BandDef = { label: string; bounds: BandBounds }

export function parseBandBounds(label: string): BandBounds {
  const lessThan = LESS_THAN_RE.exec(label)
  if (lessThan) return { min: -Infinity, minInclusive: true, max: Number(lessThan[1]), maxInclusive: false }

  const greaterThan = GREATER_THAN_RE.exec(label)
  if (greaterThan) return { min: Number(greaterThan[1]), minInclusive: false, max: Infinity, maxInclusive: true }

  const range = RANGE_RE.exec(label)
  if (range) return { min: Number(range[1]), minInclusive: true, max: Number(range[2]), maxInclusive: true }

  throw new Error(`Unrecognized band label: "${label}"`)
}

function inBand(value: number, bounds: BandBounds): boolean {
  const aboveMin = bounds.minInclusive ? value >= bounds.min : value > bounds.min
  const belowMax = bounds.maxInclusive ? value <= bounds.max : value < bounds.max
  return aboveMin && belowMax
}

/** Dedupes and sorts band labels ascending by lower bound. */
export function buildBandOrder(labels: string[]): BandDef[] {
  const unique = [...new Set(labels)]
  return unique.map(label => ({ label, bounds: parseBandBounds(label) })).sort((a, b) => a.bounds.min - b.bounds.min)
}

/** Maps a numeric value to the one band in `bandOrder` that contains it. Hard-fails if none matches. */
export function mapToBand(value: number, bandOrder: BandDef[]): { label: string; index: number } {
  const index = bandOrder.findIndex(b => inBand(value, b.bounds))
  if (index === -1) {
    throw new Error(`No band in the provided band list contains value ${value}.`)
  }
  return { label: bandOrder[index].label, index }
}

/** The band one position up (direction=1) or down (direction=-1) from `index`, or null at the edge. */
export function getNeighborLabel(bandOrder: BandDef[], index: number, direction: 1 | -1): string | null {
  return bandOrder[index + direction]?.label ?? null
}

// ── Cell stats ───────────────────────────────────────────────────────────────

export type FactsGridRow = {
  cycle_year: number
  gpa_band: string
  mcat_band: string
  applicants: number | null
  applicants_suppressed: boolean
  acceptees: number | null
  acceptees_suppressed: boolean
}

export type CellStats = {
  cycle_year: number
  gpa_band: string
  mcat_band: string
  applicants: number | null
  applicants_suppressed: boolean
  acceptees: number | null
  acceptees_suppressed: boolean
  acceptance_rate: number | null // percentage, one decimal place; null whenever either count is unknown
  note: string | null
}

/**
 * Never fabricates a rate from a suppressed (AAMC n<10) or missing count — those
 * surface as `acceptance_rate: null` plus a human-readable `note` instead.
 */
export function computeCellStats(
  row: FactsGridRow | null,
  cycleYear: number,
  gpaBand: string,
  mcatBand: string
): CellStats {
  if (!row) {
    return {
      cycle_year: cycleYear,
      gpa_band: gpaBand,
      mcat_band: mcatBand,
      applicants: null,
      applicants_suppressed: false,
      acceptees: null,
      acceptees_suppressed: false,
      acceptance_rate: null,
      note: `No pm_facts_grid data for this cell in cycle_year=${cycleYear}.`,
    }
  }

  let acceptance_rate: number | null = null
  let note: string | null = null

  if (row.applicants_suppressed || row.acceptees_suppressed) {
    note = 'Fewer than 10 nationally — AAMC suppresses this cell for privacy.'
  } else if (row.applicants === 0) {
    note = 'No applicants in this national cohort.'
  } else if (row.applicants !== null && row.acceptees !== null) {
    acceptance_rate = Math.round((row.acceptees / row.applicants) * 1000) / 10
  }

  return {
    cycle_year: cycleYear,
    gpa_band: gpaBand,
    mcat_band: mcatBand,
    applicants: row.applicants,
    applicants_suppressed: row.applicants_suppressed,
    acceptees: row.acceptees,
    acceptees_suppressed: row.acceptees_suppressed,
    acceptance_rate,
    note,
  }
}

// ── Orchestration ────────────────────────────────────────────────────────────

export type NeighborBands = {
  gpaUp: string | null
  gpaDown: string | null
  mcatUp: string | null
  mcatDown: string | null
}

export type CycleCells = {
  cycle_year: number
  mainCell: CellStats
  neighbors: {
    gpaUp: CellStats | null
    gpaDown: CellStats | null
    mcatUp: CellStats | null
    mcatDown: CellStats | null
  }
}

export type CycleDelta = {
  from_cycle_year: number
  to_cycle_year: number
  applicants_delta: number | null
  acceptees_delta: number | null
  acceptance_rate_delta: number | null
  note: string | null
}

export type GapAnalysis = {
  profile: ProfileSlice
  gpa_band: string
  mcat_band: string
  neighborBands: NeighborBands
  cycles: CycleCells[]
  delta: CycleDelta | null
}

const DEFAULT_CYCLE_YEARS = [2023, 2025]

function computeDelta(cycles: CycleCells[]): CycleDelta | null {
  if (cycles.length < 2) return null

  const sorted = [...cycles].sort((a, b) => a.cycle_year - b.cycle_year)
  const from = sorted[0]
  const to = sorted[sorted.length - 1]

  const rateKnown = from.mainCell.acceptance_rate !== null && to.mainCell.acceptance_rate !== null
  const countsKnown =
    from.mainCell.applicants !== null &&
    to.mainCell.applicants !== null &&
    from.mainCell.acceptees !== null &&
    to.mainCell.acceptees !== null

  return {
    from_cycle_year: from.cycle_year,
    to_cycle_year: to.cycle_year,
    applicants_delta: countsKnown ? to.mainCell.applicants! - from.mainCell.applicants! : null,
    acceptees_delta: countsKnown ? to.mainCell.acceptees! - from.mainCell.acceptees! : null,
    acceptance_rate_delta: rateKnown
      ? Math.round((to.mainCell.acceptance_rate! - from.mainCell.acceptance_rate!) * 10) / 10
      : null,
    note: rateKnown ? null : 'Cannot compute a rate delta — one or both cycles have a suppressed or missing cell for this profile.',
  }
}

/**
 * Maps a GPA/MCAT profile slice onto the pm_facts_grid national grid, and
 * returns per-requested-cycle-year odds for the matched cell plus its four
 * one-band neighbors (GPA up/down, MCAT up/down), with a between-cycle delta.
 * Read-only against pm_facts_grid; band definitions are discovered from the
 * table's own stored labels rather than hardcoded.
 */
export async function analyzeProfile(
  supabase: SupabaseClient,
  profileInput: { gpa: number; mcat: number },
  cycleYears: number[] = DEFAULT_CYCLE_YEARS
): Promise<GapAnalysis> {
  const profile = ProfileSliceSchema.parse(profileInput)

  const { data: bandRows, error: bandError } = await supabase
    .from('pm_facts_grid')
    .select('gpa_band, mcat_band')
    .in('cycle_year', cycleYears)
  if (bandError) throw new Error(`Failed to load band definitions from pm_facts_grid: ${bandError.message}`)
  if (!bandRows || bandRows.length === 0) {
    throw new Error(`No pm_facts_grid rows found for cycle years ${cycleYears.join(', ')}.`)
  }

  const gpaBandOrder = buildBandOrder(bandRows.map((r: { gpa_band: string }) => r.gpa_band))
  const mcatBandOrder = buildBandOrder(bandRows.map((r: { mcat_band: string }) => r.mcat_band))

  const gpaMatch = mapToBand(profile.gpa, gpaBandOrder)
  const mcatMatch = mapToBand(profile.mcat, mcatBandOrder)

  const neighborBands: NeighborBands = {
    gpaUp: getNeighborLabel(gpaBandOrder, gpaMatch.index, 1),
    gpaDown: getNeighborLabel(gpaBandOrder, gpaMatch.index, -1),
    mcatUp: getNeighborLabel(mcatBandOrder, mcatMatch.index, 1),
    mcatDown: getNeighborLabel(mcatBandOrder, mcatMatch.index, -1),
  }

  const relevantGpaBands = [gpaMatch.label, neighborBands.gpaUp, neighborBands.gpaDown].filter(
    (v): v is string => v !== null
  )
  const relevantMcatBands = [mcatMatch.label, neighborBands.mcatUp, neighborBands.mcatDown].filter(
    (v): v is string => v !== null
  )

  const cycles: CycleCells[] = []
  for (const cycleYear of cycleYears) {
    const { data: rows, error } = await supabase
      .from('pm_facts_grid')
      .select('cycle_year, gpa_band, mcat_band, applicants, applicants_suppressed, acceptees, acceptees_suppressed')
      .eq('cycle_year', cycleYear)
      .in('gpa_band', relevantGpaBands)
      .in('mcat_band', relevantMcatBands)
    if (error) throw new Error(`Failed to load pm_facts_grid rows for cycle_year=${cycleYear}: ${error.message}`)

    const findRow = (gpaBand: string, mcatBand: string): FactsGridRow | null =>
      (rows ?? []).find((r: FactsGridRow) => r.gpa_band === gpaBand && r.mcat_band === mcatBand) ?? null

    cycles.push({
      cycle_year: cycleYear,
      mainCell: computeCellStats(findRow(gpaMatch.label, mcatMatch.label), cycleYear, gpaMatch.label, mcatMatch.label),
      neighbors: {
        gpaUp: neighborBands.gpaUp
          ? computeCellStats(findRow(neighborBands.gpaUp, mcatMatch.label), cycleYear, neighborBands.gpaUp, mcatMatch.label)
          : null,
        gpaDown: neighborBands.gpaDown
          ? computeCellStats(findRow(neighborBands.gpaDown, mcatMatch.label), cycleYear, neighborBands.gpaDown, mcatMatch.label)
          : null,
        mcatUp: neighborBands.mcatUp
          ? computeCellStats(findRow(gpaMatch.label, neighborBands.mcatUp), cycleYear, gpaMatch.label, neighborBands.mcatUp)
          : null,
        mcatDown: neighborBands.mcatDown
          ? computeCellStats(findRow(gpaMatch.label, neighborBands.mcatDown), cycleYear, gpaMatch.label, neighborBands.mcatDown)
          : null,
      },
    })
  }

  return {
    profile,
    gpa_band: gpaMatch.label,
    mcat_band: mcatMatch.label,
    neighborBands,
    cycles,
    delta: computeDelta(cycles),
  }
}
