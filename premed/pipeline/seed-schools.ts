import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { PmSchoolSchema, type PmSchool } from '../src/lib/schemas.js'

// pm_schools has NO UNIQUE constraint on `name` (schema changes are out of
// scope this session — see PLAN.md), so idempotency can't be a DB-level
// upsert. Implemented in application code instead: find-by-name, then
// update-or-insert — the same pattern seed-archetypes.ts already established
// for pm_activities, which has the same lack-of-unique-constraint situation.

export type SchoolSeed = {
  name: string
  state: string
  public_private: 'public' | 'private'
  mission_keywords: string[]
  /** null when no single reliable figure was confirmed during research — never a guess. */
  class_size: number | null
  /**
   * Not a pm_schools column — the school's official "entering class profile" /
   * "admissions statistics" page, researched live for this session. null when
   * no such page could be confidently located (scrape-class-profiles.ts skips
   * these schools rather than guessing a URL). Exported here so both this
   * script and scrape-class-profiles.ts share one source of truth per school.
   */
  class_profile_url: string | null
}

// Researched live 2026-07-03 via web search + fetch against each school's own
// site. class_size is null wherever sources conflicted or the figure wasn't
// confirmed directly on an official page — see docs/handoffs/2026-07-03-premed-session-5.md
// for the full per-school confidence notes.
export const SCHOOL_SEEDS: SchoolSeed[] = [
  // ── Top-tier research (10) ──────────────────────────────────────────────
  {
    name: 'Harvard Medical School',
    state: 'MA',
    public_private: 'private',
    mission_keywords: ['research', 'teaching', 'service_care', 'leadership'],
    class_size: 165,
    class_profile_url: 'https://hms.harvard.edu/education-admissions/md-program/admissions/admissions-glance',
  },
  {
    name: 'Johns Hopkins University School of Medicine',
    state: 'MD',
    public_private: 'private',
    mission_keywords: ['research', 'patient_centered_care', 'education'],
    class_size: 118,
    class_profile_url: 'https://www.hopkinsmedicine.org/som/education-programs/md-program/class-statistics',
  },
  {
    name: 'Perelman School of Medicine at the University of Pennsylvania',
    state: 'PA',
    public_private: 'private',
    mission_keywords: ['research', 'patient_care', 'education', 'innovation'],
    class_size: 153,
    class_profile_url: 'https://www.med.upenn.edu/admissions/entering-class-profile',
  },
  {
    name: 'Stanford University School of Medicine',
    state: 'CA',
    public_private: 'private',
    mission_keywords: ['research', 'innovation', 'physician_scientist'],
    class_size: null, // sources cluster around 89-90 but not confirmed on an official page
    class_profile_url: 'https://med.stanford.edu/md-admissions/facts-and-figures.html',
  },
  {
    name: 'Washington University School of Medicine in St. Louis',
    state: 'MO',
    public_private: 'private',
    mission_keywords: ['research', 'education', 'diversity_inclusion', 'patient_care'],
    class_size: 123,
    class_profile_url: 'https://mdadmissions.wustl.edu/how-to-apply/who-chooses-wu/',
  },
  {
    name: 'Duke University School of Medicine',
    state: 'NC',
    public_private: 'private',
    mission_keywords: ['research', 'leadership', 'community_partnership', 'global_health'],
    class_size: null, // 118 cited by a third-party summary of the official page, not confirmed directly
    class_profile_url: 'https://medschool.duke.edu/education/health-professions-education-programs/doctor-medicine-md-program/admissions/admissions-5',
  },
  {
    name: 'University of Michigan Medical School',
    state: 'MI',
    public_private: 'public',
    mission_keywords: ['research', 'education', 'service', 'innovation'],
    class_size: null, // 168 cited by a third-party summary; official pages 403'd on fetch
    class_profile_url: 'https://medschool.umich.edu/programs-admissions/md-program/md-program-our-community/u-m-medical-school-profiles-demographics',
  },
  {
    name: 'UCSF School of Medicine',
    state: 'CA',
    public_private: 'public',
    mission_keywords: ['research', 'education', 'patient_care', 'public_service'],
    class_size: 161,
    class_profile_url: 'https://meded.ucsf.edu/about-us/program-statistics/admissions-data',
  },
  {
    name: 'Vagelos College of Physicians and Surgeons (Columbia University)',
    state: 'NY',
    public_private: 'private',
    mission_keywords: ['research', 'patient_care', 'education', 'service'],
    class_size: 140,
    class_profile_url: 'https://www.vagelos.columbia.edu/about-us/facts-and-statistics',
  },
  {
    name: 'Vanderbilt University School of Medicine',
    state: 'TN',
    public_private: 'private',
    mission_keywords: ['research', 'servant_leadership', 'lifelong_learning', 'service'],
    class_size: null, // conflicting figures (96 offered vs. 95 matriculated), not confirmed
    class_profile_url: 'https://medschool.vanderbilt.edu/md/admissions/process/',
  },

  // ── Regional / state schools across the US (10) ─────────────────────────
  {
    name: 'LSU Health New Orleans School of Medicine',
    state: 'LA',
    public_private: 'public',
    mission_keywords: ['underserved', 'primary_care', 'rural', 'in_state'],
    class_size: null, // sources give 195 or 196, not a single consistent figure
    class_profile_url: 'https://www.medschool.lsuhsc.edu/admissions/statistics.aspx',
  },
  {
    name: 'LSU Health Shreveport School of Medicine',
    state: 'LA',
    public_private: 'public',
    mission_keywords: ['service', 'research', 'regional', 'state'],
    class_size: null, // 325 figure from an aggregator conflicts sharply with peer-school scale — not trustworthy
    class_profile_url: 'https://schoolofmedicine.lsuhs.edu/prospective-students/admissions/at-a-glance',
  },
  {
    name: 'Tulane University School of Medicine',
    state: 'LA',
    public_private: 'private',
    mission_keywords: ['research_intensive', 'patient_care', 'community_health', 'leadership'],
    class_size: 190,
    class_profile_url:
      'https://medicine.tulane.edu/education/undergraduate-medical-education-md-program/admissions/class-profile',
  },
  {
    name: 'UT Southwestern Medical School',
    state: 'TX',
    public_private: 'public',
    mission_keywords: ['research', 'clinical_excellence', 'education', 'leadership'],
    class_size: 227,
    class_profile_url: 'https://medschool.utsouthwestern.edu/admissions/class-profile.html',
  },
  {
    name: 'University of Florida College of Medicine',
    state: 'FL',
    public_private: 'public',
    mission_keywords: ['research', 'leadership', 'clinical_care', 'education'],
    class_size: null, // 136 from secondary sources only
    class_profile_url: null, // no dedicated class-profile page located
  },
  {
    name: 'The Ohio State University College of Medicine',
    state: 'OH',
    public_private: 'public',
    mission_keywords: ['research', 'innovation', 'education', 'community_health'],
    class_size: 211,
    class_profile_url: 'https://medicine.osu.edu/education/md/admissions/before-you-apply/entering-class-profile',
  },
  {
    name: 'University of Washington School of Medicine',
    state: 'WA',
    public_private: 'public',
    mission_keywords: ['rural', 'underserved', 'primary_care', 'regional_wwami'],
    class_size: 280, // WWAMI 5-state program total, not Seattle campus alone
    class_profile_url: 'https://www.uwmedicine.org/school-of-medicine/md-program/admissions/acceptance-statistics',
  },
  {
    name: 'UNC School of Medicine',
    state: 'NC',
    public_private: 'public',
    mission_keywords: ['primary_care', 'research', 'health_equity', 'in_state'],
    class_size: null, // ~230 from secondary sources, not one official figure
    class_profile_url: 'https://www.med.unc.edu/admit/about-our-students/profiles-and-infographics/',
  },
  {
    name: 'University of Colorado School of Medicine',
    state: 'CO',
    public_private: 'public',
    mission_keywords: ['education', 'research', 'physician_leadership', 'diverse_communities'],
    class_size: null, // 181 from secondary sources only
    class_profile_url: null, // no dedicated class-profile page located
  },
  {
    name: 'University of Wisconsin School of Medicine and Public Health',
    state: 'WI',
    public_private: 'public',
    mission_keywords: ['rural', 'health_equity', 'public_health', 'underserved'],
    class_size: 171,
    class_profile_url: 'https://www.med.wisc.edu/education/md-program/admissions/entering-class-profile/',
  },

  // ── Mid-tier private / mission-driven (10) ──────────────────────────────
  {
    name: 'Tufts University School of Medicine',
    state: 'MA',
    public_private: 'private',
    mission_keywords: ['diversity', 'public_health', 'community_impact', 'compassionate_care'],
    class_size: 204,
    class_profile_url: 'https://medicine.tufts.edu/academics/medicine/class-profile',
  },
  {
    name: 'Drexel University College of Medicine',
    state: 'PA',
    public_private: 'private',
    mission_keywords: ['diversity', 'belonging', 'compassionate_care', 'patient_centered'],
    class_size: null, // ~303 from third-party aggregators, not officially verified
    class_profile_url: 'https://drexel.edu/medicine/academics/md-program/md-program-admissions/medical-student-demographics/',
  },
  {
    name: 'The George Washington University School of Medicine and Health Sciences',
    state: 'DC',
    public_private: 'private',
    mission_keywords: ['health_equity', 'community_engagement', 'research', 'education'],
    class_size: null, // 130 from a third-party aggregator only
    class_profile_url: 'https://smhs.gwu.edu/academics/md-program/admissions/student-profile',
  },
  {
    name: 'Loyola University Chicago Stritch School of Medicine',
    state: 'IL',
    public_private: 'private',
    mission_keywords: ['jesuit', 'whole_person_care', 'diversity', 'service'],
    class_size: null, // 175 from a third-party aggregator only
    class_profile_url: 'https://www.luc.edu/stritch/admissions/classprofile/',
  },
  {
    name: 'Chicago Medical School at Rosalind Franklin University',
    state: 'IL',
    public_private: 'private',
    mission_keywords: ['community_engaged', 'diversity', 'interprofessional', 'service'],
    class_size: null, // 203 from a third-party aggregator only
    class_profile_url: 'https://www.rosalindfranklin.edu/academics/chicago-medical-school/degree-programs/allopathic-medicine-md/class-profile/',
  },
  {
    name: 'Wake Forest University School of Medicine',
    state: 'NC',
    public_private: 'private',
    mission_keywords: ['research', 'community_health', 'leadership', 'patient_care'],
    class_size: 194,
    class_profile_url: 'https://school.wakehealth.edu/education-and-training/md-program/class-profile',
  },
  {
    name: 'Meharry Medical College',
    state: 'TN',
    public_private: 'private',
    mission_keywords: ['health_equity', 'underserved', 'historically_black', 'service'],
    class_size: null, // ~115 from a third-party aggregator only
    class_profile_url: null, // no dedicated class-profile page located
  },
  {
    name: 'Morehouse School of Medicine',
    state: 'GA',
    public_private: 'private',
    mission_keywords: ['underserved', 'diversity', 'primary_care', 'health_equity'],
    class_size: 110,
    class_profile_url: 'https://www.msm.edu/Admissions/doctor-of-medicine/fact-sheet.php',
  },
  {
    name: 'Creighton University School of Medicine',
    state: 'NE',
    public_private: 'private',
    mission_keywords: ['jesuit', 'cura_personalis', 'diversity', 'whole_person_care'],
    class_size: 250,
    class_profile_url: 'https://www.creighton.edu/medicine/programs/medicine-md/class-profile',
  },
  {
    name: 'New York Medical College',
    state: 'NY',
    public_private: 'private',
    mission_keywords: ['public_health', 'research', 'diversity', 'human_dignity'],
    class_size: null, // 233 from a third-party aggregator only
    class_profile_url: null, // no dedicated class-profile page located
  },
]

export async function ensureSchool(supabase: SupabaseClient, seed: SchoolSeed): Promise<PmSchool> {
  const { data: existing, error: findErr } = await supabase
    .from('pm_schools')
    .select('*')
    .eq('name', seed.name)
    .maybeSingle()
  if (findErr) throw new Error(`Failed to look up school "${seed.name}": ${findErr.message}`)

  const row = {
    name: seed.name,
    state: seed.state,
    public_private: seed.public_private,
    mission_keywords: seed.mission_keywords,
    class_size: seed.class_size,
  }

  if (existing) {
    const { data, error } = await supabase.from('pm_schools').update(row).eq('id', existing.id).select().single()
    if (error) throw new Error(`Failed to update school "${seed.name}": ${error.message}`)
    return PmSchoolSchema.parse(data)
  }

  const { data, error } = await supabase.from('pm_schools').insert(row).select().single()
  if (error) throw new Error(`Failed to insert school "${seed.name}": ${error.message}`)
  return PmSchoolSchema.parse(data)
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  console.log(`Seeding ${SCHOOL_SEEDS.length} schools...`)
  let withUrl = 0
  for (const seed of SCHOOL_SEEDS) {
    const school = await ensureSchool(supabase, seed)
    if (seed.class_profile_url) withUrl++
    console.log(`  -> ${school.name} (id=${school.id})${seed.class_profile_url ? '' : ' [no class-profile URL]'}`)
  }
  console.log(`\nDone. ${SCHOOL_SEEDS.length} schools seeded, ${withUrl} have a class-profile URL for scraping.`)
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  main().catch(err => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
