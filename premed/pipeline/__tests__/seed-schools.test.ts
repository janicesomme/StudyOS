import { describe, it, expect } from 'vitest'
import { createFakeSupabase } from '../../src/lib/__tests__/fake-supabase.js'
import { ensureSchool, SCHOOL_SEEDS } from '../seed-schools.js'

const SEED = {
  name: 'Test Medical School',
  state: 'CA',
  public_private: 'private' as const,
  mission_keywords: ['research', 'education'],
  class_size: 120,
  class_profile_url: 'https://test.edu/class-profile',
}

describe('ensureSchool', () => {
  it('inserts a new school when none exists by that name', async () => {
    const supabase = createFakeSupabase()
    const school = await ensureSchool(supabase as never, SEED)
    expect(school.name).toBe('Test Medical School')
    expect(school.class_size).toBe(120)
  })

  it('is idempotent by name — re-running updates in place, never duplicates (no UNIQUE constraint on pm_schools.name)', async () => {
    const supabase = createFakeSupabase()
    const first = await ensureSchool(supabase as never, SEED)
    const second = await ensureSchool(supabase as never, { ...SEED, class_size: 150 })

    expect(second.id).toBe(first.id)
    expect(second.class_size).toBe(150)
    const rows = (supabase as unknown as { _tables: Record<string, unknown[]> })._tables.pm_schools
    expect(rows).toHaveLength(1)
  })
})

describe('SCHOOL_SEEDS', () => {
  it('has exactly 30 schools', () => {
    expect(SCHOOL_SEEDS).toHaveLength(30)
  })

  it('has no duplicate names', () => {
    const names = SCHOOL_SEEDS.map(s => s.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('never guesses a class_profile_url — every one is a real URL or explicitly null', () => {
    for (const school of SCHOOL_SEEDS) {
      if (school.class_profile_url !== null) {
        expect(() => new URL(school.class_profile_url!)).not.toThrow()
      }
    }
  })
})
