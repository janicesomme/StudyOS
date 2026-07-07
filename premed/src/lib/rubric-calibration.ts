import type { SupabaseClient } from '@supabase/supabase-js'

// Browser-safe stats math only — no Node-only imports (no `jsdom`, no `fs`).
// This file is imported directly by EssayReviewSection.tsx; the HTML-parsing/
// essay-splitting logic that builds pm_rubric_calibration rows lives entirely
// in premed/pipeline/calibrate-rubric.ts (Node-only), never here.

export type DimensionCalibrationStats = { min: number; median: number; max: number; n: number }

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/** Computes per-dimension min/median/max/n across all given calibration rows. Each dimension is aggregated independently — a row missing a dimension simply doesn't contribute to that dimension's stats. */
export function computeCalibrationStats(rows: { scores: Record<string, number> }[]): Record<string, DimensionCalibrationStats> {
  const byDimension: Record<string, number[]> = {}
  for (const row of rows) {
    for (const [dimension, score] of Object.entries(row.scores)) {
      ;(byDimension[dimension] ??= []).push(score)
    }
  }

  const stats: Record<string, DimensionCalibrationStats> = {}
  for (const [dimension, scores] of Object.entries(byDimension)) {
    const sorted = [...scores].sort((a, b) => a - b)
    stats[dimension] = { min: sorted[0], median: median(sorted), max: sorted[sorted.length - 1], n: sorted.length }
  }
  return stats
}

/** Fetches every pm_rubric_calibration row (read-open reference table, no filters needed) and computes stats. Throws on a fetch error — callers (e.g. EssayReviewSection) decide how to surface that, distinctly from a genuinely empty table. */
export async function getRubricCalibrationStats(supabase: SupabaseClient): Promise<Record<string, DimensionCalibrationStats>> {
  const { data, error } = await supabase.from('pm_rubric_calibration').select('scores')
  if (error) throw new Error(`Failed to fetch rubric calibration: ${error.message}`)
  return computeCalibrationStats((data ?? []) as { scores: Record<string, number> }[])
}
