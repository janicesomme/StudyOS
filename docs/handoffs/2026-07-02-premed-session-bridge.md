# Handoff — StudyOS `premed/` subsystem (2026-07-02, end of session 2)

## Workspace
`c:\Users\crm22\StudyOS` (git repo, branch `master`). Windows 11, PowerShell, no WSL. This handoff covers a single continuous conversation spanning what turned out to be two logical work sessions on the `premed/` admissions-analysis subsystem.

## Don't re-derive — read these first
- `docs/handoffs/2026-07-02-premed-session-1.md` — original foundation build (migration, schemas, ingest pipeline). **Stale on `pm_facts_grid`'s exact column shape** — see correction below.
- `docs/handoffs/2026-07-02-premed-session-2.md` — Gap Analyzer build, written at the end of this conversation. This is the most current and authoritative handoff; it documents the schema correction and everything built in the second half of this conversation in full detail.
- `premed/PLAN.md` + `premed/PLAN-REVIEW-LOG.md` — the original grill-me-codex-locked plan for session 1. Also stale on `pm_facts_grid`'s shape for the same reason.

This doc exists only to bridge context that isn't in those files — mainly *why* the schema changed mid-conversation and the git/verification state right now. Full technical detail on both the correction and the new Gap Analyzer code lives in the session-2 handoff above; don't duplicate it here.

## What happened in this conversation, in order
1. **Real-data ingest (this conversation's first half, not its own handoff doc).** Was asked to copy the real 2025/2023 AAMC FACTS Table A-23 `.xlsx` files into `premed/source-data/facts/` and run the session-1 ingest pipeline. The session-1 parser/schema were built speculatively (no real file existed yet) and turned out to be **wrong in a structural and a semantic way**:
   - Structural: real AAMC layout is 3 rows per GPA band (`Acceptees`/`Applicants`/`Acceptance rate %`), open-ended band labels (`"Less than 486"`, `"Greater than 3.79"`), not the assumed single-cell `"45 / 38"` format.
   - Semantic: Table A-23 reports **Acceptees** (offered admission), not **matriculants** (enrolled) — AAMC has no matriculant-level version of this grid.
   - Got the user's explicit sign-off on two fixes via `AskUserQuestion` before touching code: rename `matriculants`→`acceptees` in the schema, and store AAMC-suppressed cells (`"-"`, meaning true count is 1-9, privacy-redacted) as `NULL` + a `*_suppressed` boolean flag rather than coercing to `0`.
   - Rewrote `premed/pipeline/ingest-facts.ts`'s parser, `premed/src/lib/schemas.ts`'s `PmFactsGridSchema`, and `supabase/migrations/20260702000000_premed_foundation.sql`'s `pm_facts_grid` DDL to match. Rewrote fixtures/tests to match the real shape (13 tests, all passing).
   - **The user applied the corrected migration by hand in the Supabase SQL editor** (confirmed complete — this repo has no automated migration runner, matches its documented convention).
   - Ingested both cycle years: **2025 → 110/110 rows, 2023 → 110/110 rows**, 220 total in `pm_facts_grid`, verified via a live count query.
   - Saved an auto-memory note on this gotcha (`project_premed_facts_grid_aamc.md` in the memory system) since it's a non-obvious AAMC data-semantics fact a future session could easily re-trip on.

2. **Session 2 — Gap Analyzer (has its own handoff, see above).** Built `premed/src/lib/gap-analyzer.ts` (band mapping + suppression-honest cell stats + multi-cycle delta) and `premed/pipeline/analyze-profile.ts` (CLI: `npm run analyze-profile -- --gpa 3.6 --mcat 508`). 39 new tests, all passing; full repo suite 103/103 clean; typecheck clean; 3 live CLI smoke tests against real data (normal cell, a real suppressed cell, an out-of-range rejection) all behaved correctly.

## Current state (verified, not just claimed)
- `pm_facts_grid` in Supabase: 220 rows live (110 × cycle_year 2023, 110 × cycle_year 2025), columns `cycle_year, gpa_band, mcat_band, applicants, applicants_suppressed, acceptees, acceptees_suppressed, source_file, source_sheet, source_sha256, imported_at`.
- `premed/source-data/facts/` is empty except `.gitkeep` — the ingest script requires exactly one `.xlsx` present at a time, so both source files were removed after their respective ingest runs. Raw originals are untouched in `C:\Users\crm22\Downloads\` if a re-ingest is ever needed.
- Full test suite: **103/103 passing** (43 in `premed/`, rest pre-existing). Typecheck (`npm run typecheck-premed`) clean.
- Git status: everything under `premed/`, the migration file, and both handoff docs are still **untracked** (nothing has been committed this entire conversation — the user hasn't asked for a commit). `package.json` and `.gitignore` show as modified (append-only edits: new npm scripts, gitignore rule for `premed/source-data/facts/*`).

## Open items / not started
- No UI layer — `analyzeProfile()` is a pure function, nothing renders it yet.
- No `pm_school_stats` or `pm_outcomes_corpus` ingest path — needs a per-school source (e.g. MSAR), explicitly deferred to a future session in both session-1 and session-2 handoffs.
- No wiring from a logged-in user's `pm_profiles` row to `analyzeProfile()` — the CLI takes a raw `{gpa, mcat}` today.
- Nothing has been committed to git yet. If the next session's goal includes committing, confirm with the user first per this repo's stated git rules (never commit automatically).

## Env / secrets
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` live in `c:\Users\crm22\StudyOS\.env.local` (not committed, not reproduced here). No values are recorded in this handoff or in chat — every script in this session sourced them via `tsx --env-file=.env.local`.

## Suggested skills for the next session
- **`review`** — a code-review pass on `premed/src/lib/gap-analyzer.ts`'s neighbor-cell wiring (`findRow` lookups keyed by `(gpa_band, mcat_band)`) before any UI gets built on top of it; flagged as the highest-risk logic in the session-2 handoff.
- **`superpowers:verification-before-completion`** — before claiming any new premed work done, re-run `npm run typecheck-premed && npx vitest run premed/` plus a live CLI smoke test, same pattern used this session.
- If the next session's goal is a UI for this data: **`superpowers:brainstorming`** first (this repo's global CLAUDE.md also requires `/grill-me-codex` before any new major UI component — don't skip it).
- If the next session touches `pm_school_stats`/MSAR ingest: treat it like the FACTS ingest was treated here — inspect the real source file's structure *before* trusting any speculatively-built parser, since that's exactly what went wrong in session 1's first pass at `ingest-facts.ts`.
