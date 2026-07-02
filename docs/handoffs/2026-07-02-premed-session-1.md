# StudyOS Session Handoff — 2026-07-02 (premed session 1)

## Project
**Workspace:** `c:\Users\crm22\StudyOS`
**New subsystem:** `premed/` — foundation of a premed admissions analysis platform, living inside the StudyOS repo as a sibling of `ochem2/`, reusing StudyOS's Supabase project/`.env.local`.
**Stack:** TypeScript, Zod, `xlsx`, `@supabase/supabase-js`, vitest — all already StudyOS dependencies, nothing new installed.
**Shell:** PowerShell on Windows 11.

This session was preceded by a full grill-me-codex cycle: Act 1 locked scope with the user, Act 2 ran 5 rounds of adversarial review against OpenAI Codex. Full argument trail: `premed/PLAN.md` (final plan) and `premed/PLAN-REVIEW-LOG.md` (all 5 rounds, what was accepted/rejected and why).

## What was built this session

### 1. Migration — `supabase/migrations/20260702000000_premed_foundation.sql`
Creates all 7 `pm_`-prefixed tables: the user's original six (`pm_profiles`, `pm_activities`, `pm_schools`, `pm_school_stats`, `pm_outcomes_corpus`, `pm_narratives`) plus a new `pm_facts_grid`. **Not yet applied** — this repo has no automated migration runner; run it by hand in the Supabase SQL editor (see Verification below).

Key design points (all explained in detail in `premed/PLAN.md` Key decisions):
- Domain CHECK constraints added throughout: GPA 0–4.00, MCAT 472–528 (official AAMC scale), percentages 0–100, non-negative hours/counts.
- FKs tightened to `NOT NULL ... ON DELETE CASCADE` where the original schema left them nullable (`pm_activities.profile_id`, `pm_narratives.profile_id`, `pm_school_stats.school_id`).
- `pm_profiles.user_id` is `NOT NULL UNIQUE REFERENCES auth.users(id)` — one profile per user.
- **RLS is three-tiered**, not uniform:
  - User-owned (`pm_profiles`, `pm_activities`, `pm_narratives`): `auth.uid() = user_id`, all four operations, no public-read.
  - Confirmed-public reference (`pm_schools`, `pm_facts_grid`): public-read policy, no write policy.
  - Pending-source reference (`pm_school_stats`, `pm_outcomes_corpus`): RLS enabled, **zero policies** (service-role only) — their real data source's license/re-identifiability status isn't confirmed yet.
- `pm_facts_grid` is a new table, national-only (no `school_id` — AAMC's FACTS Table A-23 has no per-school breakdown), with provenance columns (`source_file`, `source_sheet`, `source_sha256`, `imported_at`) and `UNIQUE (cycle_year, gpa_band, mcat_band)` as the upsert key.

### 2. Zod schemas — `premed/src/lib/schemas.ts`
One schema per table, field-for-field mirror of the migration (same pattern as `ochem2/eas/pipeline/schema.ts`). Exports `Pm*Schema` + inferred `Pm*` types for all 7 tables.

### 3. Ingest pipeline — `premed/pipeline/ingest-facts.ts`
Parses an AAMC FACTS Table A-23-style GPA×MCAT grid and upserts into `pm_facts_grid` only (`pm_school_stats` is explicitly out of scope this session — see Data reality below).

- Requires exactly one `.xlsx` file in `premed/source-data/facts/` (hard-fails if zero or more than one — avoids silently mixing two workbooks under one cycle year).
- Requires `--cycle-year=<YYYY>` CLI flag — no auto-detection.
- Hard-fails on any structural or Zod validation problem (no skip-and-log) — this is deterministic official-data import, not noisy LLM enrichment.
- Computes `source_sha256` via Node's built-in `crypto` module.
- Chunked upserts (100/batch), `--env-file=.env.local`, service-role client — same conventions as `ochem2/eas/pipeline/load-supabase.ts`.
- Prints an import summary: file, sheet, checksum, rows parsed/upserted, resulting DB row count for the cycle year.

New npm script: `npm run ingest-premed-facts -- --cycle-year=2026`

### 4. Tests — `premed/pipeline/__tests__/ingest-facts.test.ts`
9 tests, all passing. Fixtures at `premed/pipeline/__fixtures__/facts-grid-fixtures.ts` — built as 2D arrays (what `XLSX.utils.sheet_to_json(sheet, {header:1})` returns) rather than checked-in binary `.xlsx` files, so they're diffable and don't risk the cp1252/binary-file issues this environment has previously flagged. This is a small implementation-level deviation from the plan's literal "hand-built xlsx fixture(s)" wording — same intent (small hand-built fixtures mimicking the AAMC layout), different storage format.

Covers: happy-path parse (band rows/cols, totals row/column excluded), a blank spacer row inside the grid (skipped, not an error), a missing header block (hard-fails with a clear message), and a malformed data cell (hard-fails with a clear message).

### 5. Typecheck coverage — `premed/tsconfig.json`
New npm script: `npm run typecheck-premed`. Passes clean. This is a new safety net — StudyOS's root `tsconfig.json` doesn't cover `scripts/` or `ochem2/eas/pipeline/` either, so `premed/` now has better coverage than existing pipeline code, not equal coverage.

### 6. `.gitignore`
Added `premed/source-data/facts/*` / `!premed/source-data/facts/.gitkeep` so real AAMC files never get committed.

## Current git state
Everything above is **new, untracked**. Nothing existing was modified except two append-only edits: `package.json` (2 new npm scripts) and `.gitignore` (2 new lines). No file under `ochem2/` or existing `src/` was touched. Run `git status` to confirm before committing.

## Data reality (important context)
- **No real AAMC FACTS file has been used yet.** The user will drop one into `premed/source-data/facts/`. The parser and fixtures are built from the publicly known AAMC FACTS Table A-23 layout (GPA-band rows × MCAT-band columns, cells as `"applicants / matriculants"`, totals row/column, title block above the grid) — **not verified against a real file.** This is the single biggest open risk (see `premed/PLAN.md` Risks section). When the real file lands, expect to adjust: sheet name assumptions, exact header row position, band label format, cell format if it differs from `"N / M"`.
- **`pm_school_stats` has no ingest path.** AAMC's national FACTS grid can't populate per-school stats (wrong data shape — no school breakdown exists in that table). This table is created empty and stays empty until a per-school source (e.g. MSAR) is ingested in a future session.
- **`pm_outcomes_corpus` also has no ingest path this session** — same "created, not populated" status.
- **Migration is not yet applied to the live database.** Nothing in `pm_facts_grid` or any other `pm_` table exists yet.

## Next steps

### 1. Apply the migration
Run `supabase/migrations/20260702000000_premed_foundation.sql` in the Supabase SQL editor.

### 2. Verify the migration (copy-paste into Supabase SQL editor)
```sql
-- Confirm all 7 tables exist with RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'pm_%'
ORDER BY tablename;

-- Confirm RLS policy counts match the three-tier classification:
-- pm_profiles/pm_activities/pm_narratives -> 4 policies each (auth.uid()-scoped)
-- pm_schools/pm_facts_grid -> 1 policy each (public-read)
-- pm_school_stats/pm_outcomes_corpus -> 0 policies (locked, service-role only)
SELECT tablename, COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename LIKE 'pm_%'
GROUP BY tablename
ORDER BY tablename;
```

### 3. Drop in a real AAMC FACTS file and run the pipeline
Place the `.xlsx` in `premed/source-data/facts/`, then:
```
npm run ingest-premed-facts -- --cycle-year=2026
```
Expect to iterate on `parseFactsGrid` in `premed/pipeline/ingest-facts.ts` once you see the real column headers, band label format, and cell format — the parser's header/band-detection regexes (`MCAT_BAND_RE`, `GPA_BAND_RE`, `CELL_PAIR_RE`) are the most likely spots to need adjustment.

### 4. Future session: per-school data source for `pm_school_stats`
Needs a different source (e.g. MSAR) — separate ingest script, separate session.

### 5. Future session: `pm_school_stats` / `pm_outcomes_corpus` RLS
Once a real data source is confirmed for either table, revisit whether they should move from "zero policies" to public-read or stay locked, based on that source's actual license/re-identifiability status.

## Env requirements
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — already in StudyOS's `.env.local` (same Supabase project; `pm_` tables live alongside `o2_` tables).
- Loaded via `tsx --env-file=.env.local` — no dotenv call in the script.

## Key files
| Path | Purpose |
|------|---------|
| `premed/PLAN.md` | Locked plan — full DDL, every design decision and its rationale |
| `premed/PLAN-REVIEW-LOG.md` | Full 5-round Codex adversarial review transcript |
| `supabase/migrations/20260702000000_premed_foundation.sql` | The 7-table migration (not yet applied) |
| `premed/src/lib/schemas.ts` | Zod schemas, one per table |
| `premed/pipeline/ingest-facts.ts` | AAMC FACTS parser + `pm_facts_grid` upsert |
| `premed/pipeline/__fixtures__/facts-grid-fixtures.ts` | Hand-built grid fixtures for tests |
| `premed/pipeline/__tests__/ingest-facts.test.ts` | 9 passing tests |
| `premed/tsconfig.json` | Typecheck config for `premed/` (new — better coverage than existing pipeline dirs) |

## Suggested skills
- **`review`** — before committing, get a code review pass on `ingest-facts.ts` (the parsing/regex logic is the highest-risk code in this session, per the plan's own Risks section).
- **`superpowers:verification-before-completion`** — already run this session (typecheck + full test suite, both clean) before writing this handoff.
- **`gsd:resume-work`** — if there's a GSD plan to restore for the next premed session.

## Conventions followed
- **No Python** — TypeScript only.
- **JSON-first / no analyze-straight-to-DB** — n/a this session (structured grid data, not free text; still goes through Zod validation before any upsert).
- **Flag paid API cost before running** — n/a, no Anthropic API calls this session (deterministic parsing only, per explicit instruction).
- **PowerShell syntax** — Windows 11, no WSL.
- Build verification: `npm run typecheck-premed && npx vitest run premed/` (both clean this session). Full-repo `npx vitest run` also confirmed clean (69/69, no regressions).
