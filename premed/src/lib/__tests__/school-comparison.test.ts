import { describe, it, expect } from 'vitest'
import { findSchool } from '../school-comparison.js'
import { createFakeSupabase } from './fake-supabase.js'

describe('findSchool', () => {
  it('finds a school by a fuzzy substring match, case-insensitive', async () => {
    const supabase = createFakeSupabase({
      pm_schools: [{ id: '1', name: 'Tulane University School of Medicine', mission_keywords: ['rural', 'primary care'] }],
    })
    const found = await findSchool(supabase as never, 'tulane')
    expect(found?.name).toBe('Tulane University School of Medicine')
    expect(found?.mission_keywords).toEqual(['rural', 'primary care'])
  })

  it('returns null when no school matches', async () => {
    const supabase = createFakeSupabase({
      pm_schools: [{ id: '1', name: 'Tulane University School of Medicine', mission_keywords: null }],
    })
    expect(await findSchool(supabase as never, 'Nonexistent School')).toBeNull()
  })
})
