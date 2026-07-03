# StudyOS Session Handoff — 2026-07-03 (premed session 6)

## Project
**Workspace:** `c:\Users\crm22\StudyOS`
**Subsystem:** `premed/` — this session pivoted away from the scoped "outcomes corpus scraper" to two zero-external-source features: national applicant-pool percentile positioning, and first-party self-reported cycle outcomes.
**Stack:** TypeScript, Zod, `@supabase/supabase-js`, vitest. No new dependencies. No Anthropic API calls this session — zero cost.
**Shell:** PowerShell on Windows 11.

Read `docs/handoffs/2026-07-03-premed-session-5.md` first (class-profile scraper, live/static baseline swap).

## Step 0 — why the session pivoted away from scraping entirely
The task's step 0 required checking Reddit's and SDN's terms for programmatic collection of public posts before fetching anything, and stopping for a decision. Findings, reported and not acted on further:

- Every direct fetch to `reddit.com`, `redditinc.com`, `reddithelp.com`, and `studentdoctor.net`'s own agreement page returned HTTP 403 — could not verify either platform's actual current terms from primary sources, only third-party summaries.
- Third-party sources describe a still-live Reddit free API tier for personal/non-commercial use (self-serve OAuth, ~100 req/min), but **Reddit is actively suing Anthropic** (filed 2025-06-04, sent back to CA state court March 2026) alleging unauthorized bulk scraping of Reddit content later used to train Claude. That's a different fact pattern from "use the sanctioned OAuth API within rate limits," but it's an active, ongoing conflict between Reddit and Anthropic specifically over "collect Reddit data, process it with Claude" — directly relevant to what this task asked me to build.
- SDN's scraping-specific terms were never located (found their community-conduct policy, not an automated-access clause either way).

Reported this plainly and asked the user to decide rather than certifying either source "compliant" myself. **Decision: skip both sources entirely.** The session was rescoped:
1. `corpus-stats.ts` — percentile position over **`pm_facts_grid`** (already-ingested real AAMC data, not `pm_outcomes_corpus`) instead of the scraped-corpus percentile feature originally scoped.
2. `report-outcome` CLI — first-party, user-entered cycle results with explicit consent, RLS-locked to the reporting user. Zero scraping, zero API cost.

Everything below is what was actually built under that pivot.

## A schema gap the pivot required fixing (migration written and applied)
`pm_outcomes_corpus` (session 1) had **no owner column at all** — it was designed for an anonymous third-party corpus, RLS-enabled with zero policies pending a confirmed data source. The pivoted "record your own outcome, visible only to you" feature needs an owner, so this session wrote and the user applied `supabase/migrations/20260703010000_premed_outcomes_ownership.sql`:
- `ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `ADD COLUMN consent_to_store boolean NOT NULL DEFAULT false`
- `UNIQUE (user_id, cycle_year)` — one outcome report per user per cycle, re-reporting updates in place (this lets `reportOutcome` be a clean DB-level upsert, unlike the application-level workarounds sessions 3/5 needed for tables that lacked a matching constraint)
- Reclassified from "pending-source, zero policies" to the same 4-policy **user-owned** tier as `pm_profiles` (`auth.uid() = user_id` on all of select/insert/update/delete)

Table was empty (never populated in sessions 1–5), so both columns were added directly with no backfill step. Verified applied via a live `select` for the new columns before running anything against it.

## What was built this session

### 1. `premed/src/lib/corpus-stats.ts` — Applicant Pool Position
`computeApplicantPoolPosition(supabase, {gpa, mcat}, cycleYear)` reuses `gap-analyzer.ts`'s existing band-mapping (`buildBandOrder`/`mapToBand`) so this feature and the Gap Analyzer always agree on which cell a profile falls into. Computes 4 independent percentiles: GPA-among-applicants, GPA-among-acceptees, MCAT-among-applicants, MCAT-among-acceptees — each as (count in bands at-or-below yours) / (total with non-null data) × 100, summing across the *other* dimension. Suppressed cells (`n<10`, `null` count) are excluded from both numerator and denominator and reported in a `note`, never treated as zero.

### 2. `premed/src/lib/outcomes.ts` — first-party outcome reporting
`reportOutcome(supabase, input)` — Zod-validates (`consent_to_store: z.literal(true)`, so consent can never be defaulted or inferred, only explicitly given), loads the user's current profile + activities, and **snapshots** them into the outcome row rather than requiring re-entry: `clinical_hours` = sum of `clinical_volunteer` + `clinical_paid`, `research_hours` = `research`, `volunteer_hours` = `nonclinical_volunteer`, `has_publication` = any `publication`-category activity present. Upserts on `(user_id, cycle_year)`.

### 3. `premed/pipeline/report-outcome.ts` + `npm run report-outcome`
`--user <id> --cycle-year 2026 --schools-applied 15 --interviews 4 --acceptances 2 [--matriculated-school <id>] --consent`. Hard-fails with an explanatory message (not a silent default) if `--consent` is omitted.

**Found and fixed a real bug in shared CLI infra while building this**: `cli-args.ts`'s `parseFlags` had no concept of a boolean flag — `--consent` with no trailing value would have swallowed the *next* flag as its value (e.g. `--consent --user abc` would have set `consent = "--user"` and lost `abc` entirely). Fixed `parseFlags` so a flag followed by end-of-args or another `--flag` is treated as boolean `true`; added `flagPresent()`. Verified this didn't change any existing CLI's behavior (all pre-existing tests still pass unmodified) and added direct tests for the fix (`cli-args.test.ts`, new this session — no such file existed before).

### 4. `profile-cli.ts show` — new "Applicant Pool Position" section
Inserted between the Activity Gap Read-out and the Gap Analyzer sections (both are GPA/MCAT-standing metrics, grouped together). Reads `cycle_year=2025` (the latest ingested year) by default. Skipped along with the Gap Analyzer when the profile is missing `gpa_cum`/`mcat_total`.

### 5. Tests
- `corpus-stats.test.ts` (6) — hand-verified percentile math against a constructed grid (independent GPA/MCAT, applicants/acceptees percentiles), top/bottom-band edge cases, suppressed-cell exclusion + note, no-data error.
- `outcomes.test.ts` (6) — profile/activity snapshot correctness, upsert idempotency on `(user_id, cycle_year)`, a different cycle year creates a second row not a conflict, consent rejection, missing-profile error.
- `cli-args.test.ts` (9, new file) — the boolean-flag fix directly, plus regression coverage for the existing space/`=` forms.
- `report-outcome.test.ts` (5) — CLI arg parsing including `--consent` in the middle of the argument list (the exact case that would have broken under the old `parseFlags`).
- All existing tests (sessions 1–5, 190 tests) still pass unmodified.
- **215/215 full-repo tests pass** (25 new this session). Typecheck clean.

### 6. Live verification — all 4 archetypes, both features
**Applicant Pool Position** (no migration needed, reads only `pm_facts_grid`) — ran before the migration was applied:

| archetype | GPA band | GPA %ile (applicants / acceptees) | MCAT band | MCAT %ile (applicants / acceptees) |
|---|---|---|---|---|
| grinder | Greater than 3.79 | 100.0 / 100.0 | 502-505 | 41.9 / 17.8 |
| flipped | 3.40-3.59 | 32.6 / 16.0 | 514-517 | 88.4 / 79.4 |
| balanced | 3.60-3.79 | 56.5 / 38.5 | 506-509 | 57.9 / 34.6 |
| climber | 3.20-3.39 | 18.2 / 6.6 | 510-513 | 74.8 / 57.9 |

Every row is internally consistent in the expected direction: acceptee percentile is always ≤ applicant percentile at the same raw score, because the accepted pool skews toward higher scores than the applicant pool — confirms the math is doing something real, not just returning plausible-looking noise. flipped's high-MCAT/low-GPA and climber's low-GPA/decent-MCAT shapes match their intended personas.

**`report-outcome`** (after the user confirmed the migration applied) — ran for all 4 archetypes, each correctly snapshotting its known profile/activity data (e.g. climber: `clinical_hours=2000` matching its seeded `clinical_paid`, `research_hours=0` since it has none). Verified idempotency live: re-ran grinder's report with different numbers, DB row count stayed at 4 (not 5), the existing row's values updated in place. Verified the consent gate live: omitting `--consent` hard-failed with the explanatory message, no row written.

## Current git state
Not yet committed. New: `premed/src/lib/corpus-stats.ts`, `premed/src/lib/outcomes.ts`, `premed/pipeline/report-outcome.ts`, 4 new test files, `supabase/migrations/20260703010000_premed_outcomes_ownership.sql` (written by this session, **applied by the user** in the Supabase SQL editor — confirmed live). Modified: `premed/pipeline/cli-args.ts` (boolean-flag fix), `premed/pipeline/profile-cli.ts` (new section wired into `show`), `premed/pipeline/report.ts` (`printApplicantPoolPosition`), `premed/src/lib/schemas.ts` (`PmOutcomesCorpusSchema` gets `user_id`/`consent_to_store`), `package.json` (`report-outcome` script). No file under `ochem2/` or existing `src/` touched. No UI. Run `git status` to confirm before committing.

## Open items / not started
- No `pm_outcomes_corpus` national/aggregate data — the pivot means this table now only ever holds first-party, per-user rows, never a scraped corpus. If a future session wants aggregate cycle-outcome statistics (not just per-user), it needs either a properly-licensed data source or an explicit opt-in "share anonymized" feature on top of what exists now — neither built this session.
- `LATEST_FACTS_CYCLE_YEAR = 2025` is hardcoded in `profile-cli.ts` rather than derived from the DB's actual max `cycle_year` — fine while only 2023/2025 exist, but worth deriving dynamically once a third cycle year is ever ingested.
- No UI — still CLI-only across the whole `premed/` subsystem.

## Env / secrets
`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` unchanged. No `ANTHROPIC_API_KEY` usage this session (zero-cost session — no scraping, no LLM extraction).

## Key files
| Path | Purpose |
|------|---------|
| `premed/src/lib/corpus-stats.ts` | `computeApplicantPoolPosition` — percentile math over `pm_facts_grid` |
| `premed/src/lib/outcomes.ts` | `reportOutcome` — consent-gated, profile/activity-snapshotting upsert |
| `premed/pipeline/report-outcome.ts` | CLI: `npm run report-outcome -- --user <id> ... --consent` |
| `premed/pipeline/cli-args.ts` | `parseFlags` boolean-flag fix + new `flagPresent` |
| `supabase/migrations/20260703010000_premed_outcomes_ownership.sql` | `pm_outcomes_corpus` ownership pivot (applied) |

## Suggested skills for the next session
- **`review`** — the `cli-args.ts` boolean-flag fix touches shared infra used by every premed CLI; worth a second look given how easily a silent flag-value-swallowing bug like that could have gone unnoticed (it did, until this session needed a boolean flag for the first time).
- **`superpowers:verification-before-completion`** — same pattern as sessions 1–5.
- If a future session revisits the outcomes-corpus scraping idea: don't re-attempt Reddit/SDN without first getting primary-source ToS text confirmed (by the user, or via an authenticated/approved method) — the blocker this session hit was inability to verify, not a confirmed prohibition, so it's not necessarily closed forever, just unresolved.
