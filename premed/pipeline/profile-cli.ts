import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { computeActivityGaps } from '../src/lib/activity-gap.js'
import { createLiveBaselineProvider } from '../src/lib/baselines-live.js'
import { staticBaselineProvider } from '../src/lib/baselines.js'
import { computeApplicantPoolPosition } from '../src/lib/corpus-stats.js'
import { analyzeProfile } from '../src/lib/gap-analyzer.js'
import { addActivity, createProfile, getProfile, listActivities, profileToSlice } from '../src/lib/profiles.js'
import { optionalNumber, optionalString, parseFlags, printCliError, requireNumber, requireString } from './cli-args.js'
import { printActivities, printActivityGaps, printApplicantPoolPosition, printGapAnalysis, printProfile } from './report.js'

// Most recent cycle year ingested into pm_facts_grid (session 1/bridge) — the
// Applicant Pool Position section reads this one year, same as gap-analyzer.ts
// defaults to comparing 2023 vs 2025.
const LATEST_FACTS_CYCLE_YEAR = 2025

// One CLI, four subcommands (each backed by its own npm script):
//   npm run profile-create -- --user <id> --gpa 3.6 --mcat 508 [--state LA --grad-year 2027 --gap-years 0]
//   npm run profile-analyze -- --user <id>
//   npm run activity-add -- --user <id> --category clinical_volunteer --hours 120 [--planned 200 --description "..."]
//   npm run profile-show -- --user <id>

// ── Arg parsing per subcommand ───────────────────────────────────────────────

export function parseCreateArgs(argv: string[]) {
  const flags = parseFlags(argv)
  return {
    user: requireString(flags, 'user'),
    gpa: requireNumber(flags, 'gpa'),
    mcat: requireNumber(flags, 'mcat'),
    state: optionalString(flags, 'state'),
    gradYear: optionalNumber(flags, 'grad-year'),
    gapYears: optionalNumber(flags, 'gap-years'),
  }
}

export function parseAnalyzeArgs(argv: string[]) {
  const flags = parseFlags(argv)
  return { user: requireString(flags, 'user') }
}

export function parseActivityAddArgs(argv: string[]) {
  const flags = parseFlags(argv)
  return {
    user: requireString(flags, 'user'),
    category: requireString(flags, 'category'),
    hours: requireNumber(flags, 'hours'),
    planned: optionalNumber(flags, 'planned'),
    description: optionalString(flags, 'description'),
  }
}

export function parseShowArgs(argv: string[]) {
  const flags = parseFlags(argv)
  const baselinesRaw = optionalString(flags, 'baselines') ?? 'static'
  if (baselinesRaw !== 'live' && baselinesRaw !== 'static') {
    throw new Error(`--baselines must be "live" or "static", got "${baselinesRaw}".`)
  }
  return { user: requireString(flags, 'user'), baselines: baselinesRaw }
}

// ── Subcommand handlers ──────────────────────────────────────────────────────

export async function cmdCreate(supabase: SupabaseClient, argv: string[]): Promise<void> {
  const args = parseCreateArgs(argv)
  const profile = await createProfile(supabase, {
    user_id: args.user,
    gpa_cum: args.gpa,
    mcat_total: args.mcat,
    state_residence: args.state ?? null,
    grad_year: args.gradYear ?? null,
    gap_years: args.gapYears ?? 0,
  })
  console.log(`Profile saved for user_id=${profile.user_id} (id=${profile.id})`)
  printProfile(profile)
}

export async function cmdAnalyze(supabase: SupabaseClient, argv: string[]): Promise<void> {
  const args = parseAnalyzeArgs(argv)
  const profile = await getProfile(supabase, args.user)
  if (!profile) throw new Error(`No profile found for user_id=${args.user}. Run profile-create first.`)
  const result = await analyzeProfile(supabase, profileToSlice(profile))
  printGapAnalysis(result)
}

export async function cmdActivityAdd(supabase: SupabaseClient, argv: string[]): Promise<void> {
  const args = parseActivityAddArgs(argv)
  const profile = await getProfile(supabase, args.user)
  if (!profile) throw new Error(`No profile found for user_id=${args.user}. Run profile-create first.`)
  const activity = await addActivity(supabase, {
    profile_id: profile.id,
    category: args.category as never, // validated by ActivityCategorySchema inside addActivity
    hours_completed: args.hours,
    hours_planned: args.planned ?? 0,
    description: args.description ?? null,
  })
  console.log(`Activity added: ${activity.category} (${activity.hours_completed}h completed / ${activity.hours_planned}h planned)`)
}

export async function cmdShow(supabase: SupabaseClient, argv: string[]): Promise<void> {
  const args = parseShowArgs(argv)
  const profile = await getProfile(supabase, args.user)
  if (!profile) throw new Error(`No profile found for user_id=${args.user}. Run profile-create first.`)
  const activities = await listActivities(supabase, profile.id)

  printProfile(profile)
  console.log('')
  printActivities(activities)
  console.log('')

  const provider = args.baselines === 'live' ? createLiveBaselineProvider(supabase) : staticBaselineProvider
  console.log(`(baselines: ${args.baselines})`)
  const gaps = await computeActivityGaps(activities, provider)
  printActivityGaps(gaps)
  console.log('')

  if (profile.gpa_cum !== null && profile.mcat_total !== null) {
    const position = await computeApplicantPoolPosition(supabase, profileToSlice(profile), LATEST_FACTS_CYCLE_YEAR)
    printApplicantPoolPosition(position)
    console.log('')

    const result = await analyzeProfile(supabase, profileToSlice(profile))
    printGapAnalysis(result)
  } else {
    console.log('(Applicant pool position and gap analysis skipped — profile is missing gpa_cum or mcat_total.)')
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [subcommand, ...rest] = process.argv.slice(2)

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  switch (subcommand) {
    case 'create':
      return cmdCreate(supabase, rest)
    case 'analyze':
      return cmdAnalyze(supabase, rest)
    case 'activity-add':
      return cmdActivityAdd(supabase, rest)
    case 'show':
      return cmdShow(supabase, rest)
    default:
      throw new Error(`Unknown subcommand "${subcommand}". Expected one of: create, analyze, activity-add, show.`)
  }
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  main().catch(err => {
    printCliError(err)
    process.exit(1)
  })
}
