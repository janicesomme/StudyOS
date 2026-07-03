# StudyOS Session Handoff — 2026-07-03 (premed session 3)

## Project
**Workspace:** `c:\Users\crm22\StudyOS`
**Subsystem:** `premed/` — profile persistence layer, built on the `pm_facts_grid` + Gap Analyzer foundation from sessions 1–2.
**Stack:** TypeScript, Zod, `@supabase/supabase-js`, vitest — no new dependencies.
**Shell:** PowerShell on Windows 11.

Read `docs/handoffs/2026-07-02-premed-session-bridge.md` first for what happened before this session (schema correction, ingest, Gap Analyzer). Read `docs/handoffs/2026-07-02-premed-session-2.md` if you need Gap Analyzer internals. This doc assumes both.

## A real constraint surfaced mid-session — read this before touching seeding
The task asked for 4 archetype test profiles with "fixed UUIDs." `pm_profiles.user_id` is `NOT NULL UNIQUE REFERENCES auth.users(id)` (by design, for the `auth.uid()`-scoped RLS from session 1) — and Supabase's admin API doesn't let you choose a `user_id`'s UUID when creating an auth user; it's server-generated. So literal fixed UUIDs aren't possible without those rows already existing.

Verified this is a **live Supabase project with 2 real user accounts already in `auth.users`** (not a throwaway test DB) before doing anything, then asked the user how to proceed rather than assuming. Got explicit sign-off to create 4 minimal test `auth.users` rows via the admin API. Resolution: each archetype is keyed by a **fixed, documented test email** (`archetype-<key>@premed.test`, `.test` TLD per RFC 2606) instead of a literal UUID — `seed-archetypes.ts` looks the user up by email each run and only creates one if missing, which is what makes re-running idempotent even though the underlying UUID is server-assigned, not chosen. The 4 real UUIDs generated this run are logged below for reference; don't hardcode them anywhere, they're an artifact of one run, not a contract — always resolve by email.

## What was built this session

### 1. `premed/src/lib/profiles.ts`
`createProfile` / `getProfile` / `updateProfile` against `pm_profiles`, `addActivity` / `listActivities` / `updateActivity` against `pm_activities`. All take a `SupabaseClient` + explicit `user_id`/`profile_id` (no `auth.uid()` — service-role pipeline context, same convention as every other premed script). Every input is Zod-validated before touching the DB.

- **`createProfile` upserts on `user_id`** (the table's `UNIQUE` key) rather than always inserting — re-running with the same `user_id` updates the existing row instead of erroring or duplicating. This was a deliberate choice (not explicitly specified) because it's what makes both a re-run of `profile-create` and the archetype seed script idempotent without extra branching logic.
- `updateProfile` is a separate partial-patch-by-`id` function, distinct from `createProfile`'s full-row upsert — used internally (no CLI wired to it yet, matches the task's scope which didn't ask for a `profile-update` npm script).
- **`profileToSlice(profile)`** — extracts `{gpa, mcat}` for the Gap Analyzer, hard-failing with a clear message if `gpa_cum`/`mcat_total` haven't been filled in. Added because both `profile-analyze` and `profile-show` need this exact extraction; keeping it in one place is what "reuse gap-analyzer.ts, don't duplicate logic" actually required once there were two call sites.
- `addActivity`/`updateActivity` have no built-in "one row per category" upsert behavior — a real user might legitimately log two separate stints in the same category. That idempotency (needed only for reseeding) lives in `seed-archetypes.ts`, not in the library.

### 2. Activity category enum — `premed/src/lib/schemas.ts`
No category enum existed anywhere in the codebase before this session (`pm_activities.category` was `text NOT NULL`, no DB `CHECK`, no Zod enum). Added `ACTIVITY_CATEGORIES` (10 AMCAS-style values: `clinical_volunteer`, `clinical_paid`, `nonclinical_volunteer`, `research`, `shadowing`, `leadership`, `teaching`, `publication`, `extracurricular`, `other`) and `ActivityCategorySchema` = `z.enum(...)`, then changed `PmActivitySchema.category` to use it. **This is Zod-layer-only** — the DB column stays `text` with no `CHECK` constraint, per this session's explicit "no schema changes" rule. Flagged here as a known gap, same pattern session 1 used for other deferred tradeoffs: a future session that touches the migration should consider adding a matching `CHECK (category IN (...))` for defense in depth.

### 3. `premed/pipeline/profile-cli.ts` (4 subcommands, 1 file)
- `npm run profile-create -- --user <id> --gpa 3.6 --mcat 508 [--state LA --grad-year 2027 --gap-years 0]`
- `npm run profile-analyze -- --user <id>` — loads the stored profile via `getProfile`, calls `profileToSlice` then the **existing** `analyzeProfile` from `gap-analyzer.ts` (no reimplementation).
- `npm run activity-add -- --user <id> --category clinical_volunteer --hours 120 [--planned 200 --description "..."]`
- `npm run profile-show -- --user <id>` — profile block + activities table + full gap analysis in one report.

Zod errors (bad category, out-of-range GPA/MCAT, etc.) print as a clean `field: message` list and exit 1 — verified live against a real invalid-category request.

### 4. Shared CLI infrastructure (new, used by all 3 pipeline scripts now)
Two small files extracted to avoid duplicating logic across `analyze-profile.ts`, `profile-cli.ts`, and `seed-archetypes.ts`:
- **`premed/pipeline/cli-args.ts`** — `parseFlags`/`requireString`/`requireNumber`/`optionalString`/`optionalNumber`/`printCliError`. `analyze-profile.ts`'s `parseCliArgs` was refactored to use this (behavior-identical, its existing tests still pass unmodified).
- **`premed/pipeline/report.ts`** — `formatRate`/`formatCounts`/`trendArrow`/`printGapAnalysis` (moved out of `analyze-profile.ts` verbatim) plus new `printProfile`/`printActivities`, so `profile-cli.ts`'s `show` and `seed-archetypes.ts`'s final printout share the exact same rendering as `analyze-profile.ts`.

### 5. `premed/pipeline/seed-archetypes.ts` + `npm run seed-archetypes`
Creates/updates 4 test profiles with representative activities:

| key | gpa | mcat | gap_years | activities |
|---|---|---|---|---|
| grinder | 3.9 | 505 | 0 | clinical_volunteer 150h, research 400h |
| flipped | 3.4 | 517 | 0 | clinical_paid 800h, research 50h |
| balanced | 3.6 | 508 | 0 | clinical_volunteer 200h, research 200h, nonclinical_volunteer 100h |
| climber | 3.2 | 512 | 2 | clinical_paid 2000h, leadership 300h |

Idempotent at every level, verified live by running it twice: same 4 `auth.users` ids both times (looked up by email, not recreated), same 4 `pm_profiles` ids (upsert-in-place), activity row count unchanged (2 → 2, not 2 → 4) on the second run. After seeding, prints `profile-show`-equivalent output for all four.

**Live UUIDs from this run** (server-generated, resolve by email if you need them again — do not hardcode):
- grinder: `user_id=64620492-5eac-4111-86c2-210774b5f001` `profile_id=39c32de3-7358-468a-baae-d1147ef71f57`
- flipped: `user_id=3b92baf1-c5e1-47c6-a6aa-7bd110fb5a18` `profile_id=5f0f35e4-6f7d-4ab7-a476-db0e655cea83`
- balanced: `user_id=430e8e4a-b0d4-4aae-bb38-5993289ff9c0` `profile_id=10ace929-96d3-45c8-95d1-b11e92bfbb3e`
- climber: `user_id=815b38d9-7539-4f97-80ce-40a71a3f6293` `profile_id=d5a5c99c-df96-4e2d-b452-41bbfa931bcc`

All 4 gap-analysis outputs looked sane (rates increase with higher GPA/MCAT bands, decrease with lower, in every archetype).

### 6. Tests
- `premed/src/lib/__tests__/fake-supabase.ts` — new shared in-memory Supabase stand-in (supports `select`/`insert`/`update`/`upsert`, `eq`/`in` filters, `order`, `single`/`maybeSingle`, the thenable protocol). Used by the two new test files below; deliberately separate from `gap-analyzer.test.ts`'s own narrower fake client rather than forcing a shared abstraction on already-passing tests.
- `premed/src/lib/__tests__/profiles.test.ts` (17 tests) — CRUD round trips for profiles and activities, `createProfile` idempotency (re-run updates in place, table stays length 1), category enum rejection, `profileToSlice` happy/error paths, and a **profile-analyze wiring test**: seeds a fake profile + fake `pm_facts_grid`, runs `getProfile` → `profileToSlice` → `analyzeProfile` (the real one from `gap-analyzer.ts`) end to end, asserts the matched cell and rate — proves the persistence layer feeds the existing Gap Analyzer correctly without reimplementing any of its logic.
- `premed/pipeline/__tests__/profile-cli.test.ts` (10 tests) — arg-parsing tests for all 4 subcommands, same pattern as session 2's `analyze-profile.test.ts`.
- All existing tests (session 1 + 2, 43 tests) still pass unmodified.
- **67/67 premed tests pass. 127/127 full-repo tests pass** (no regressions). Typecheck (`npm run typecheck-premed`) clean.

## Current git state
Not yet committed (matches this repo's "never commit automatically" rule). Changed/new since the last commit (`53b674d`):
- Modified: `package.json` (5 new npm scripts), `premed/pipeline/analyze-profile.ts` (refactored to use the new shared modules, behavior unchanged), `premed/src/lib/schemas.ts` (activity category enum)
- New: `premed/src/lib/profiles.ts`, `premed/src/lib/__tests__/profiles.test.ts`, `premed/src/lib/__tests__/fake-supabase.ts`, `premed/pipeline/profile-cli.ts`, `premed/pipeline/__tests__/profile-cli.test.ts`, `premed/pipeline/seed-archetypes.ts`, `premed/pipeline/cli-args.ts`, `premed/pipeline/report.ts`

No file under `ochem2/` or existing `src/` touched. No DB schema change this session (matches the explicit rule) — `pm_activities.category` enum enforcement is Zod-only, see "known gap" above. Run `git status` to confirm before committing.

## Open items / not started
- No UI layer.
- No DB-level `CHECK` constraint backing the activity category enum (see above) — deliberate given this session's "no schema changes" rule, worth revisiting whenever the migration is next touched.
- `updateProfile` has no CLI (`profile-update` wasn't in scope this session) — library function exists and is tested, just unwired.
- No `pm_school_stats`/`pm_outcomes_corpus`/essay features — explicitly out of scope, consistent with all prior sessions.
- The 4 archetype `auth.users` test accounts are real rows in the live Supabase project's auth system now. They're harmless (`.test` emails, random unused passwords, `email_confirm: true` so no email was ever sent) but if you want them gone later, delete via `supabase.auth.admin.deleteUser(id)` using the UUIDs logged above (cascades to `pm_profiles`/`pm_activities` via `ON DELETE CASCADE`).

## Env / secrets
`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, unchanged. `seed-archetypes.ts` additionally uses `supabase.auth.admin.*` (still just the service role key, no new credential).

## Key files
| Path | Purpose |
|------|---------|
| `premed/src/lib/profiles.ts` | Profile/activity CRUD + `profileToSlice` |
| `premed/src/lib/__tests__/profiles.test.ts` | 17 tests — CRUD, idempotency, enum rejection, wiring |
| `premed/src/lib/__tests__/fake-supabase.ts` | Shared in-memory Supabase stand-in for tests |
| `premed/pipeline/profile-cli.ts` | 4-subcommand CLI (create/analyze/activity-add/show) |
| `premed/pipeline/__tests__/profile-cli.test.ts` | 10 tests — arg parsing per subcommand |
| `premed/pipeline/seed-archetypes.ts` | Idempotent 4-archetype seed + report |
| `premed/pipeline/cli-args.ts` | Shared flag parsing + error printing |
| `premed/pipeline/report.ts` | Shared terminal report formatting |
| `premed/src/lib/schemas.ts` | `ACTIVITY_CATEGORIES`/`ActivityCategorySchema` added this session |

## Suggested skills for the next session
- **`review`** — `createProfile`'s upsert-on-`user_id` design and the category-enum-without-DB-CHECK gap are both judgment calls made this session without a full grill; worth a second look before more is built on top.
- **`superpowers:verification-before-completion`** — same pattern as sessions 1–2: `npm run typecheck-premed && npx vitest run premed/`, full-repo suite, live CLI smoke tests before claiming done.
- If the next session adds `profile-update` or any write-path UI: check whether the category enum should finally get a DB `CHECK` constraint, since a UI removes the "service-role pipeline only" safety net Zod-only validation currently relies on.
