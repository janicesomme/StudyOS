import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { ActivityCategorySchema, PmActivitySchema, PmProfileSchema, type PmActivity, type PmProfile } from './schemas.js'

// Functions take a user_id/profile_id explicitly rather than reading
// auth.uid() — there's no auth UI yet, and every pipeline script in this repo
// runs with the Supabase service role key (same convention as
// ingest-facts.ts / gap-analyzer.ts).

// ── Profiles ─────────────────────────────────────────────────────────────────

export const CreateProfileInputSchema = z.object({
  user_id: z.string().uuid(),
  gpa_cum: z.number().min(0).max(4.0).nullable().optional(),
  gpa_science: z.number().min(0).max(4.0).nullable().optional(),
  mcat_total: z.number().int().min(472).max(528).nullable().optional(),
  mcat_date: z.string().nullable().optional(),
  state_residence: z.string().nullable().optional(),
  grad_year: z.number().int().nullable().optional(),
  gap_years: z.number().int().min(0).optional(),
})
export type CreateProfileInput = z.infer<typeof CreateProfileInputSchema>

/**
 * Upserts by `user_id` (the table's UNIQUE key) — re-running with the same
 * user_id updates the existing profile rather than creating a second one.
 */
export async function createProfile(supabase: SupabaseClient, input: CreateProfileInput): Promise<PmProfile> {
  const parsed = CreateProfileInputSchema.parse(input)
  const row = {
    user_id: parsed.user_id,
    gpa_cum: parsed.gpa_cum ?? null,
    gpa_science: parsed.gpa_science ?? null,
    mcat_total: parsed.mcat_total ?? null,
    mcat_date: parsed.mcat_date ?? null,
    state_residence: parsed.state_residence ?? null,
    grad_year: parsed.grad_year ?? null,
    gap_years: parsed.gap_years ?? 0,
    // Set explicitly rather than relying on the column DEFAULT — DEFAULT
    // now() only fires on INSERT, not on ON CONFLICT ... DO UPDATE (same
    // lesson applied to pm_facts_grid.imported_at in session 1).
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('pm_profiles').upsert(row, { onConflict: 'user_id' }).select().single()
  if (error) throw new Error(`Failed to create/update profile for user_id=${parsed.user_id}: ${error.message}`)
  return PmProfileSchema.parse(data)
}

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<PmProfile | null> {
  const { data, error } = await supabase.from('pm_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(`Failed to load profile for user_id=${userId}: ${error.message}`)
  if (!data) return null
  return PmProfileSchema.parse(data)
}

export const UpdateProfileInputSchema = z.object({
  gpa_cum: z.number().min(0).max(4.0).nullable().optional(),
  gpa_science: z.number().min(0).max(4.0).nullable().optional(),
  mcat_total: z.number().int().min(472).max(528).nullable().optional(),
  mcat_date: z.string().nullable().optional(),
  state_residence: z.string().nullable().optional(),
  grad_year: z.number().int().nullable().optional(),
  gap_years: z.number().int().min(0).optional(),
})
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>

/** Partial patch by profile `id` (not `user_id`) — use `getProfile` first to resolve the id. */
export async function updateProfile(
  supabase: SupabaseClient,
  profileId: string,
  patch: UpdateProfileInput
): Promise<PmProfile> {
  const parsed = UpdateProfileInputSchema.parse(patch)
  const { data, error } = await supabase
    .from('pm_profiles')
    .update({ ...parsed, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .select()
    .single()
  if (error) throw new Error(`Failed to update profile id=${profileId}: ${error.message}`)
  return PmProfileSchema.parse(data)
}

/**
 * Extracts the {gpa, mcat} slice the Gap Analyzer needs from a stored
 * profile. Hard-fails with a clear message if either field hasn't been
 * filled in yet, rather than letting `analyzeProfile`'s own Zod validation
 * report a confusing "expected number, got null".
 */
export function profileToSlice(profile: PmProfile): { gpa: number; mcat: number } {
  if (profile.gpa_cum === null || profile.mcat_total === null) {
    throw new Error(
      `Profile for user_id=${profile.user_id} is missing gpa_cum or mcat_total — cannot run the Gap Analyzer. ` +
        `Run profile-create with --gpa and --mcat first.`
    )
  }
  return { gpa: profile.gpa_cum, mcat: profile.mcat_total }
}

// ── Activities ───────────────────────────────────────────────────────────────

export const AddActivityInputSchema = z.object({
  profile_id: z.string().uuid(),
  category: ActivityCategorySchema,
  hours_completed: z.number().int().min(0).optional(),
  hours_planned: z.number().int().min(0).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  competencies: z.array(z.string()).nullable().optional(),
  narrative_theme: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})
export type AddActivityInput = z.infer<typeof AddActivityInputSchema>

export async function addActivity(supabase: SupabaseClient, input: AddActivityInput): Promise<PmActivity> {
  const parsed = AddActivityInputSchema.parse(input)
  const row = {
    profile_id: parsed.profile_id,
    category: parsed.category,
    hours_completed: parsed.hours_completed ?? 0,
    hours_planned: parsed.hours_planned ?? 0,
    start_date: parsed.start_date ?? null,
    end_date: parsed.end_date ?? null,
    competencies: parsed.competencies ?? null,
    narrative_theme: parsed.narrative_theme ?? null,
    description: parsed.description ?? null,
  }
  const { data, error } = await supabase.from('pm_activities').insert(row).select().single()
  if (error) throw new Error(`Failed to add activity for profile_id=${parsed.profile_id}: ${error.message}`)
  return PmActivitySchema.parse(data)
}

export async function listActivities(supabase: SupabaseClient, profileId: string): Promise<PmActivity[]> {
  const { data, error } = await supabase
    .from('pm_activities')
    .select('*')
    .eq('profile_id', profileId)
    .order('category')
  if (error) throw new Error(`Failed to list activities for profile_id=${profileId}: ${error.message}`)
  return (data ?? []).map((row: unknown) => PmActivitySchema.parse(row))
}

export const UpdateActivityInputSchema = z.object({
  category: ActivityCategorySchema.optional(),
  hours_completed: z.number().int().min(0).optional(),
  hours_planned: z.number().int().min(0).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  competencies: z.array(z.string()).nullable().optional(),
  narrative_theme: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})
export type UpdateActivityInput = z.infer<typeof UpdateActivityInputSchema>

export async function updateActivity(
  supabase: SupabaseClient,
  activityId: string,
  patch: UpdateActivityInput
): Promise<PmActivity> {
  const parsed = UpdateActivityInputSchema.parse(patch)
  const { data, error } = await supabase.from('pm_activities').update(parsed).eq('id', activityId).select().single()
  if (error) throw new Error(`Failed to update activity id=${activityId}: ${error.message}`)
  return PmActivitySchema.parse(data)
}
