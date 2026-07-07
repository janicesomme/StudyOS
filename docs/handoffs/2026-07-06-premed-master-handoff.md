# Handoff — StudyOS `premed/` subsystem (2026-07-06, master handoff)

## Workspace
`c:\Users\crm22\StudyOS` (git repo, branch `master`). Windows 11, PowerShell, no WSL. Production deploy is live at `https://study-os-murex.vercel.app` (git-push-triggered via Vercel's GitHub integration — see session 11).

## Don't re-derive — read these first, in order
1. `docs/handoffs/2026-07-02-premed-session-1.md` — original foundation (migration, schemas, ingest pipeline). Stale on `pm_facts_grid`'s exact shape — corrected same-day, see #2.
2. `docs/handoffs/2026-07-02-premed-session-bridge.md` — AAMC data-shape correction + git/verification state.
3. `docs/handoffs/2026-07-02-premed-session-2.md` — Gap Analyzer (`gap-analyzer.ts`, band mapping, +/-1 sensitivity).
4. `docs/handoffs/2026-07-03-premed-session-3.md` — profile/activity persistence (`profiles.ts`), 4 archetype test users seeded.
5. `docs/handoffs/2026-07-03-premed-session-4.md` — Activity Gap Read-out (`activity-gap.ts`, `baselines.ts`, cited hour norms).
6. `docs/handoffs/2026-07-03-premed-session-5.md` — class-profile scraper (`scrape-class-profiles.ts`), live/static baseline swap.
7. `docs/handoffs/2026-07-03-premed-session-6.md` — pivoted from a planned Reddit/SDN scrape to first-party outcome reporting (`outcomes.ts`) + national percentile positioning (`corpus-stats.ts`) after a step-0 compliance check couldn't clear either source.
8. `docs/handoffs/2026-07-03-premed-session-7.md` — the `/premed` dashboard (React UI) ships.
9. `docs/handoffs/2026-07-03-premed-master-bridge.md` — cross-session bridge through session 7; the traps not fully spelled out in any single doc above.
10. `docs/handoffs/2026-07-03-premed-session-8.md` — Committee Simulator essay critique engine, cost-gated Sonnet review, critique-only prose guard (originally 15-word cap — see session 12).
11. `docs/handoffs/2026-07-04-premed-session-9.md` — browser-native essay review via a Supabase Edge Function, red flags wired into the output schema.
12. `docs/handoffs/2026-07-04-premed-session-10.md` — `/premed` goes multi-user, `DEV_USER_ID` retired.
13. `docs/handoffs/2026-07-05-premed-session-11.md` — Vercel deploy. Production live at `study-os-murex.vercel.app`.
14. **Session 12 — this conversation, code complete, not yet fully closed out.** No standalone session-12 handoff exists yet (see "Current state" below for why) — `PLAN.md` + `PLAN-REVIEW-LOG.md` at repo root are the authoritative record of what was decided and why until that doc is written.

This doc exists to give a fresh agent (or a future session of this one) the cross-session shape and current status. Don't duplicate the docs above — read them for implementation detail.

## Current state (as of 2026-07-06)

**Sessions 1–11: complete, tested, committed, deployed.** Production is live at `https://study-os-murex.vercel.app`. 303 tests passing as of session 11's close.

**Session 12 (Rubric Calibration Benchmark + essay review render fixes): code complete, not yet live.**
- Locked via grill + 3 rounds of adversarial Codex review (`VERDICT: APPROVED`) — full argument trail in `PLAN-REVIEW-LOG.md`, final plan in `PLAN.md`.
- Built, TDD throughout: `pm_rubric_calibration` migration, `PmRubricCalibrationSchema`, `premed/src/lib/rubric-calibration.ts` (stats math), `premed/pipeline/calibrate-rubric.ts` (fetch + parse + score + persist, cost-gated), `PROSE_GUARD_MAX_WORDS` raised 15→40 (affects all essay reviews going forward, not just calibration), `EssayReviewSection.tsx` benchmark overlay + render restructuring.
- **326/326 tests passing, clean `tsc -b`, clean `eslint` on every file touched this session** (pre-existing lint errors in unrelated files were left alone — not this session's scope).
- **NOT YET DONE — these are step 1 tomorrow, in this order:**
  1. User applies `supabase/migrations/20260706000000_premed_rubric_calibration.sql` in the Supabase SQL editor.
  2. Post-migration verification: a service-role read (table exists) **and** an anon-key read (proves RLS actually grants the browser's access level, not just that the table exists) — both required before any frontend wiring is trusted.
  3. Cost-gated live calibration run (`npm run calibrate-rubric -- --go`, ~10 essays, estimate printed and user's explicit go required before any Anthropic spend — no spend has happened yet this session).
  4. Live UI verification: re-render one of the user's stored reviews with the benchmark overlay active, screenshot.
  5. Write the actual `docs/handoffs/2026-07-05-premed-session-12.md` (this master handoff is not a substitute for it — the session isn't done until the live run + UI verification actually happen).

## Locked roadmap (sessions 13–17)
1. **Session 13 — School List Builder.** AAMC FACTS Table A-1 ingest (applicants/matriculants by state, `pm_facts_state`), `premed/src/lib/school-list.ts` (reach/target/safety classification with in-state weighting), a fifth dashboard section, CLI.
2. **Session 14 — Annealing.** Spec lives in the strategy chat (see below) — not detailed in this repo yet.
3. **Session 15 — Four-Year OS.**
4. **Session 16 — Narrative Architect.**
5. **Session 17 — Simulator extensions.**

**Ready-to-fire prompts for sessions 13–16, the full session 14 annealing spec, and the session 17 spec all live in the strategy chat dated 2026-07-05 to 2026-07-06 — not in this repo.** A future session picking up sessions 14–17 needs that chat pulled up alongside this handoff; nothing here substitutes for it.

## Env / secrets
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` all in `c:\Users\crm22\StudyOS\.env.local` (not committed, no values reproduced in any handoff or chat). Production env vars (the two `VITE_` ones only) are set in the Vercel dashboard, not via CLI — see session 11.

## Real spend across sessions 1–12
~$0.12 total through session 11 (school-stats extraction + a handful of pre-approved live essay reviews), each pre-approved via explicit cost-gate prompts. **Zero spend so far in session 12** — the calibration run's ~10 Anthropic calls haven't happened yet, pending the user's migration-apply + go-ahead.

## Git state
Through session 11: everything committed and pushed to `origin/master`. Session 12's code (migration, new lib/pipeline files, `EssayReviewSection.tsx` changes, `PLAN.md`/`PLAN-REVIEW-LOG.md`, this handoff) is being committed and pushed as part of writing this doc — see the commit this same conversation turn produces for the exact hash.
