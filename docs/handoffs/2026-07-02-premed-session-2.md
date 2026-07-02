# StudyOS Session Handoff — 2026-07-02 (premed session 2)

## Project
**Workspace:** `c:\Users\crm22\StudyOS`
**Subsystem:** `premed/` — Gap Analyzer query layer, built on the `pm_facts_grid` foundation from session 1.
**Stack:** TypeScript, Zod, `@supabase/supabase-js`, vitest — no new dependencies.
**Shell:** PowerShell on Windows 11.

Session 1's handoff (`docs/handoffs/2026-07-02-premed-session-1.md`) and `premed/PLAN.md` describe the original schema/pipeline design, but **both are stale on `pm_facts_grid`'s exact shape** — that table was corrected between sessions once real AAMC files were ingested (see "What changed since session 1" below). Read this doc's corrections before trusting those two files' schema details.

## What changed since session 1 (context, not this session's new work)
Before session 2 started, the real 2023/2025 AAMC FACTS Table A-23 workbooks were ingested and turned up two mismatches with the session-1 design, both corrected with the user's sign-off:
- **`matriculants` → `acceptees`.** Table A-23 reports "Applicants" and "Acceptees" (offered admission), not matriculants (enrolled) — AAMC doesn't publish a matriculant-level version of this grid.
- **Suppressed cells are `null` + a `*_suppressed` boolean**, not `0`. AAMC blanks a cell to `"-"` when the true count is 1-9 (privacy rule); that is stored as `applicants: null, applicants_suppressed: true` (same for `acceptees`), never coerced to zero.

Current `pm_facts_grid` columns: `id, cycle_year, gpa_band, mcat_band, applicants, applicants_suppressed, acceptees, acceptees_suppressed, source_file, source_sheet, source_sha256, imported_at`. 220 rows live (110 per cycle year × 2023/2025), 24 total suppressed cells across both years.

## What was built this session

### 1. `premed/src/lib/gap-analyzer.ts`
Pure band-mapping/stats logic plus one async orchestration function, read-only against `pm_facts_grid`:

- **Band parsing** (`parseBandBounds`, `buildBandOrder`, `mapToBand`, `getNeighborLabel`) — parses the three label shapes AAMC actually uses (`"X-Y"` inclusive both ends, `"Less than X"` exclusive-max, `"Greater than X"` exclusive-min) into numeric bounds, and maps a raw GPA/MCAT value to the one band that contains it. Band definitions are **discovered from the table's own stored labels each call**, not hardcoded — `analyzeProfile` queries `DISTINCT gpa_band, mcat_band` from the requested cycle years before mapping.
- **Boundary convention** (verified against real AAMC data and covered by tests): a value exactly on a range edge belongs to the closed range band, not the adjacent open band — e.g. GPA `3.79` → `"3.60-3.79"`, not `"Greater than 3.79"`; MCAT `486` → `"486-489"`, not `"Less than 486"`.
- **`computeCellStats`** — turns a `pm_facts_grid` row into `{ applicants, acceptees, acceptance_rate, note }`. Never computes a rate when either count is suppressed or missing, even if the other count is known — surfaces `note: "Fewer than 10 nationally — AAMC suppresses this cell for privacy."` instead. A `0`-applicant cell gets its own distinct note rather than a fabricated `0%`/`null` conflation.
- **`analyzeProfile(supabase, { gpa, mcat }, cycleYears = [2023, 2025])`** — validates the profile via `ProfileSliceSchema` (same range bounds as the `pm_profiles` CHECK constraints: GPA 0–4.00, MCAT 472–528 int), maps it to a GPA×MCAT cell, finds the one-band neighbor in each of the 4 directions (GPA up/down, MCAT up/down — `null` at a grid edge), fetches all 5 cells per requested cycle year in one query each, and returns a between-cycle delta (`acceptance_rate_delta`, `applicants_delta`, `acceptees_delta`) computed between the earliest and latest requested cycle — `null` with an explanatory note if either cycle's main cell is suppressed/missing.

### 2. `premed/pipeline/analyze-profile.ts` (CLI)
New npm script: `npm run analyze-profile -- --gpa 3.6 --mcat 508` (also accepts `--gpa=3.6` form). Prints:
- matched GPA×MCAT cell
- odds per requested cycle year (rate + raw counts, or the suppression/no-data note)
- a trend line with an arrow (`↑`/`↓`/`→`/`n/a`) and the delta in points
- a "+/-1 band sensitivity" table for the most recent cycle year, showing the 4 neighbor cells' rates so a user can see what moving one band in either dimension does to their odds

Zod validation errors (out-of-range GPA/MCAT) print as a clean `field: message` list and exit 1, rather than a raw error dump.

Smoke-tested against the live DB:
- `--gpa 3.6 --mcat 508` → cell `3.60-3.79 x 506-509`, 2023 40.4% → 2025 45.4% (+5.0 pts ↑), sensible monotonic neighbor rates in all 4 directions.
- `--gpa 2.5 --mcat 520` → cell `2.40-2.59 x Greater than 517`, 2023 has real counts (18 applicants / 5 acceptees, 27.8%), 2025 is a real suppressed cell in the live data — printed the suppression note, **did not fabricate a rate**, delta correctly reported as uncomputable with a note; `MCAT band up` correctly showed `(none — already top band)` since `Greater than 517` is the grid's top MCAT band.
- `--gpa 4.5 --mcat 508` → hard-failed with `gpa: Too big: expected number to be <=4`, exit 1, no DB call made (validation runs before any query).

### 3. Tests
- `premed/src/lib/__tests__/gap-analyzer.test.ts` (34 tests) — `parseBandBounds` for all 3 label shapes; `buildBandOrder` dedup/sort; `mapToBand`/`getNeighborLabel` boundary edge cases (GPA exactly on a range edge in both directions, MCAT exactly on a range edge, legal extremes 0/4.0, top/bottom-band neighbor `null`, out-of-coverage hard-fail); `computeCellStats` (normal rate, rounding, suppressed-acceptees-with-known-applicants never fabricates a rate, suppressed-both, zero-applicants distinct note, missing-row note); `analyzeProfile` end-to-end against a hand-rolled fake Supabase client (no network) verifying cell/neighbor/delta wiring, plus a pre-DB validation-rejection test.
- `premed/pipeline/__tests__/analyze-profile.test.ts` (5 tests) — CLI arg parsing, both flag forms, missing-flag and non-numeric-value errors.
- All existing session-1 tests (`ingest-facts.test.ts`, 13 tests) still pass unmodified.
- **43/43 premed tests pass. 103/103 full-repo tests pass** (no regressions).

### 4. Typecheck
`npm run typecheck-premed` clean, including the two new files and their tests.

## Current git state
Everything from session 1 is still untracked (see that handoff — nothing was committed). This session's new/changed files:
- New: `premed/src/lib/gap-analyzer.ts`, `premed/src/lib/__tests__/gap-analyzer.test.ts`, `premed/pipeline/analyze-profile.ts`, `premed/pipeline/__tests__/analyze-profile.test.ts`
- Modified: `package.json` (one new npm script, `analyze-profile`)

No file under `ochem2/` or existing `src/` touched. No schema change — read-only against `pm_facts_grid`. Run `git status` to confirm before committing.

## Data reality (important context)
- **Table A-23 has no per-school breakdown and no matriculant data** — `gap-analyzer.ts` only ever reports national aggregate odds by GPA×MCAT cell, for exactly the two ingested cycle years (2023, 2025) unless a caller passes different `cycleYears`.
- **Suppressed cells are real and current**: 13 cells suppressed in 2025, 11 in 2023 (out of 110 each). Any UI or downstream consumer built on top of `analyzeProfile`'s result **must** surface `note`/`*_suppressed` rather than showing a blank or zero rate — this was the explicit rule for this session and the tests enforce it.
- **No `pm_school_stats` or `pm_outcomes_corpus` data exists** — Gap Analyzer is national-grid-only, as scoped. A future per-school layer needs a different data source (e.g. MSAR), same as noted in session 1.

## Next steps (not started, explicitly out of scope this session)
1. **UI layer** — nothing renders this data yet; `analyzeProfile` is a pure function ready for a route/component to call.
2. **`pm_school_stats` ingest** — needs a per-school source (MSAR or similar), separate session.
3. **Persisting a user's profile slice** — `analyzeProfile` takes a raw `{ gpa, mcat }` object; wiring it to `pm_profiles.gpa_cum`/`mcat_total` for a logged-in user is future work, not attempted here (would need the profile's `auth.uid()`-scoped RLS read, which this session's service-role CLI doesn't exercise).
4. **Activity/narrative analysis** — explicitly out of scope per this session's instructions, same as session 1.

## Env requirements
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — already in `.env.local`, same as session 1.
- Loaded via `tsx --env-file=.env.local` — no dotenv call in the script.

## Key files
| Path | Purpose |
|------|---------|
| `premed/src/lib/gap-analyzer.ts` | Band mapping, cell stats, delta, `analyzeProfile` orchestration |
| `premed/src/lib/__tests__/gap-analyzer.test.ts` | 34 tests — boundaries, suppression, orchestration |
| `premed/pipeline/analyze-profile.ts` | CLI: `npm run analyze-profile -- --gpa <n> --mcat <n>` |
| `premed/pipeline/__tests__/analyze-profile.test.ts` | 5 tests — CLI arg parsing |
| `premed/src/lib/schemas.ts` | Zod schemas (unchanged this session; `PmFactsGridSchema` already reflects the acceptees/suppressed correction) |
| `supabase/migrations/20260702000000_premed_foundation.sql` | Schema (unchanged this session) |

## Suggested skills
- **`review`** — `analyzeProfile`'s neighbor-cell wiring (`findRow` lookups keyed by `(gpa_band, mcat_band)`) is the highest-risk logic this session; the fake-Supabase-client test covers it but a second pass wouldn't hurt before this gets a UI on top of it.
- **`superpowers:verification-before-completion`** — already run this session (typecheck, full premed suite, full-repo suite, and 3 live CLI smoke tests against real suppressed/normal/invalid inputs).

## Conventions followed
- **No Python** — TypeScript only.
- **Zero paid API calls** — pure SQL/TypeScript, no Anthropic API calls.
- **Read-only against `pm_facts_grid`** — no `INSERT`/`UPDATE`/schema changes this session.
- **PowerShell syntax** — Windows 11, no WSL.
- Build verification: `npm run typecheck-premed && npx vitest run premed/` (43/43 clean) and `npx vitest run` full-repo (103/103 clean), plus live CLI smoke tests against real data.
