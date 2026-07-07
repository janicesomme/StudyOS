import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { EssayReview } from './committee-simulator.ts'
import { PmEssayReviewSchema, type PmEssayReview } from './schemas.ts'

// pm_essay_reviews is user-owned via pm_profiles (same join-based RLS tier as
// pm_activities/pm_narratives) — see supabase/migrations for the applied
// schema. Every review is stored, never overwritten: review history is
// progress tracking, not a single current-state row.

/** Web Crypto (not Node's `crypto` module) — this file is imported by the browser dashboard via useRealProfileData.ts, and every premed/src/lib/*.ts file must stay Node-import-free. */
export async function hashEssay(essay: string): Promise<string> {
  const bytes = new TextEncoder().encode(essay)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export const SaveEssayReviewInputSchema = z.object({
  profile_id: z.string().uuid(),
  essay: z.string().min(1),
  rubric_version: z.string().min(1),
  review: z.custom<EssayReview>(v => typeof v === 'object' && v !== null),
  model: z.string().min(1),
})
export type SaveEssayReviewInput = z.infer<typeof SaveEssayReviewInputSchema>

export function scoresSummary(review: EssayReview): Record<string, number> {
  return Object.fromEntries(review.dimensionScores.map(d => [d.dimension, d.score]))
}

export async function saveEssayReview(supabase: SupabaseClient, input: SaveEssayReviewInput): Promise<PmEssayReview> {
  const parsed = SaveEssayReviewInputSchema.parse(input)
  const row = {
    profile_id: parsed.profile_id,
    essay_sha256: await hashEssay(parsed.essay),
    rubric_version: parsed.rubric_version,
    scores: scoresSummary(parsed.review),
    review: parsed.review,
    model: parsed.model,
    // Set explicitly rather than relying on the column DEFAULT now() — same
    // defensive convention as pm_profiles.updated_at in profiles.ts.
    created_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('pm_essay_reviews').insert(row).select().single()
  if (error) throw new Error(`Failed to save essay review for profile_id=${parsed.profile_id}: ${error.message}`)
  return PmEssayReviewSchema.parse(data)
}

/** Old rows (saved before redFlags existed in EssayReviewSchema) have no `redFlags` key in their jsonb — normalized to [] here so every caller sees a consistent shape without re-validating against the current EssayReview schema. */
function normalizeReview(row: Record<string, unknown>): Record<string, unknown> {
  const review = row.review as Record<string, unknown> | null
  if (!review || Array.isArray(review.redFlags)) return row
  return { ...row, review: { ...review, redFlags: [] } }
}

export async function listEssayReviews(supabase: SupabaseClient, profileId: string): Promise<PmEssayReview[]> {
  const { data, error } = await supabase
    .from('pm_essay_reviews')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to list essay reviews for profile_id=${profileId}: ${error.message}`)
  return (data ?? []).map((row: unknown) => PmEssayReviewSchema.parse(normalizeReview(row as Record<string, unknown>)))
}
