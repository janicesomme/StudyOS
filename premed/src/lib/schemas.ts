import { z } from 'zod'

// AAMC-style Work & Activities categories. Not encoded as a DB CHECK
// constraint (pm_activities.category stays `text` — see PLAN.md scope on
// schema changes); enforced only at this Zod layer.
export const ACTIVITY_CATEGORIES = [
  'clinical_volunteer',
  'clinical_paid',
  'nonclinical_volunteer',
  'research',
  'shadowing',
  'leadership',
  'teaching',
  'publication',
  'extracurricular',
  'other',
] as const
export const ActivityCategorySchema = z.enum(ACTIVITY_CATEGORIES)
export type ActivityCategory = z.infer<typeof ActivityCategorySchema>

export const PmProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  gpa_cum: z.number().min(0).max(4.0).nullable(),
  gpa_science: z.number().min(0).max(4.0).nullable(),
  mcat_total: z.number().int().min(472).max(528).nullable(),
  mcat_date: z.string().nullable(),
  state_residence: z.string().nullable(),
  grad_year: z.number().int().nullable(),
  gap_years: z.number().int().min(0),
  updated_at: z.string().nullable(),
})

export const PmActivitySchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  category: ActivityCategorySchema,
  hours_completed: z.number().int().min(0),
  hours_planned: z.number().int().min(0),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  competencies: z.array(z.string()).nullable(),
  narrative_theme: z.string().nullable(),
  description: z.string().nullable(),
})

export const PmSchoolSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  state: z.string().nullable(),
  public_private: z.enum(['public', 'private']).nullable(),
  mission_keywords: z.array(z.string()).nullable(),
  class_size: z.number().int().min(0).nullable(),
})

export const PmSchoolStatsSchema = z.object({
  id: z.string().uuid(),
  school_id: z.string().uuid(),
  cycle_year: z.number().int(),
  median_gpa: z.number().min(0).max(4.0).nullable(),
  median_mcat: z.number().int().min(472).max(528).nullable(),
  pct_instate: z.number().min(0).max(100).nullable(),
  pct_gap_year: z.number().min(0).max(100).nullable(),
  median_clinical_hours: z.number().int().min(0).nullable(),
  median_research_hours: z.number().int().min(0).nullable(),
  pct_with_publications: z.number().min(0).max(100).nullable(),
  source: z.string().nullable(),
})

export const PmOutcomesCorpusSchema = z.object({
  id: z.string().uuid(),
  cycle_year: z.number().int().nullable(),
  gpa: z.number().min(0).max(4.0).nullable(),
  mcat: z.number().int().min(472).max(528).nullable(),
  state: z.string().nullable(),
  clinical_hours: z.number().int().min(0).nullable(),
  research_hours: z.number().int().min(0).nullable(),
  volunteer_hours: z.number().int().min(0).nullable(),
  has_publication: z.boolean().nullable(),
  gap_years: z.number().int().min(0).nullable(),
  schools_applied: z.number().int().min(0).nullable(),
  interviews: z.number().int().min(0).nullable(),
  acceptances: z.number().int().min(0).nullable(),
  matriculated_school_id: z.string().uuid().nullable(),
  raw_source_url: z.string().nullable(),
})

export const PmNarrativeSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  theme: z.string(),
  supporting_activity_ids: z.array(z.string().uuid()).nullable(),
  mission_fit_school_ids: z.array(z.string().uuid()).nullable(),
  strength_score: z.number().int().min(0).max(100).nullable(),
  updated_at: z.string().nullable(),
})

export const PmFactsGridSchema = z
  .object({
    id: z.string().uuid(),
    cycle_year: z.number().int(),
    gpa_band: z.string().min(1),
    mcat_band: z.string().min(1),
    applicants: z.number().int().min(0).nullable(),
    applicants_suppressed: z.boolean(),
    acceptees: z.number().int().min(0).nullable(),
    acceptees_suppressed: z.boolean(),
    source_file: z.string().min(1),
    source_sheet: z.string().min(1),
    source_sha256: z.string().min(1),
    imported_at: z.string(),
  })
  .refine(row => row.applicants_suppressed === (row.applicants === null), {
    message: 'applicants_suppressed must be true iff applicants is null',
  })
  .refine(row => row.acceptees_suppressed === (row.acceptees === null), {
    message: 'acceptees_suppressed must be true iff acceptees is null',
  })

export type PmProfile = z.infer<typeof PmProfileSchema>
export type PmActivity = z.infer<typeof PmActivitySchema>
export type PmSchool = z.infer<typeof PmSchoolSchema>
export type PmSchoolStats = z.infer<typeof PmSchoolStatsSchema>
export type PmOutcomesCorpus = z.infer<typeof PmOutcomesCorpusSchema>
export type PmNarrative = z.infer<typeof PmNarrativeSchema>
export type PmFactsGrid = z.infer<typeof PmFactsGridSchema>
