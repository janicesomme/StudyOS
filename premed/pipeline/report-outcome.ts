import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { reportOutcome } from '../src/lib/outcomes.js'
import { flagPresent, optionalString, parseFlags, printCliError, requireNumber, requireString } from './cli-args.js'

// npm run report-outcome -- --user <id> --cycle-year 2026 --schools-applied 15
//   --interviews 4 --acceptances 2 [--matriculated-school <uuid>] --consent
//
// Snapshots the user's current profile + activities alongside the reported
// cycle outcome. Requires --consent (a bare boolean flag) — omitting it is a
// hard failure, not a silent default. See premed/src/lib/outcomes.ts.

export function parseReportOutcomeArgs(argv: string[]) {
  const flags = parseFlags(argv)
  return {
    user: requireString(flags, 'user'),
    cycleYear: requireNumber(flags, 'cycle-year'),
    schoolsApplied: requireNumber(flags, 'schools-applied'),
    interviews: requireNumber(flags, 'interviews'),
    acceptances: requireNumber(flags, 'acceptances'),
    matriculatedSchoolId: optionalString(flags, 'matriculated-school') ?? null,
    consent: flagPresent(flags, 'consent'),
  }
}

async function main() {
  const args = parseReportOutcomeArgs(process.argv.slice(2))

  if (!args.consent) {
    throw new Error(
      'Missing --consent. By passing --consent you agree to store your self-reported cycle outcome ' +
        '(GPA, MCAT, activity hours, and application results) in pm_outcomes_corpus, visible only to you via row-level security.'
    )
  }

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const outcome = await reportOutcome(supabase, {
    user_id: args.user,
    cycle_year: args.cycleYear,
    schools_applied: args.schoolsApplied,
    interviews: args.interviews,
    acceptances: args.acceptances,
    matriculated_school_id: args.matriculatedSchoolId,
    consent_to_store: true,
  })

  console.log(`Outcome recorded for user_id=${outcome.user_id}, cycle_year=${outcome.cycle_year}`)
  console.log(
    `  GPA=${outcome.gpa ?? 'n/a'} MCAT=${outcome.mcat ?? 'n/a'} state=${outcome.state ?? 'n/a'} gap_years=${outcome.gap_years ?? 'n/a'}`
  )
  console.log(
    `  clinical_hours=${outcome.clinical_hours ?? 0} research_hours=${outcome.research_hours ?? 0} volunteer_hours=${outcome.volunteer_hours ?? 0} has_publication=${outcome.has_publication}`
  )
  console.log(`  schools_applied=${outcome.schools_applied} interviews=${outcome.interviews} acceptances=${outcome.acceptances}`)
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  main().catch(err => {
    printCliError(err)
    process.exit(1)
  })
}
