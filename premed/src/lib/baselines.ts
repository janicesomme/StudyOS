import type { ActivityCategory } from './schemas.js'

export type CategoryBaseline = {
  /** Widely-cited "competitive" hour benchmark for this category, or null if no meaningful hour norm exists. */
  competitive: number | null
  /** Minimum hours below which the experience reads as negligible/token, or null alongside `competitive`. */
  floor: number | null
  /** Source + rationale, always present even when competitive/floor are null. */
  note: string
}

/**
 * Hardcoded competitive/floor hour baselines per activity category, current as
 * of 2026-07. These are not official AAMC cutoffs — AAMC does not publish
 * required hour minimums — they're the AAMC-adjacent Matriculating Student
 * Questionnaire (MSQ) data points and widely-cited premed advising consensus
 * numbers researched live for this file (see per-category source comments).
 * Every advising source consulted stresses quality/longitudinal commitment
 * over hitting a specific number; these are read-out anchors, not targets to
 * game.
 *
 * Swap-out note: this module exposes only `getBaseline`/`getAllBaselines`,
 * both async. A future session backing these with a `pm_school_stats` (or
 * similar) query can replace the function bodies below without changing
 * activity-gap.ts or anything else that imports this module.
 */
const ACTIVITY_BASELINES: Record<ActivityCategory, CategoryBaseline> = {
  // Source: premed advising consensus (JackWestin, Leland, Blueprint MCAT,
  // 2026) — "aim for 100-150 hours... 150+ hours considered competitive."
  // https://jackwestin.com/resources/blog/get-into-med-school-how-many-volunteer-hours-do-i-need
  clinical_volunteer: {
    competitive: 150,
    floor: 100,
    note: '100-150h shows meaningful clinical exposure; 150+ is the widely-cited competitive bar for volunteer (unpaid) clinical roles.',
  },

  // Source: International Medical Aid / premed advising consensus (2026) —
  // "~100-150 hours minimum... competitive range of 200-400+ hours" for paid
  // clinical roles (EMT, scribe, CNA), which run higher than volunteer hours
  // since they're jobs, not shifts.
  // https://medicalaid.org/blog/how-many-clinical-hours-make-you-a-competitive-applicant-in-2026-a-data-driven-look/
  clinical_paid: {
    competitive: 300,
    floor: 150,
    note: 'Paid clinical roles (EMT/scribe/CNA) run higher than volunteer hours since they are employment; 300h+ is the widely-cited competitive range.',
  },

  // Source: JackWestin / UConn Pre-Health Advising (2026) — "50-100 hours of
  // non-clinical volunteering... showcase commitment to community service."
  // https://premed.uconn.edu/community-service/
  nonclinical_volunteer: {
    competitive: 100,
    floor: 50,
    note: 'Community service outside a clinical setting; 50-100h is the widely-cited range for demonstrating sustained non-clinical commitment.',
  },

  // Source: Leland / Med School Insiders (2026) — "For most applicants
  // targeting traditional MD programs, 400 to 800 total research hours is a
  // competitive range." AAMC's own 2024 AMCAS Cycle Infographic reports a
  // much higher matriculant *average* (~1,505h), but that average is pulled
  // up by MD-PhD applicants, research-heavy-institution students, and
  // gap-year full-time research roles — not representative of a realistic
  // floor for a typical applicant, so it is not used directly here.
  // https://www.joinleland.com/library/a/how-many-hours-of-research-for-medical-school-a-comprehensive-guide
  research: {
    competitive: 400,
    floor: 150,
    note: '400-800h is the widely-cited competitive range for traditional MD applicants (AAMC’s own matriculant average is far higher but skewed by MD-PhD/research-heavy-institution/gap-year applicants).',
  },

  // Source: MedEdits "75-1-3 rule" + joinatlantis.com (2026) — 75 total hours
  // across >=1 primary care physician and 3 specialists; "50+ hours generally
  // recommended," "<20 hours is risky," diminishing returns past ~100h.
  // https://mededits.com/mededits-blog/medical-school-admissions/how-much-shadowing-do-you-need-for-medical-school
  shadowing: {
    competitive: 75,
    floor: 40,
    note: 'MedEdits "75-1-3 rule" (75h across a primary care physician + 3 specialists) is the most commonly cited target; under 20h is considered risky.',
  },

  // Source: Inspira Advantage / Shemmassian Consulting (2026) — "100+
  // extracurricular leadership hours... 20-50 hours per year" across all four
  // undergraduate years. Advising sources are explicit that leadership is
  // judged more by sustained responsibility than raw hours.
  // https://www.inspiraadvantage.com/blog/pre-med-extracurricular-hours
  leadership: {
    competitive: 100,
    floor: 40,
    note: '100h+ (roughly 20-50h/year sustained across undergrad) is the widely-cited leadership benchmark; judged more on responsibility/duration than hours.',
  },

  // No widely-cited hour figure exists for premed teaching/tutoring — sources
  // consulted explicitly note the emphasis is on quality/consistency, not a
  // specific hour target (one forum anecdote cited "2-4h/week" informally,
  // not an advising consensus number, so it is not used).
  // https://www.acceptmed.com/blog/translating-ta-and-tutoring-experience-into-teaching-mentorship-strengths-for-medical-school
  teaching: {
    competitive: null,
    floor: null,
    note: 'No widely-cited hour benchmark exists for teaching/tutoring; admissions guidance emphasizes communication skill demonstrated, not hours logged.',
  },

  // A publication is a discrete achievement (accepted/published or not), not
  // an hours-tracked activity — no hour baseline is meaningful here.
  publication: {
    competitive: null,
    floor: null,
    note: 'Publications are a discrete achievement (count), not an hours metric — no hour baseline applies.',
  },

  // Confirmed via search: advising sources are explicit that there is "no
  // required number... no set number of hours" for general extracurriculars
  // — too heterogeneous a catch-all (clubs, sports, hobbies) for any
  // committee-cited norm to exist.
  extracurricular: {
    competitive: null,
    floor: null,
    note: 'Too heterogeneous a catch-all (clubs, sports, hobbies, etc.) for any widely-cited hour norm to exist.',
  },

  // Undefined catch-all by definition — no norm can apply.
  other: {
    competitive: null,
    floor: null,
    note: 'Undefined catch-all category — no hour norm applies by definition.',
  },
}

export async function getBaseline(category: ActivityCategory): Promise<CategoryBaseline> {
  return ACTIVITY_BASELINES[category]
}

export async function getAllBaselines(): Promise<Record<ActivityCategory, CategoryBaseline>> {
  return ACTIVITY_BASELINES
}
