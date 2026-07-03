import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import { analyzeProfile } from '../src/lib/gap-analyzer.js'
import { addActivity, createProfile, getProfile, listActivities, profileToSlice, updateActivity } from '../src/lib/profiles.js'
import type { ActivityCategory } from '../src/lib/schemas.js'
import { printActivities, printGapAnalysis, printProfile } from './report.js'

// pm_profiles.user_id is a NOT NULL FK to auth.users(id) — there is no way to
// force a specific literal UUID when creating a Supabase auth user (ids are
// server-generated). So each archetype is keyed by a fixed, documented test
// email instead: this script looks the auth user up by email each run and
// creates it only if missing, which is what makes re-running idempotent even
// though the underlying UUID isn't chosen by us.
//
// Emails use the .test TLD (RFC 2606, reserved for testing) so nothing here
// can ever resolve to a real inbox.

type Archetype = {
  key: string
  email: string
  gpa: number
  mcat: number
  gapYears?: number
  activities: { category: ActivityCategory; hoursCompleted: number }[]
}

const ARCHETYPES: Archetype[] = [
  {
    key: 'grinder',
    email: 'archetype-grinder@premed.test',
    gpa: 3.9,
    mcat: 505,
    activities: [
      { category: 'clinical_volunteer', hoursCompleted: 150 },
      { category: 'research', hoursCompleted: 400 },
    ],
  },
  {
    key: 'flipped',
    email: 'archetype-flipped@premed.test',
    gpa: 3.4,
    mcat: 517,
    activities: [
      { category: 'clinical_paid', hoursCompleted: 800 },
      { category: 'research', hoursCompleted: 50 },
    ],
  },
  {
    key: 'balanced',
    email: 'archetype-balanced@premed.test',
    gpa: 3.6,
    mcat: 508,
    activities: [
      { category: 'clinical_volunteer', hoursCompleted: 200 },
      { category: 'research', hoursCompleted: 200 },
      { category: 'nonclinical_volunteer', hoursCompleted: 100 },
    ],
  },
  {
    key: 'climber',
    email: 'archetype-climber@premed.test',
    gpa: 3.2,
    mcat: 512,
    gapYears: 2,
    activities: [
      { category: 'clinical_paid', hoursCompleted: 2000 },
      { category: 'leadership', hoursCompleted: 300 },
    ],
  },
]

/** Finds the auth user by email, creating one (email-confirmed, unused password) if it doesn't exist yet. */
async function ensureAuthUser(supabase: SupabaseClient, email: string): Promise<string> {
  const { data: existing, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listErr) throw new Error(`Failed to list auth users: ${listErr.message}`)
  const found = existing.users.find(u => u.email === email)
  if (found) return found.id

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password: randomUUID(),
  })
  if (createErr || !created.user) {
    throw new Error(`Failed to create auth user ${email}: ${createErr?.message ?? 'no user returned'}`)
  }
  return created.user.id
}

/** Upserts one activity per category for a profile — inserts if missing, updates hours in place if present. */
async function ensureActivity(
  supabase: SupabaseClient,
  profileId: string,
  category: ActivityCategory,
  hoursCompleted: number
): Promise<void> {
  const activities = await listActivities(supabase, profileId)
  const existing = activities.find(a => a.category === category)
  if (existing) {
    await updateActivity(supabase, existing.id, { hours_completed: hoursCompleted })
  } else {
    await addActivity(supabase, { profile_id: profileId, category, hours_completed: hoursCompleted })
  }
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const seeded: { key: string; userId: string; profileId: string }[] = []

  for (const archetype of ARCHETYPES) {
    console.log(`Seeding archetype "${archetype.key}" (${archetype.email})...`)
    const userId = await ensureAuthUser(supabase, archetype.email)
    const profile = await createProfile(supabase, {
      user_id: userId,
      gpa_cum: archetype.gpa,
      mcat_total: archetype.mcat,
      gap_years: archetype.gapYears ?? 0,
    })
    for (const activity of archetype.activities) {
      await ensureActivity(supabase, profile.id, activity.category, activity.hoursCompleted)
    }
    seeded.push({ key: archetype.key, userId, profileId: profile.id })
    console.log(`  -> user_id=${userId} profile_id=${profile.id}`)
  }

  console.log('\n=== Seed complete — profile-show for each archetype ===')
  for (const { key, userId } of seeded) {
    console.log(`\n----- ${key} -----`)
    const profile = await getProfile(supabase, userId)
    if (!profile) throw new Error(`Archetype "${key}" profile disappeared between seed and report — this is a bug.`)
    const activities = await listActivities(supabase, profile.id)

    printProfile(profile)
    console.log('')
    printActivities(activities)
    console.log('')

    const result = await analyzeProfile(supabase, profileToSlice(profile))
    printGapAnalysis(result)
  }
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  main().catch(err => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
