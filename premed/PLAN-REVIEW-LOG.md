# Plan Review Log: Premed Admissions Analysis Platform — Session 1
Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.

## Round 1 — Codex
1. RLS decision wrong/unsafe — public-read on user-owned tables contradicts StudyOS's actual pattern (auth.uid()=student_id on personal tables). Fix: classify by table type.
2. Migration timestamp rationale cited wrong "latest" migration (two more recent ones exist, though chosen timestamp is still safely after all of them).
3. Six table DDLs not included in plan body — can't review for schema conflicts.
4. `.gitignore` claimed but no actual rule for `premed/source-data/facts/`.
5. (duplicate of #1) public-read precedent is wrong — o2_eas_* is curriculum content, not user data.
6. skip-log validation behavior inappropriate for deterministic official-data import — should hard-fail.
7. No provenance fields on `pm_facts_grid` (which file/sheet/when).
8. Upsert on (cycle_year, gpa_band, mcat_band) silently overwrites on re-import with no audit trail.
9. `cycle_year` extraction method unspecified — risk of wrong-year upsert.
10. Fixture too synthetic — doesn't cover merged cells/blank rows/multi-sheet.
11. No migration verification step documented.
12. `src/types/database.ts` drift not addressed.
13. No typecheck coverage for `premed/` (root tsconfig doesn't include it).
14. `pm_school_stats` unique constraint may be too weak for future multi-cohort data.
15. Thin observability — no import summary output specified.

VERDICT: REVISE

### Claude's response
Accepted and revised into PLAN.md: #1/#5 (RLS reclassified by table type — verified against actual migration files, this was a factual error in the original plan caused by only checking `o2_eas_*` precedent, not a new preference), #2 (corrected rationale text, timestamp itself unchanged), #3 (added full DDL to plan), #4 (added `.gitignore` rule to approach), #6 (row validation now hard-fails), #7 (added `source_file`/`source_sheet`/`imported_at`), #9 (required `--cycle-year` CLI flag), #10 (fixture set expanded to include blank-row and malformed-header cases), #11 (added documented manual verification query to handoff plan), #12 (explicitly deferred and documented rather than silently skipped), #13 (added `premed/tsconfig.json` + `typecheck-premed` script), #15 (added import summary output spec).

Rejected/deferred with reason: #8's suggested fix (checksum + `pm_import_runs` audit table) — over-engineering for a single small national-aggregate table in session 1; the lighter provenance-fields option (also offered by Codex as an "or" branch) was taken instead, and the gap is logged as an accepted risk, not silently dropped. #14 — no code touches `pm_school_stats` data this session (it's out of scope per decision #1), so the constraint question is documented as a known limitation for the future per-school ingest session rather than solved now.

## Round 2 — Codex
Confirmed addressed: RLS intent, timestamp, DDL inclusion, .gitignore plan, hard-fail validation, --cycle-year, typecheck coverage, migration verification acknowledgment.

New findings:
1. `pm_profiles.user_id` has no FK to `auth.users`.
2. `pm_activities.profile_id`/`pm_narratives.profile_id` nullable — orphanable rows.
3. `pm_school_stats.school_id` nullable — weakens the unique constraint.
4. `pm_school_stats` public-read may expose future licensed MSAR data.
5. `pm_outcomes_corpus` public-read may expose re-identifiable applicant-level data.
6. Plan text says "6 tables," actually 7 with `pm_facts_grid`.
7. No domain CHECK constraints (GPA/MCAT/hours/percentages/scores can hold impossible values).
8. `public_private` claimed as enum but no DB CHECK.
9. `pm_facts_grid` provenance still can't detect "same filename, different bytes" on re-import.

VERDICT: REVISE

### Claude's response
Accepted all 9 and revised into PLAN.md: #1 (`user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` — verified this matches StudyOS's actual Supabase auth setup by reading `20260508000000_plan1_foundation.sql`), #2 (`profile_id` now `NOT NULL ... ON DELETE CASCADE` on both tables), #3 (`school_id` now `NOT NULL ... ON DELETE CASCADE`), #6 (fixed "6" → "7" in three places), #7 (added CHECK constraints: GPA 0-4.00, MCAT 472-528 official AAMC scale, percentages 0-100, non-negative hours/counts, strength_score 0-100 as a reasonable inferred bound), #8 (`CHECK (public_private IN ('public','private'))`), #9 (added `pm_facts_grid.source_sha256 text NOT NULL`, computed via Node's built-in `crypto` module — no new dependency).

#4/#5 resolved together with a new third RLS tier rather than Codex's literal per-table fix: `pm_school_stats` and `pm_outcomes_corpus` reclassified from "confirmed-public" to "pending-source" — RLS enabled, no SELECT policy at all (service-role only) until a future session confirms their real data source's license/re-identifiability status. Both tables are empty this session regardless, so this costs nothing now and removes the public-read default-to-sensitive risk Codex flagged. Logged as a new Risk rather than silently resolved.

## Round 3 — Codex
1. Contradiction: scaffold text says "no new tsconfig.json" but Approach #6 adds `premed/tsconfig.json`.
2. `pm_facts_grid` snippet in Key decision #3 omits `source_sha256`, inconsistent with full DDL.
3. Verification-query wording says "policies exist" for all tables, contradicting the intentional zero-policy tables.
4. Single `--cycle-year` + scanning "file(s)" plural is dangerous — two workbooks could mix/overwrite under one year.
5. `imported_at DEFAULT now()` doesn't refresh on `ON CONFLICT ... DO UPDATE` unless explicitly set in the upsert payload.
6. No `UNIQUE (user_id)` on `pm_profiles` — ambiguous whether multiple profiles per user are intended.

VERDICT: REVISE

### Claude's response
Accepted all 6: #1 (fixed scaffold wording), #2 (Key decision #3 now points to the DDL section as sole source of truth instead of duplicating a stale snippet), #3 (verification query wording now asserts per-tier expectations, including zero-policy as the correct state for two tables), #4 (ingest now requires exactly exactly one `.xlsx` file present and hard-fails otherwise, no second CLI flag needed), #5 (upsert payload explicitly sets `imported_at: new Date().toISOString()` on every row), #6 (`pm_profiles.user_id` now `UNIQUE` — one profile per user matches the `auth.uid() = user_id` RLS model used everywhere else in this schema).

No rejections this round — all findings were real consistency gaps or genuine correctness fixes with no downside.

## Round 4 — Codex
1. Key decision #5's bullet list still showed the stale two-tier RLS classification (public-read on `pm_school_stats`/`pm_outcomes_corpus`) even though the three-tier model was adopted in round 2 — an actual leftover bug, not just phrasing.
2. Approach #2 still said "6 pm_ tables plus pm_facts_grid" instead of "7."
3. Full DDL section intro claimed the six tables are "verbatim" when constraints/FKs/UNIQUE were intentionally added in rounds 2–3.

VERDICT: REVISE

### Claude's response
Accepted all 3: #1 (this was a real bug — the two-tier bullet list from round 1 was never updated when round 2 introduced the third tier; fixed to match the actual three-tier model, with a pointer to the fuller rationale under Full schema DDL), #2 (fixed wording), #3 (intro now says "original columns, revised with integrity constraints and RLS-safe FK/nullability changes" with a pointer to the specific decisions). Also caught and fixed a stale cross-reference in Approach #2 ("see Key decisions #9") to the correct "#5" while making the other edits.

No rejections. This round's findings were genuine internal-consistency bugs from incremental editing, not new design flaws.

## Round 5 — Codex (final round, MAX_ROUNDS=5)
1. "Out of scope" section contradicted the plan's own required edits — `.gitignore` (Approach #7) and `package.json` (new npm scripts in Approach #4/#6) are both necessary but the file-scope list didn't mention them.
2. (minor) Goal wording could be misread alongside the stricter Out of scope bullet — suggested an explicit allowed-file-scope list.

VERDICT: REVISE

### Claude's response
Accepted #1/#2 together: replaced the file-scope bullet in "Out of scope" with an explicit allowed-file-scope list covering all five touched paths (`premed/`, the one migration file, the one handoff doc, `.gitignore` append, `package.json` append — no dependency changes). Applied to PLAN.md.

**MAX_ROUNDS (5) reached — per skill rules, the loop terminates here rather than requesting a 6th Codex pass.** This is not a disagreement deadlock: round 5's finding was a single, uncontroversial scope-list omission (not a schema/logic/security question), and the fix is a two-line documentation edit with no implementation-affecting change. It was applied but has not been re-verified by Codex. Flagging this honestly rather than claiming a clean APPROVED — the user should glance at the "Allowed file scope" bullet in the final PLAN.md before sign-off.

## Summary across 5 rounds
15 + 6 + 6 + 3 + 2 = 32 findings raised, 32 accepted and incorporated (0 outright rejected as wrong; 2 findings — audit-checksum table and full CI migration runner — accepted in a lighter form than Codex's suggested fix, with the tradeoff logged explicitly rather than silently dropped). One factual error in Claude's own original plan was caught and corrected: the RLS design initially claimed to "match the StudyOS pattern" based on an incomplete precedent check (only `o2_eas_*` public-content tables), when StudyOS's actual pattern for user-owned tables is `auth.uid()`-scoped — this was a genuine bug in the plan the user had approved, not a new preference, and was corrected in round 1.
