import { describe, it, expect } from 'vitest'
import { createProfile, addActivity } from '../profiles.js'
import { reportOutcome } from '../outcomes.js'
import { createFakeSupabase } from './fake-supabase.js'

const USER_A = '11111111-1111-4111-8111-111111111111'

async function seedProfileWithActivities(supabase: unknown) {
  const profile = await createProfile(supabase as never, { user_id: USER_A, gpa_cum: 3.7, mcat_total: 512, gap_years: 1 })
  await addActivity(supabase as never, { profile_id: profile.id, category: 'clinical_volunteer', hours_completed: 150 })
  await addActivity(supabase as never, { profile_id: profile.id, category: 'clinical_paid', hours_completed: 200 })
  await addActivity(supabase as never, { profile_id: profile.id, category: 'research', hours_completed: 400 })
  await addActivity(supabase as never, { profile_id: profile.id, category: 'nonclinical_volunteer', hours_completed: 80 })
  await addActivity(supabase as never, { profile_id: profile.id, category: 'publication', hours_completed: 0 })
  return profile
}

describe('reportOutcome', () => {
  it('snapshots the profile and sums activity hours by category into the outcome row', async () => {
    const supabase = createFakeSupabase()
    await seedProfileWithActivities(supabase)

    const outcome = await reportOutcome(supabase as never, {
      user_id: USER_A,
      cycle_year: 2026,
      schools_applied: 15,
      interviews: 4,
      acceptances: 2,
      consent_to_store: true,
    })

    expect(outcome.gpa).toBe(3.7)
    expect(outcome.mcat).toBe(512)
    expect(outcome.gap_years).toBe(1)
    expect(outcome.clinical_hours).toBe(350) // clinical_volunteer(150) + clinical_paid(200)
    expect(outcome.research_hours).toBe(400)
    expect(outcome.volunteer_hours).toBe(80) // nonclinical_volunteer only
    expect(outcome.has_publication).toBe(true)
    expect(outcome.schools_applied).toBe(15)
    expect(outcome.interviews).toBe(4)
    expect(outcome.acceptances).toBe(2)
    expect(outcome.consent_to_store).toBe(true)
  })

  it('is idempotent on (user_id, cycle_year) — re-reporting the same cycle updates in place', async () => {
    const supabase = createFakeSupabase()
    await seedProfileWithActivities(supabase)

    const first = await reportOutcome(supabase as never, {
      user_id: USER_A,
      cycle_year: 2026,
      schools_applied: 10,
      interviews: 2,
      acceptances: 0,
      consent_to_store: true,
    })
    const second = await reportOutcome(supabase as never, {
      user_id: USER_A,
      cycle_year: 2026,
      schools_applied: 15,
      interviews: 4,
      acceptances: 2,
      consent_to_store: true,
    })

    expect(second.id).toBe(first.id)
    expect(second.acceptances).toBe(2)
    const rows = (supabase as unknown as { _tables: Record<string, unknown[]> })._tables.pm_outcomes_corpus
    expect(rows).toHaveLength(1)
  })

  it('a different cycle_year for the same user creates a second row, not a conflict', async () => {
    const supabase = createFakeSupabase()
    await seedProfileWithActivities(supabase)

    await reportOutcome(supabase as never, {
      user_id: USER_A,
      cycle_year: 2025,
      schools_applied: 10,
      interviews: 2,
      acceptances: 0,
      consent_to_store: true,
    })
    await reportOutcome(supabase as never, {
      user_id: USER_A,
      cycle_year: 2026,
      schools_applied: 15,
      interviews: 4,
      acceptances: 2,
      consent_to_store: true,
    })

    const rows = (supabase as unknown as { _tables: Record<string, unknown[]> })._tables.pm_outcomes_corpus
    expect(rows).toHaveLength(2)
  })

  it('rejects when consent_to_store is not explicitly true', async () => {
    const supabase = createFakeSupabase()
    await seedProfileWithActivities(supabase)

    await expect(
      reportOutcome(supabase as never, {
        user_id: USER_A,
        cycle_year: 2026,
        schools_applied: 15,
        interviews: 4,
        acceptances: 2,
        consent_to_store: false as never,
      })
    ).rejects.toThrow()
  })

  it('throws a clear error when no profile exists for the user', async () => {
    const supabase = createFakeSupabase()
    await expect(
      reportOutcome(supabase as never, {
        user_id: USER_A,
        cycle_year: 2026,
        schools_applied: 15,
        interviews: 4,
        acceptances: 2,
        consent_to_store: true,
      })
    ).rejects.toThrow(/No profile found/)
  })
})
