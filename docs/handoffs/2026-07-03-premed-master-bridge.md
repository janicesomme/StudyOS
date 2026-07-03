# Handoff — StudyOS `premed/` subsystem (2026-07-03, end of session 7)

## Workspace
`c:\Users\crm22\StudyOS` (git repo, branch `master`). Windows 11, PowerShell, no WSL. This single conversation ran seven consecutive "sessions" (the user's own framing, each with its own numbered scope and handoff doc) building a premed admissions-analysis subsystem from a blank `premed/` directory up through a live dashboard. Everything is committed and pushed. Latest commit: `3516890`.

## Don't re-derive — read these first, in order
1. `docs/handoffs/2026-07-02-premed-session-1.md` — original foundation (migration, schemas, ingest pipeline). **Stale on `pm_facts_grid`'s exact shape** — corrected same-day, see #2.
2. `docs/handoffs/2026-07-02-premed-session-bridge.md` — bridges what #1 doesn't cover: the AAMC data-shape correction (see "Non-obvious facts" below) and git/verification state at that point.
3. `docs/handoffs/2026-07-02-premed-session-2.md` — Gap Analyzer (`gap-analyzer.ts`, band mapping, +/-1 sensitivity).
4. `docs/handoffs/2026-07-03-premed-session-3.md` — profile/activity persistence (`profiles.ts`), 4 archetype test users seeded.
5. `docs/handoffs/2026-07-03-premed-session-4.md` — Activity Gap Read-out (`activity-gap.ts`, `baselines.ts`, cited hour norms).
6. `docs/handoffs/2026-07-03-premed-session-5.md` — class-profile scraper (`scrape-class-profiles.ts`), live/static baseline swap (`baselines-live.ts`).
7. `docs/handoffs/2026-07-03-premed-session-6.md` — pivoted from a planned Reddit/SDN scrape to first-party outcome reporting (`outcomes.ts`) + national percentile positioning (`corpus-stats.ts`), after a step-0 compliance check couldn't clear either source.
8. `docs/handoffs/2026-07-03-premed-session-7.md` — the `/premed` dashboard (React UI), **most recent and most relevant if continuing UI work**.

This doc exists only to give a fresh agent the cross-session shape and the traps that aren't fully spelled out in any single one of the docs above. Don't duplicate their content — read them for implementation detail.

## Current state (verified at end of session 7)
- **Live dashboard** at `/premed` in the StudyOS app (behind existing login). Demo mode (4 archetypes: grinder/flipped/balanced/climber, read-only, static fixtures) and Real mode (live Supabase reads/writes via anon key + RLS, hardcoded to `crm2263@gmail.com`'s UUID for now — see below).
- **DB**: `pm_facts_grid` (220 rows, 2023+2025 AAMC national grid), `pm_schools` (30 real schools), `pm_school_stats` (16 scraped, 12 with both GPA+MCAT), `pm_profiles`/`pm_activities` (4 archetypes + one real test profile — see "Loose end" below), `pm_outcomes_corpus` (schema pivoted this session, empty of real reports).
- **Tests**: 230/230 passing (`npx vitest run` at repo root). `npm run typecheck-premed` clean. App `npx tsc -p tsconfig.app.json --noEmit` clean. `npm run build` succeeds.
- **Git**: clean, everything through session 7 pushed to `origin/master` at `3516890`.

## Non-obvious facts a future session will need (the expensive-to-rediscover ones)
- **AAMC Table A-23 has no matriculant data, only "Acceptees"** (offered admission, not enrolled) — `pm_facts_grid.matriculants` was renamed to `acceptees` early on. Suppressed cells (AAMC hides n<10) are `NULL` + a `*_suppressed` boolean, never coerced to `0`.
- **`pm_schools` has no UNIQUE constraint on `name`.** **`pm_school_stats`'s real UNIQUE constraint is `(school_id, cycle_year)`**, not `(..., source)` as originally scoped — the `source` URL is folded into the single `source` text column instead. **`pm_school_stats` has RLS enabled but *zero* policies** (not even public-read, unlike `pm_schools`/`pm_facts_grid`) — this is why the dashboard needs a static snapshot for the School Comparison table rather than a live query.
- **`pm_outcomes_corpus` was redesigned mid-project** (session 6) from an anonymous scraped-corpus table (no owner column) to a first-party, user-owned, consent-gated table (`user_id`, `consent_to_store`, RLS scoped to `auth.uid()`). A migration was written and the user applied it by hand in the Supabase SQL editor (this repo has no automated migration runner — every schema change in this project has gone through that same manual-apply pattern).
- **Session 6's Reddit/SDN scrape never happened.** Step 0 (source-compliance check) couldn't verify either platform's terms from primary sources, and found Reddit is actively suing Anthropic over a related (not identical) scraping pattern. The user chose to skip both sources rather than proceed on unverifiable footing — the session pivoted to first-party data instead. If a future session revisits scraping either source, don't assume this is a closed door — it's "unresolved," not "forbidden."
- **`premed/src/lib/*.ts` is fully browser-safe** (no `process.env`, no Node-only imports) — this is *why* session 7's dashboard could reuse the CLI's analysis functions directly in React with zero duplication. Only the *service-role-vs-anon-key* choice differs by call site, not the code.
- **4 archetype test accounts are real `auth.users` rows** in this (live, not disposable) Supabase project: `archetype-{grinder,flipped,balanced,climber}@premed.test`. Their live UUIDs are logged in the session 3 and session 7 handoffs — always resolve by email if reseeding, don't hardcode a UUID you haven't just verified.

## Loose end — needs the user's answer, not yet resolved
Session 7's live browser verification created a **real** `pm_profiles` row (GPA 3.65, MCAT 509, LA, grad 2027, 0 gap years) and one `pm_activities` row (`clinical_volunteer`, 120h completed / 50h planned) for the user's own real account (`crm2263@gmail.com`), while testing the intake form end-to-end. This was flagged explicitly in the session 7 handoff and in the final chat message, but the user has not yet said whether to keep or clear it. **Ask before touching it** — don't assume either way.

## Open items across all sessions (not started)
- **Auth wiring**: `src/pages/PremedPage.tsx`'s `DEV_USER_ID` is a hardcoded constant, not derived from the real logged-in session. This is the single most-flagged deferred item across sessions 3–7.
- No UI for session 6's `report-outcome` CLI (self-reported cycle results) — CLI-only still.
- `pm_school_stats` structurally can't back 7 of the 10 activity categories for live baselines (only 2 hours-shaped columns exist) — would need a schema change, out of scope every session so far.
- Bundle-size warning on `npm run build` (a pre-existing 1.2MB PDF worker chunk, unrelated to premed) — never addressed, not premed's problem to fix.
- 4 of 30 seeded schools have no scrapeable class-profile URL; 6 more have URLs that plain-fetch can't extract from (PDF/image/JS-rendered stats) — 10/30 will never get live school-stats data without a headless browser (explicitly out of scope) or manual entry.

## Env / secrets
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` all in `c:\Users\crm22\StudyOS\.env.local` (not committed, not reproduced here, no values appear anywhere in this conversation's chat text). Real spend this conversation: ~$0.10 total (session 5's Haiku+Sonnet school-stats extraction), pre-approved via explicit cost-gate prompts before any call.

## Suggested skills for the next session
- **`review`** — several judgment calls were made without a full grill (e.g. `createProfile`'s upsert-on-`user_id` design, the reach/target/safety fit-scoring thresholds in `school-comparison.ts`, the status-bucket boundary semantics in `activity-gap.ts`) — worth a pass before much more gets built on top of any of them.
- **`superpowers:verification-before-completion`** — the standing pattern every session in this conversation followed: typecheck, full test suite, and a *live* check (CLI smoke test or, from session 7 on, an actual browser session) before claiming anything done. Session 7's real bug (a data-loading race condition) was only caught by the live browser check, not by tests — don't skip that step for UI work.
- If continuing the dashboard: **`frontend-design`** is available but wasn't invoked this session (the existing Tailwind/indigo design system was matched by observation, not redesigned) — only reach for it if asked to redesign rather than extend.
- If doing auth wiring: no schema/RLS changes should be needed — session 7's real-mode data flow already goes through the browser's normal anon-key client and real RLS policies; only the hardcoded user id needs to become dynamic.
