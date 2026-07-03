import { describe, it, expect } from 'vitest'
import { computeApplicantPoolPosition } from '../corpus-stats.js'
import { createFakeSupabase } from './fake-supabase.js'

const GPA_BANDS = ['3.20-3.39', '3.40-3.59', '3.60-3.79']
const MCAT_BANDS = ['502-505', '506-509', '510-513']

describe('computeApplicantPoolPosition — percentile math', () => {
  it('computes independent applicant/acceptee percentiles for both GPA and MCAT dimensions', async () => {
    // Row sums (per GPA band, across all MCAT bands): 150 / 300 / 450 applicants; 30 / 30 / 240 acceptees.
    // Column sums (per MCAT band, across all GPA bands): uniform 300 applicants, 100 acceptees per column.
    const rows: Record<string, unknown>[] = []
    let i = 0
    const applicantsPerCell = [
      [50, 50, 50],
      [100, 100, 100],
      [150, 150, 150],
    ]
    const acceptedPerCell = [
      [10, 10, 10],
      [10, 10, 10],
      [80, 80, 80],
    ]
    for (let g = 0; g < GPA_BANDS.length; g++) {
      for (let m = 0; m < MCAT_BANDS.length; m++) {
        rows.push({
          id: `cell-${i++}`,
          cycle_year: 2025,
          gpa_band: GPA_BANDS[g],
          mcat_band: MCAT_BANDS[m],
          applicants: applicantsPerCell[g][m],
          acceptees: acceptedPerCell[g][m],
        })
      }
    }
    const supabase = createFakeSupabase({ pm_facts_grid: rows })

    // Profile: GPA 3.5 -> band "3.40-3.59" (index 1); MCAT 508 -> band "506-509" (index 1).
    const result = await computeApplicantPoolPosition(supabase as never, { gpa: 3.5, mcat: 508 }, 2025)

    expect(result.gpa_band).toBe('3.40-3.59')
    expect(result.mcat_band).toBe('506-509')
    expect(result.gpa_percentile_applicants).toBe(50.0) // (150+300)/900
    expect(result.gpa_percentile_acceptees).toBe(20.0) // (30+30)/300
    expect(result.mcat_percentile_applicants).toBe(66.7) // (300+300)/900
    expect(result.mcat_percentile_acceptees).toBe(66.7) // (100+100)/300
    expect(result.note).toBeNull()
  })

  it('the top band is always the 100th percentile, the bottom band the lowest', async () => {
    // Open-ended bands covering the full range, matching the real AAMC shape
    // (a fixture missing "Less than X"/"Greater than X" edges would leave
    // gaps mapToBand can't place an out-of-range profile value into).
    const supabase = createFakeSupabase({
      pm_facts_grid: [
        { id: 'a', cycle_year: 2025, gpa_band: 'Less than 3.40', mcat_band: '506-509', applicants: 100, acceptees: 40 },
        { id: 'b', cycle_year: 2025, gpa_band: 'Greater than 3.79', mcat_band: '506-509', applicants: 200, acceptees: 60 },
      ],
    })
    const top = await computeApplicantPoolPosition(supabase as never, { gpa: 3.9, mcat: 508 }, 2025)
    expect(top.gpa_percentile_applicants).toBe(100.0)
    expect(top.gpa_percentile_acceptees).toBe(100.0)

    const bottom = await computeApplicantPoolPosition(supabase as never, { gpa: 3.3, mcat: 508 }, 2025)
    expect(bottom.gpa_percentile_applicants).toBe(33.3) // 100 / (100+200), rounded to 1 decimal
    expect(bottom.gpa_percentile_acceptees).toBe(40.0) // 40 / (40+60)
  })
})

describe('computeApplicantPoolPosition — suppressed cells', () => {
  it('excludes suppressed (null) cells from the percentile calculation and notes the exclusion', async () => {
    const supabase = createFakeSupabase({
      pm_facts_grid: [
        { id: 'a', cycle_year: 2025, gpa_band: '3.40-3.59', mcat_band: '506-509', applicants: 100, acceptees: 50 },
        { id: 'b', cycle_year: 2025, gpa_band: '3.60-3.79', mcat_band: '506-509', applicants: null, acceptees: 50 },
      ],
    })
    const result = await computeApplicantPoolPosition(supabase as never, { gpa: 3.5, mcat: 508 }, 2025)

    // applicants: only the non-null cell (100) counts toward the total; profile's band ("3.40-3.59")
    // is the only one with data, so it's 100% of the (smaller) usable denominator.
    expect(result.gpa_percentile_applicants).toBe(100.0)
    expect(result.gpa_percentile_acceptees).toBe(50.0) // (50)/(50+50) — both acceptee cells have data
    expect(result.note).toMatch(/1 cell\(s\) suppressed on applicants/)
  })
})

describe('computeApplicantPoolPosition — no data', () => {
  it('throws a clear error when the cycle year has no pm_facts_grid rows', async () => {
    const supabase = createFakeSupabase({ pm_facts_grid: [] })
    await expect(computeApplicantPoolPosition(supabase as never, { gpa: 3.5, mcat: 508 }, 1999)).rejects.toThrow(
      /No pm_facts_grid rows found/
    )
  })
})
