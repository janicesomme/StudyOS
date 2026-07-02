# Plan: Premed Admissions Analysis Platform — Session 1 (foundation)
_Locked via grill — by Claude + Janice_

## Goal
Stand up the foundation of a premed admissions analysis platform **inside the existing StudyOS repo**, under a new top-level `premed/` directory (sibling to `ochem2/`), reusing StudyOS's TypeScript conventions, Supabase project, and `.env.local`. Deliver: seven `pm_`-prefixed tables (the user's original six plus the new `pm_facts_grid`) via a timestamped Supabase migration, Zod schemas mirroring each table, and a deterministic ingest pipeline that parses the AAMC FACTS national GPA×MCAT grid (Table A-23 style) into a new `pm_facts_grid` table, with tests against a fixture and a StudyOS-format handoff doc. No paid API calls, no scraper/UI/analysis layer, no changes to `ochem2/` or existing `src/`.

## Approach
1. **Directory scaffold** — create `premed/` at StudyOS repo root with:
   - `premed/src/lib/schemas.ts` — Zod schemas mirroring all 7 tables
   - `premed/pipeline/ingest-facts.ts` — AAMC FACTS parser + upsert
   - `premed/pipeline/__tests__/ingest-facts.test.ts` — vitest unit tests
   - `premed/pipeline/__fixtures__/` — small hand-built xlsx fixture(s) mimicking the real AAMC FACTS layout
   - `premed/source-data/facts/` — drop location for real AAMC FACTS files (gitignored contents, dir tracked via `.gitkeep`)
   No new root/package-level `package.json` or `node_modules` — this is not a separate repo/package. `premed/tsconfig.json` (see Approach #6) is the one new config file; everything else runs from StudyOS root via existing `tsx`/`vitest`/`tsc` tooling.

2. **Migration** — `supabase/migrations/20260702000000_premed_foundation.sql`. The true latest existing migration is `20260602030000_module3_exam_intelligence.sql` (not `20260602000000` as originally stated — corrected after Codex round 1 caught this); `20260702000000` is still safely chronologically after all seven existing migrations. Creates all seven `pm_` tables (the original six plus `pm_facts_grid`), full DDL below. RLS enabled on every table; policy type depends on table classification (see Key decisions #5); indexes on FK/lookup columns.

3. **Zod schemas** (`premed/src/lib/schemas.ts`) — one schema per table, field-for-field mirror of the migration (types, nullability, enums where the DDL implies one, e.g. `public_private`). Exported schemas + inferred types, same pattern as `ochem2/eas/pipeline/schema.ts`.

4. **Ingest pipeline** (`premed/pipeline/ingest-facts.ts`) — requires exactly one `.xlsx` file present in `premed/source-data/facts/` and hard-fails otherwise (revised after Codex round 3 — a single `--cycle-year` flag combined with silently scanning "file(s)" could mix or overwrite rows from two workbooks under the same year; requiring exactly one file removes the ambiguity without adding a second CLI flag). Parses the national GPA×MCAT applicant/matriculant grid via the `xlsx` package (already a StudyOS dependency), validates each row through the `pm_facts_grid` Zod schema, and upserts into `pm_facts_grid` only (see Key decisions #1). Requires an explicit `--cycle-year=<YYYY>` CLI arg — no auto-detection from filename/sheet title (see Key decisions #10). Structural parse failures (unexpected sheet shape, missing header block) hard-fail the run; per-row Zod validation failures also hard-fail the run rather than skip-log, since this is deterministic official-data import, not noisy enrichment (see Key decisions #6 — this reverses the original prompt's "skip-log" framing after Codex round 1). The upsert payload sets `imported_at: new Date().toISOString()` explicitly on every row (not left to the column default), so re-imports refresh it on conflict rather than only on first insert (Codex round 3 finding — a DB `DEFAULT now()` only fires on `INSERT`, not on an `ON CONFLICT ... DO UPDATE`). Prints an import summary on success: file read, sheet name, rows parsed, rows upserted, totals row/column excluded, resulting DB row count for the cycle year. Follows `load-supabase.ts` conventions: chunked upserts, `--env-file=.env.local`, service-role client. New npm script: `"ingest-premed-facts": "tsx --env-file=.env.local premed/pipeline/ingest-facts.ts"`.

5. **Tests** — `premed/pipeline/__tests__/ingest-facts.test.ts` using vitest against small hand-built fixture xlsx files (built at plan-execution time, since no real AAMC file is available yet): one happy-path grid (band rows/columns + totals row/column + header block), one with a blank row inside the grid, one with a missing/malformed header block — asserting the happy path upserts correctly and the malformed cases hard-fail with a clear error rather than silently parsing garbage.

6. **Typecheck coverage** — `premed/tsconfig.json` (extends the same compiler options as `tsconfig.node.json`, `include: ["**/*.ts"]`) plus a new npm script `"typecheck-premed": "tsc -p premed/tsconfig.json --noEmit"`, so `premed/` pipeline code gets real type-checking instead of relying only on `tsx`'s implicit transpile (gap caught by Codex round 1 — the root `tsconfig.json` only covers `src/` and `vite.config.ts`, and that's true of `ochem2/eas/pipeline/` too, so this is a new safety net rather than matching an existing gap).

7. **`.gitignore`** — add `premed/source-data/facts/*` and `!premed/source-data/facts/.gitkeep`, so real AAMC files the user drops in don't accidentally get committed (caught by Codex round 1 — the plan previously asserted this without an actual rule).

8. **Handoff doc** — `docs/handoffs/2026-07-02-premed-session-1.md`, following the exact structure of `docs/handoffs/2026-07-01-enrich-pipeline.md` (What was built / Current git state / Data reality / Next steps / Env requirements / Key files / Suggested skills / Conventions followed). Includes a manual post-migration verification query (see Key decisions #11) since this repo has no automated migration runner — SQL is applied by hand in the Supabase SQL editor, same as `ochem2/eas/pipeline/create-tables.sql`.

## Key decisions & tradeoffs

1. **`pm_facts_grid` is national-only, `pm_school_stats` is out of scope for this session's pipeline.** AAMC's FACTS Table A-23 (GPA×MCAT grid) is published as one national aggregate per cycle year — it has no per-school breakdown. `pm_school_stats` fields (median_gpa, median_mcat, pct_instate, clinical/research hours, publication %) are inherently per-school and cannot be derived from this source. The migration still creates `pm_school_stats` per the original schema (future session, future source — e.g. MSAR), but `ingest-facts.ts` never writes to it. This is a deliberate scope correction from the original prompt, which conflated two different data shapes.

2. **No `school_id` column on `pm_facts_grid`.** Confirmed with the user — matches AAMC's actual published table shape.

3. **`pm_facts_grid` schema (designed this session; see the Full schema DDL section below for the authoritative, current definition — this bullet is decision rationale, not a second source of truth).** Key fields: `cycle_year`, `gpa_band`/`mcat_band` (verbatim source text labels, e.g. `"3.80-4.00"`/`"517-528"` — not renormalized numeric bounds, since we haven't seen a real file's actual boundary format yet), `applicants`/`matriculants`, provenance (`source_file`, `source_sheet`, `source_sha256`, `imported_at`), and `UNIQUE (cycle_year, gpa_band, mcat_band)` as the upsert conflict key. Re-importing a revised file for the same cycle year overwrites the prior row, but `source_sha256` lets a future session detect whether the bytes actually changed. A full audit-log table (`pm_import_runs`) was considered (Codex round 1 suggestion) and rejected as over-engineering for a single small national-aggregate table in session 1 — provenance columns are enough traceability for now; flagged as an accepted tradeoff, not silently dropped.

4. **`pm_school_stats` gets a unique constraint added:** `UNIQUE (school_id, cycle_year)`. The user's original DDL had no unique constraint, but the original prompt requires "upsert" semantics, which need a conflict key. This is additive only — no other change to the table's columns. (Table is created but not populated this session, per decision #1.) Codex round 1 noted this may be too weak if admissions stats ever need multiple rows per school/year (different cohorts/sources) — documented here as a known limitation for whoever builds the future per-school ingest pipeline, not solved now since no code touches this constraint this session.

5. **RLS is classified per table, not applied uniformly** (corrected after Codex round 1 — verified against `supabase/migrations/*.sql` and found the "StudyOS pattern" is not uniform public-read; `o2_eas_*` tables are public curriculum content, but every StudyOS table keyed by `student_id`/`user_id` — e.g. `source_materials`, `knowledge_units`, `exam_questions` in `20260508000000_plan1_foundation.sql`, `20260508010000_plan2_archivist.sql`, `20260517010000_plan3_exam_questions.sql` — uses `auth.uid() = student_id` scoped policies for select/insert/update/delete). The plan the user approved was based on an incomplete precedent check on my part (I'd only looked at `o2_eas_*`); this fix makes the plan actually match what the user asked for (consistency with StudyOS's real pattern), not a new preference:
   - **User-owned** (`pm_profiles`, `pm_activities`, `pm_narratives`): RLS enabled, `auth.uid() = user_id` (direct on `pm_profiles`; via a subquery join through `profile_id` on `pm_activities`/`pm_narratives`) for select/insert/update/delete. No public-read.
   - **Confirmed-public reference** (`pm_schools`, `pm_facts_grid`): RLS enabled, `FOR SELECT USING (true)` public-read, no write policy (service role bypasses RLS for pipeline writes).
   - **Pending-source reference** (`pm_school_stats`, `pm_outcomes_corpus`): RLS enabled, **zero policies** (service-role only) until a future session confirms the real data source's license/re-identifiability status (refined further after Codex round 2 — see the "RLS — three tiers" note under the Full schema DDL section for the full rationale).

6. **Location: `premed/` inside the StudyOS repo, not a separate repo.** Reuses StudyOS's `package.json` (all required deps — `xlsx`, `zod`, `@supabase/supabase-js`, `vitest` — already present, confirmed by reading `package.json`), its `.env.local` (same Supabase project, `pm_` tables live alongside `o2_` tables), and its build tooling.

7. **File format: `.xlsx` only** (via the existing `xlsx` dependency). No `papaparse`, no CSV branch — confirmed by the user; AAMC distributes FACTS tables as Excel workbooks.

8. **No real source file is available yet.** The user will drop an AAMC FACTS `.xlsx` into `premed/source-data/facts/` themselves. This session's parser and fixture are built against the publicly known AAMC FACTS Table A-23 layout (banded GPA rows × MCAT-band columns, with totals row/column and a header/title block above the grid) — not verified against a real file. This is the single biggest risk in this plan (see below).

9. **Row validation hard-fails instead of skip-logs** (reversed from the original prompt after Codex round 1). The original prompt said "validates rows through Zod" without specifying failure behavior; StudyOS's existing enrichment pipelines skip-and-log bad rows because that data is noisy LLM output. AAMC FACTS is small, deterministic, official data — any row that fails structural or Zod validation means the parser misunderstood the file shape, not that one row is dirty. The run exits non-zero and prints every failure rather than silently loading a partial/wrong grid.

10. **`cycle_year` comes from a required `--cycle-year=<YYYY>` CLI flag, not auto-detected.** AAMC FACTS workbooks don't reliably encode the cycle year in a parseable filename/sheet-title convention we can trust without a real sample; guessing wrong would silently upsert into the wrong logical dataset. The script hard-fails if the flag is missing or non-numeric.

11. **Migration is applied manually, verified with a documented query.** This repo has no automated migration runner (existing migrations are run by hand in the Supabase SQL editor — see the comment at the top of `ochem2/eas/pipeline/create-tables.sql`). The handoff doc includes a copy-pasteable `information_schema` query that asserts RLS status **per the three-tier classification** (Key decision #5) rather than a generic "policies exist" check (Codex round 3 finding — the original wording would have wrongly flagged `pm_school_stats`/`pm_outcomes_corpus`'s intentional zero-policy state as a problem): public-read `SELECT` policy present on `pm_schools`/`pm_facts_grid`; `auth.uid()`-scoped policies present on `pm_profiles`/`pm_activities`/`pm_narratives`; zero policies on `pm_school_stats`/`pm_outcomes_corpus`.

12. **`src/types/database.ts` is not updated this session.** It's StudyOS's manually-maintained generated-types file for the existing app; `premed/` code is Zod-only and doesn't import from it. Adding `pm_` tables there is out of scope until `premed/` has an app layer that needs it — noted as a deferred follow-up in the handoff, not silently skipped (Codex round 1 flag).

## Full schema DDL
Added per Codex round 1 (finding #3) so the plan is reviewable for schema conflicts without cross-referencing the original prompt. `pm_profiles` through `pm_narratives` keep the user's original columns, revised with integrity constraints and RLS-safe FK/nullability changes (CHECK ranges, NOT NULL FKs with ON DELETE CASCADE, `UNIQUE (user_id)` — see Key decisions #1–#2 above per round 2/3 findings); `pm_facts_grid` is the new table designed in Key decision #3.

```sql
CREATE TABLE pm_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gpa_cum numeric(3,2) CHECK (gpa_cum BETWEEN 0 AND 4.00),
  gpa_science numeric(3,2) CHECK (gpa_science BETWEEN 0 AND 4.00),
  mcat_total int CHECK (mcat_total BETWEEN 472 AND 528),
  mcat_date date,
  state_residence text,
  grad_year int,
  gap_years int NOT NULL DEFAULT 0 CHECK (gap_years >= 0),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE pm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES pm_profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  hours_completed int NOT NULL DEFAULT 0 CHECK (hours_completed >= 0),
  hours_planned int NOT NULL DEFAULT 0 CHECK (hours_planned >= 0),
  start_date date,
  end_date date,
  competencies text[],
  narrative_theme text,
  description text
);

CREATE TABLE pm_schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text,
  public_private text CHECK (public_private IN ('public', 'private')),
  mission_keywords text[],
  class_size int CHECK (class_size >= 0)
);

CREATE TABLE pm_school_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES pm_schools(id) ON DELETE CASCADE,
  cycle_year int NOT NULL,
  median_gpa numeric(3,2) CHECK (median_gpa BETWEEN 0 AND 4.00),
  median_mcat int CHECK (median_mcat BETWEEN 472 AND 528),
  pct_instate numeric(4,1) CHECK (pct_instate BETWEEN 0 AND 100),
  pct_gap_year numeric(4,1) CHECK (pct_gap_year BETWEEN 0 AND 100),
  median_clinical_hours int CHECK (median_clinical_hours >= 0),
  median_research_hours int CHECK (median_research_hours >= 0),
  pct_with_publications numeric(4,1) CHECK (pct_with_publications BETWEEN 0 AND 100),
  source text,
  CONSTRAINT pm_school_stats_school_cycle_key UNIQUE (school_id, cycle_year)
);

CREATE TABLE pm_outcomes_corpus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_year int,
  gpa numeric(3,2) CHECK (gpa BETWEEN 0 AND 4.00),
  mcat int CHECK (mcat BETWEEN 472 AND 528),
  state text,
  clinical_hours int CHECK (clinical_hours >= 0),
  research_hours int CHECK (research_hours >= 0),
  volunteer_hours int CHECK (volunteer_hours >= 0),
  has_publication boolean,
  gap_years int CHECK (gap_years >= 0),
  schools_applied int CHECK (schools_applied >= 0),
  interviews int CHECK (interviews >= 0),
  acceptances int CHECK (acceptances >= 0),
  matriculated_school_id uuid REFERENCES pm_schools(id),
  raw_source_url text
);

CREATE TABLE pm_narratives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES pm_profiles(id) ON DELETE CASCADE,
  theme text NOT NULL,
  supporting_activity_ids uuid[],
  mission_fit_school_ids uuid[],
  strength_score int CHECK (strength_score BETWEEN 0 AND 100),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE pm_facts_grid (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_year int NOT NULL,
  gpa_band text NOT NULL,
  mcat_band text NOT NULL,
  applicants int NOT NULL DEFAULT 0 CHECK (applicants >= 0),
  matriculants int NOT NULL DEFAULT 0 CHECK (matriculants >= 0),
  source_file text NOT NULL,
  source_sheet text NOT NULL,
  source_sha256 text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pm_facts_grid_cycle_gpa_mcat_key UNIQUE (cycle_year, gpa_band, mcat_band)
);
```
Domain CHECK constraints, NOT NULL FKs with ON DELETE CASCADE, `public_private` enum check, and `pm_facts_grid.source_sha256` all added after Codex round 2 (findings #1–3, #6–9). `pm_profiles.user_id` also gets `UNIQUE` (Codex round 3 finding #6) — one admissions profile per user is the model implied by `auth.uid() = user_id` RLS everywhere else in this schema; the original prompt didn't state this explicitly but nothing implies multiple profiles per user either. `strength_score` range (0-100) is a reasonable inferred bound for an unspecified "score" field — flagged here as an inference, not a value stated anywhere in the original prompt.

`source_sha256` is computed in `ingest-facts.ts` via Node's built-in `crypto` module (`createHash('sha256')` over the file bytes) — no new dependency. It lets a future session detect "this is a byte-identical re-run" vs "this cycle year's data actually changed," without building the full `pm_import_runs` audit table Codex originally suggested (still deferred, still logged as an accepted tradeoff in Risks).

RLS — three tiers (revised after Codex round 2 finding #4/#5, which pointed out `pm_school_stats` and `pm_outcomes_corpus` may hold licensed/re-identifiable data whose public status isn't actually known yet):
- **User-owned** (`pm_profiles`, `pm_activities`, `pm_narratives`): RLS enabled, `auth.uid() = user_id` (direct on `pm_profiles`; via `EXISTS` subquery through `profile_id` → `pm_profiles.user_id` on the other two), all four operations, no public-read.
- **Confirmed-public reference** (`pm_schools`, `pm_facts_grid`): RLS enabled, `FOR SELECT USING (true)`, no write policy. `pm_schools` is basic uncontroversial institutional metadata; `pm_facts_grid` is AAMC's own published national aggregate, deterministically parsed this session — both are unambiguously public.
- **Pending-source reference** (`pm_school_stats`, `pm_outcomes_corpus`): RLS enabled, **no policy at all** (service-role only) until a real data source is ingested and its license/re-identifiability status is confirmed. Both tables are empty this session regardless (out of scope per decision #1), so this costs nothing now and avoids defaulting sensitive-shaped data to public by accident. Revisit RLS classification in the session that actually populates these tables.

## Risks / open questions
- **Parser correctness is unverified against a real AAMC file.** The fixture and parsing logic are built from general knowledge of the FACTS Table A-23 format (band-labeled grid, totals row/column, header rows to skip). When the user drops in a real file, the sheet name, exact header row offset, band label format, and totals-row/column position may differ and require adjustment. This is explicitly flagged as a next-session follow-up, not silently assumed correct.
- **`pm_school_stats` has no ingest path yet.** Deliberately deferred — needs a per-school source (e.g., MSAR) not covered by this session.
- **`pm_school_stats` and `pm_outcomes_corpus` have no RLS SELECT policy at all** (service-role only) until a future session confirms their real data source and license/re-identifiability status — flagged in Key decision #5 as a deliberate "locked until known" default rather than defaulting to public.
- **No audit-log table for FACTS re-imports.** `imported_at`/`source_file` on `pm_facts_grid` give lightweight traceability but a revised AAMC file silently overwrites the prior row's counts with no history. Accepted for session 1 scope; revisit if AAMC revisions turn out to be common.
- **`pm_school_stats` unique constraint (`school_id, cycle_year`) may be too weak** once a real per-school ingest exists, if StudyOS ever needs multiple stat rows per school/year (different cohorts/sources). Not solved now since no code touches this table's data this session.

## Out of scope
- Scraper, UI, analysis layer (explicit user instruction).
- Any paid Anthropic API call (explicit user instruction — this pipeline is deterministic parsing only).
- `pm_school_stats` population.
- `src/types/database.ts` updates.
- Automated migration runner / CI — migration is applied manually per StudyOS's existing convention.
- New dependencies beyond what StudyOS already has installed (none needed — `xlsx`, `zod`, `@supabase/supabase-js`, `vitest` all already present).
- Any change to `ochem2/` or any existing file under `src/`.
- **Allowed file scope this session (corrected after Codex round 5 — the prior wording undercounted its own required edits):** everything under `premed/` (new); `supabase/migrations/20260702000000_premed_foundation.sql` (new); `docs/handoffs/2026-07-02-premed-session-1.md` (new); `.gitignore` (append-only, the two new lines from Approach #7); `package.json` (append-only — two new npm scripts, `ingest-premed-facts` and `typecheck-premed`; no dependency changes since everything needed is already installed). No other existing file is touched.
