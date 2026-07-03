import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getProfile, listActivities } from './profiles.js'
import { PmOutcomesCorpusSchema, type ActivityCategory, type PmOutcomesCorpus } from './schemas.js'

// First-party self-reported outcomes only (session 6 pivot — see
// docs/handoffs/2026-07-03-premed-session-6.md for why: step 0 couldn't
// verify Reddit/SDN scraping compliance, so pm_outcomes_corpus is no longer
// a scraped anonymous corpus). Every row is owned by the reporting user
// (RLS-enforced) and requires explicit consent at write time.

export const ReportOutcomeInputSchema = z.object({
  user_id: z.string().uuid(),
  cycle_year: z.number().int(),
  schools_applied: z.number().int().min(0),
  interviews: z.number().int().min(0),
  acceptances: z.number().int().min(0),
  matriculated_school_id: z.string().uuid().nullable().optional(),
  // A literal `true` — consent can't be defaulted or inferred, only explicitly given.
  consent_to_store: z.literal(true),
})
export type ReportOutcomeInput = z.infer<typeof ReportOutcomeInputSchema>

const CLINICAL_CATEGORIES: ActivityCategory[] = ['clinical_volunteer', 'clinical_paid']

function sumHours(activities: { category: ActivityCategory; hours_completed: number }[], categories: ActivityCategory[]): number {
  return activities.filter(a => categories.includes(a.category)).reduce((sum, a) => sum + a.hours_completed, 0)
}

/**
 * Snapshots the user's current profile + activities into a pm_outcomes_corpus
 * row alongside their reported cycle results (schools_applied/interviews/
 * acceptances) — so the corpus doesn't require re-entering numbers already
 * stored elsewhere, and each row is a self-contained historical record.
 * Upserts on (user_id, cycle_year): re-reporting the same cycle updates in
 * place rather than duplicating.
 */
export async function reportOutcome(supabase: SupabaseClient, input: ReportOutcomeInput): Promise<PmOutcomesCorpus> {
  const parsed = ReportOutcomeInputSchema.parse(input)

  const profile = await getProfile(supabase, parsed.user_id)
  if (!profile) throw new Error(`No profile found for user_id=${parsed.user_id}. Run profile-create first.`)
  const activities = await listActivities(supabase, profile.id)

  const row = {
    user_id: parsed.user_id,
    consent_to_store: parsed.consent_to_store,
    cycle_year: parsed.cycle_year,
    gpa: profile.gpa_cum,
    mcat: profile.mcat_total,
    state: profile.state_residence,
    clinical_hours: sumHours(activities, CLINICAL_CATEGORIES),
    research_hours: sumHours(activities, ['research']),
    volunteer_hours: sumHours(activities, ['nonclinical_volunteer']),
    has_publication: activities.some(a => a.category === 'publication'),
    gap_years: profile.gap_years,
    schools_applied: parsed.schools_applied,
    interviews: parsed.interviews,
    acceptances: parsed.acceptances,
    matriculated_school_id: parsed.matriculated_school_id ?? null,
    raw_source_url: null,
  }

  const { data, error } = await supabase
    .from('pm_outcomes_corpus')
    .upsert(row, { onConflict: 'user_id,cycle_year' })
    .select()
    .single()
  if (error) throw new Error(`Failed to report outcome for user_id=${parsed.user_id}, cycle_year=${parsed.cycle_year}: ${error.message}`)
  return PmOutcomesCorpusSchema.parse(data)
}
