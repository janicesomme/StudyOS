import { describe, it, expect } from 'vitest'
import { createFakeSupabase } from './fake-supabase.js'
import { computeCalibrationStats, getRubricCalibrationStats } from '../rubric-calibration.js'

describe('computeCalibrationStats', () => {
  it('computes min/median/max/n for an odd-length set', () => {
    const rows = [{ scores: { theme_coherence: 3 } }, { scores: { theme_coherence: 5 } }, { scores: { theme_coherence: 4 } }]
    const stats = computeCalibrationStats(rows)
    expect(stats.theme_coherence).toEqual({ min: 3, median: 4, max: 5, n: 3 })
  })

  it('averages the two middle values for an even-length set', () => {
    const rows = [{ scores: { theme_coherence: 2 } }, { scores: { theme_coherence: 3 } }, { scores: { theme_coherence: 4 } }, { scores: { theme_coherence: 5 } }]
    const stats = computeCalibrationStats(rows)
    expect(stats.theme_coherence).toEqual({ min: 2, median: 3.5, max: 5, n: 4 })
  })

  it('handles a single-row set (min = median = max)', () => {
    const rows = [{ scores: { narrative_arc: 4 } }]
    const stats = computeCalibrationStats(rows)
    expect(stats.narrative_arc).toEqual({ min: 4, median: 4, max: 4, n: 1 })
  })

  it('computes stats independently per dimension, not mixed together', () => {
    const rows = [
      { scores: { theme_coherence: 5, narrative_arc: 2 } },
      { scores: { theme_coherence: 5, narrative_arc: 2 } },
    ]
    const stats = computeCalibrationStats(rows)
    expect(stats.theme_coherence).toEqual({ min: 5, median: 5, max: 5, n: 2 })
    expect(stats.narrative_arc).toEqual({ min: 2, median: 2, max: 2, n: 2 })
  })

  it('returns an empty object for zero rows', () => {
    expect(computeCalibrationStats([])).toEqual({})
  })
})

describe('getRubricCalibrationStats', () => {
  it('fetches all calibration rows and computes stats', async () => {
    const supabase = createFakeSupabase({
      pm_rubric_calibration: [
        { id: '1', source_label: 'a', source_url: 'u', rubric_version: 'v1', scores: { theme_coherence: 4 }, model: 'claude-sonnet-5', created_at: '2026-01-01' },
        { id: '2', source_label: 'b', source_url: 'u', rubric_version: 'v1', scores: { theme_coherence: 2 }, model: 'claude-sonnet-5', created_at: '2026-01-01' },
      ],
    })
    const stats = await getRubricCalibrationStats(supabase as never)
    expect(stats.theme_coherence).toEqual({ min: 2, median: 3, max: 4, n: 2 })
  })

  it('returns an empty object when the table has no rows', async () => {
    const supabase = createFakeSupabase({ pm_rubric_calibration: [] })
    const stats = await getRubricCalibrationStats(supabase as never)
    expect(stats).toEqual({})
  })
})
