import { describe, it, expect } from 'vitest'
import { analyzeProfile } from '../gap-analyzer.js'
import {
  addActivity,
  aggregateActivities,
  createProfile,
  getProfile,
  listActivities,
  profileToSlice,
  updateActivity,
  updateProfile,
} from '../profiles.js'
import { createFakeSupabase } from './fake-supabase.js'

const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'

describe('createProfile', () => {
  it('creates a new profile', async () => {
    const supabase = createFakeSupabase()
    const profile = await createProfile(supabase as never, { user_id: USER_A, gpa_cum: 3.6, mcat_total: 508 })
    expect(profile.user_id).toBe(USER_A)
    expect(profile.gpa_cum).toBe(3.6)
    expect(profile.mcat_total).toBe(508)
    expect(profile.gap_years).toBe(0)
  })

  it('is idempotent — re-running with the same user_id updates in place, never duplicates', async () => {
    const supabase = createFakeSupabase()
    const first = await createProfile(supabase as never, { user_id: USER_A, gpa_cum: 3.6, mcat_total: 508 })
    const second = await createProfile(supabase as never, { user_id: USER_A, gpa_cum: 3.7, mcat_total: 510 })

    expect(second.id).toBe(first.id)
    expect(second.gpa_cum).toBe(3.7)
    expect(second.mcat_total).toBe(510)
    expect((supabase as any)._tables.pm_profiles).toHaveLength(1)
  })

  it('rejects an out-of-range gpa before touching the database', async () => {
    const supabase = createFakeSupabase()
    await expect(createProfile(supabase as never, { user_id: USER_A, gpa_cum: 4.5 })).rejects.toThrow()
    expect((supabase as any)._tables.pm_profiles ?? []).toHaveLength(0)
  })
})

describe('getProfile', () => {
  it('returns null when no profile exists for the user', async () => {
    const supabase = createFakeSupabase()
    expect(await getProfile(supabase as never, USER_A)).toBeNull()
  })

  it('returns the matching profile', async () => {
    const supabase = createFakeSupabase()
    await createProfile(supabase as never, { user_id: USER_A, gpa_cum: 3.6, mcat_total: 508 })
    await createProfile(supabase as never, { user_id: USER_B, gpa_cum: 3.9, mcat_total: 520 })

    const found = await getProfile(supabase as never, USER_B)
    expect(found?.user_id).toBe(USER_B)
    expect(found?.gpa_cum).toBe(3.9)
  })
})

describe('updateProfile', () => {
  it('applies a partial patch by profile id', async () => {
    const supabase = createFakeSupabase()
    const profile = await createProfile(supabase as never, { user_id: USER_A, gpa_cum: 3.6, mcat_total: 508 })
    const updated = await updateProfile(supabase as never, profile.id, { gap_years: 2 })
    expect(updated.gap_years).toBe(2)
    expect(updated.gpa_cum).toBe(3.6) // untouched fields survive
  })
})

describe('activities', () => {
  it('addActivity inserts a row scoped to the profile', async () => {
    const supabase = createFakeSupabase()
    const profile = await createProfile(supabase as never, { user_id: USER_A })
    const activity = await addActivity(supabase as never, {
      profile_id: profile.id,
      category: 'clinical_volunteer',
      hours_completed: 120,
    })
    expect(activity.category).toBe('clinical_volunteer')
    expect(activity.hours_completed).toBe(120)
    expect(activity.profile_id).toBe(profile.id)
  })

  it('rejects an unrecognized category with a clean error', async () => {
    const supabase = createFakeSupabase()
    const profile = await createProfile(supabase as never, { user_id: USER_A })
    await expect(
      addActivity(supabase as never, { profile_id: profile.id, category: 'underwater_basket_weaving' as never })
    ).rejects.toThrow()
  })

  it('listActivities returns only the requested profile\'s activities', async () => {
    const supabase = createFakeSupabase()
    const profileA = await createProfile(supabase as never, { user_id: USER_A })
    const profileB = await createProfile(supabase as never, { user_id: USER_B })
    await addActivity(supabase as never, { profile_id: profileA.id, category: 'research', hours_completed: 100 })
    await addActivity(supabase as never, { profile_id: profileB.id, category: 'leadership', hours_completed: 50 })

    const activitiesA = await listActivities(supabase as never, profileA.id)
    expect(activitiesA).toHaveLength(1)
    expect(activitiesA[0].category).toBe('research')
  })

  it('updateActivity patches an existing row by id', async () => {
    const supabase = createFakeSupabase()
    const profile = await createProfile(supabase as never, { user_id: USER_A })
    const activity = await addActivity(supabase as never, {
      profile_id: profile.id,
      category: 'research',
      hours_completed: 100,
    })
    const updated = await updateActivity(supabase as never, activity.id, { hours_completed: 250 })
    expect(updated.hours_completed).toBe(250)
    expect(updated.category).toBe('research')
  })
})

describe('profileToSlice', () => {
  it('extracts {gpa, mcat} when both are present', async () => {
    const supabase = createFakeSupabase()
    const profile = await createProfile(supabase as never, { user_id: USER_A, gpa_cum: 3.6, mcat_total: 508 })
    expect(profileToSlice(profile)).toEqual({ gpa: 3.6, mcat: 508 })
  })

  it('throws a clear error when gpa_cum or mcat_total is missing', async () => {
    const supabase = createFakeSupabase()
    const profile = await createProfile(supabase as never, { user_id: USER_A }) // no gpa/mcat
    expect(() => profileToSlice(profile)).toThrow(/missing gpa_cum or mcat_total/)
  })
})

describe('aggregateActivities', () => {
  it('sums hours_completed per category', () => {
    const summary = aggregateActivities([
      { category: 'clinical_volunteer', hours_completed: 40 },
      { category: 'clinical_volunteer', hours_completed: 60 },
      { category: 'research', hours_completed: 100 },
    ])
    expect(summary).toEqual(
      expect.arrayContaining([
        { category: 'clinical_volunteer', hoursCompleted: 100 },
        { category: 'research', hoursCompleted: 100 },
      ])
    )
  })

  it('returns an empty array for no activities', () => {
    expect(aggregateActivities([])).toEqual([])
  })
})

// ── profile -> Gap Analyzer wiring (reuses analyzeProfile, no duplicated logic) ─

describe('profile-analyze wiring', () => {
  const GPA_BANDS = ['3.60-3.79', '3.40-3.59', 'Greater than 3.79']
  const MCAT_BANDS = ['506-509', '502-505', '510-513']

  function seedFactsGrid() {
    const rows: Record<string, unknown>[] = []
    for (const gpa_band of GPA_BANDS) {
      for (const mcat_band of MCAT_BANDS) {
        rows.push({
          id: `${gpa_band}-${mcat_band}`,
          cycle_year: 2025,
          gpa_band,
          mcat_band,
          applicants: 1000,
          applicants_suppressed: false,
          acceptees: 400,
          acceptees_suppressed: false,
        })
      }
    }
    return rows
  }

  it('a stored profile flows through profileToSlice straight into analyzeProfile', async () => {
    const supabase = createFakeSupabase({ pm_facts_grid: seedFactsGrid() })
    const profile = await createProfile(supabase as never, { user_id: USER_A, gpa_cum: 3.7, mcat_total: 508 })

    const stored = await getProfile(supabase as never, USER_A)
    expect(stored).not.toBeNull()

    const result = await analyzeProfile(supabase as never, profileToSlice(stored!), [2025])
    expect(result.gpa_band).toBe('3.60-3.79')
    expect(result.mcat_band).toBe('506-509')
    expect(result.cycles[0].mainCell.acceptance_rate).toBe(40.0)
    expect(profile.id).toBe(stored!.id)
  })
})
