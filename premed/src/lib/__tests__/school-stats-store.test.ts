import { describe, it, expect } from 'vitest'
import { loadSchoolIdMap, upsertSchoolStats } from '../school-stats-store.js'
import { createFakeSupabase } from './fake-supabase.js'

const STATS = {
  median_gpa: 3.7,
  median_mcat: 512,
  pct_instate: 60,
  pct_gap_year: null,
  median_clinical_hours: 400,
  median_research_hours: 600,
  pct_with_publications: null,
  cycle_year: 2029,
}

describe('loadSchoolIdMap', () => {
  it('maps school name to id', async () => {
    const supabase = createFakeSupabase({
      pm_schools: [
        { id: 'school-1', name: 'Test School A' },
        { id: 'school-2', name: 'Test School B' },
      ],
    })
    const map = await loadSchoolIdMap(supabase as never)
    expect(map.get('Test School A')).toBe('school-1')
    expect(map.get('Test School B')).toBe('school-2')
  })
})

describe('upsertSchoolStats', () => {
  it('inserts a new row with the source URL folded into the source column', async () => {
    const supabase = createFakeSupabase()
    await upsertSchoolStats(supabase as never, 'school-1', STATS, 'https://example.edu/class-profile')
    const rows = (supabase as unknown as { _tables: Record<string, unknown[]> })._tables.pm_school_stats
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      school_id: 'school-1',
      cycle_year: 2029,
      median_gpa: 3.7,
      source: 'class_profile:https://example.edu/class-profile',
    })
  })

  it('is idempotent on (school_id, cycle_year) — re-running updates in place, never duplicates', async () => {
    const supabase = createFakeSupabase()
    await upsertSchoolStats(supabase as never, 'school-1', STATS, 'https://example.edu/class-profile')
    await upsertSchoolStats(supabase as never, 'school-1', { ...STATS, median_gpa: 3.85 }, 'https://example.edu/class-profile')

    const rows = (supabase as unknown as { _tables: Record<string, unknown[]> })._tables.pm_school_stats
    expect(rows).toHaveLength(1)
    expect((rows[0] as { median_gpa: number }).median_gpa).toBe(3.85)
  })

  it('a different cycle_year for the same school creates a second row, not a conflict', async () => {
    const supabase = createFakeSupabase()
    await upsertSchoolStats(supabase as never, 'school-1', STATS, 'https://example.edu/class-profile')
    await upsertSchoolStats(supabase as never, 'school-1', { ...STATS, cycle_year: 2027 }, 'https://example.edu/class-profile')

    const rows = (supabase as unknown as { _tables: Record<string, unknown[]> })._tables.pm_school_stats
    expect(rows).toHaveLength(2)
  })

  it('throws rather than upserting when cycle_year is null (NOT NULL column)', async () => {
    const supabase = createFakeSupabase()
    await expect(
      upsertSchoolStats(supabase as never, 'school-1', { ...STATS, cycle_year: null }, 'https://example.edu/class-profile')
    ).rejects.toThrow(/cycle_year is null/)
  })
})
