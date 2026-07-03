# StudyOS Session Handoff — 2026-07-03 (premed session 4)

## Project
**Workspace:** `c:\Users\crm22\StudyOS`
**Subsystem:** `premed/` — Activity Gap Read-out, built on the profile persistence layer from session 3.
**Stack:** TypeScript, Zod, `@supabase/supabase-js`, vitest — no new dependencies. `WebSearch` used once this session for research grounding (see below), no paid API calls.
**Shell:** PowerShell on Windows 11.

Read `docs/handoffs/2026-07-03-premed-session-3.md` first (profile/activity persistence, the 4 seeded archetypes and their live UUIDs). This doc assumes it.

## What was built this session

### 1. `premed/src/lib/baselines.ts` — hardcoded, cited competitive/floor hour baselines
Before writing any numbers, ran 5 live web searches to ground each figure in an actual citable source rather than asserting from memory (the task explicitly asked for "research-grounded values with source cited"). Findings, condensed:

| category | competitive | floor | source (see file for full citations) |
|---|---|---|---|
| clinical_volunteer | 150h | 100h | premed advising consensus (JackWestin/Leland/Blueprint, 2026) |
| clinical_paid | 300h | 150h | International Medical Aid / advising consensus, 2026 |
| nonclinical_volunteer | 100h | 50h | JackWestin / UConn Pre-Health Advising |
| research | 400h | 150h | Leland/Med School Insiders — "400-800h competitive range" |
| shadowing | 75h | 40h | MedEdits "75-1-3 rule" |
| leadership | 100h | 40h | Inspira Advantage / Shemmassian Consulting |
| teaching | **null** | **null** | no widely-cited hour figure exists — search confirmed this explicitly |
| publication | **null** | **null** | a publication is a discrete achievement/count, not an hours metric |
| extracurricular | **null** | **null** | too heterogeneous a catch-all; advising sources are explicit there's no set-hours norm |
| other | **null** | **null** | undefined catch-all by definition |

Notable finding surfaced by the research: AAMC's own 2024 AMCAS Cycle Infographic reports matriculants averaging **~1,505 research hours** — far above the 400h "competitive" figure used here. That average is real but not usable as a baseline: it's pulled up by MD-PhD applicants, students at research-heavy institutions, and full-time gap-year research roles. Documented this explicitly in the `research` baseline's comment so a future reader doesn't "correct" the number toward the AAMC average without understanding why it was deliberately not used.

**Design for future swap-out** (explicit task requirement): `getBaseline`/`getAllBaselines` are `async` even though they're backed by a plain in-memory constant today. This is deliberate — a synchronous interface would force every caller to change when a future session swaps the source to a `pm_school_stats` (or similar) query, since a real DB call can't be synchronous. Making it async now means that swap only touches this file's function bodies.

### 2. `premed/src/lib/activity-gap.ts`
- `computeActivityGaps(activities)` — sums `hours_completed`/`hours_planned` per category (a user can log multiple activities in the same category), scores all 10 categories against their baseline, returns them sorted biggest-gap-first.
- **Status uses exactly the 2 given thresholds, no invented third number**: `0h → missing`, `(0, floor) → below`, `[floor, competitive) → competitive`, `[competitive, ∞) → strong`. `null` when the category has no baseline. This mapping (not stated in the task) was the natural reading of "status: strong/competitive/below/missing" given only two threshold numbers per category — documented inline so it's not ambiguous to a future reader.
- `gapToCompetitive`: hours still needed to reach `competitive`; `0` once met/exceeded; `null` if no baseline.
- `plannedClosesGap`: `true`/`false` once there's a real gap to close; `null` when there's no baseline **or** the gap is already `0` (nothing left to close — "does planned close the gap" isn't a meaningful yes/no once the gap doesn't exist).
- Ordering: numeric gaps descending; categories with `gapToCompetitive === null` (no baseline) sort last, in category-enum order (stable sort, verified by test).

### 3. `profile-cli.ts show` extended + `report.ts` gap printer
Added `printActivityGaps` to `report.ts` (category, your hours + planned, baseline, status, gap, and the literal "planned hours close this gap: yes/no/n/a" line, plus the baseline's source note) and wired it into `cmdShow` between the activities table and the Gap Analyzer section. Only `profile-cli.ts show` was touched — `seed-archetypes.ts`'s own printout was deliberately left alone (out of this session's stated scope, even though it reuses the same `report.ts` module and could trivially pick this up later).

### 4. Tests
- `premed/src/lib/__tests__/activity-gap.test.ts` (19 tests): baseline coverage (all 10 categories present, exactly the 4 expected categories have `null`, `floor <= competitive` for every real baseline), `computeStatus` boundary tests (below/at/above both `floor` and `competitive`), `computeGap` edge cases (zero hours, planned-exactly-closes-the-gap, planned-falls-short, already-met-so-gap-is-0-and-plannedClosesGap-is-null, no-baseline), and `computeActivityGaps` integration (multi-activity summing, all-10-categories-present-even-with-zero-activities, ordering with a real tie-break check, null-baseline categories retain logged hours but score `null`).
- All existing tests (sessions 1–3, 67 tests) still pass unmodified.
- **86/86 premed tests pass. 146/146 full-repo tests pass** (no regressions). Typecheck (`npm run typecheck-premed`) clean.

### 5. Live verification against all 4 seeded archetypes
Ran `npm run profile-show -- --user <id>` for all 4 archetypes from session 3 (UUIDs in that handoff). Every read-out matched the archetype's intended story:

- **grinder** (clinical_volunteer 150h, research 400h) → both `strong` (exactly at competitive), everything else `missing`, led by `clinical_paid` (300h gap).
- **flipped** (clinical_paid 800h, research 50h) → `clinical_paid` `strong`, `research` `below` (350h short of competitive — the intended "flipped" weak spot), led by that 350h research gap.
- **balanced** (clinical_volunteer 200h, research 200h, nonclinical_volunteer 100h) → `clinical_volunteer`/`nonclinical_volunteer` `strong`, `research` `competitive` (200h, short of 400h competitive but past the 150h floor), missing `clinical_paid`/`leadership`/`shadowing`.
- **climber** (clinical_paid 2000h, leadership 300h) → both `strong`, led by a 400h `research` gap (completely missing) — matches the "gap years, heavy paid clinical work, no research" persona.

Full captured output for `grinder` (representative; the other 3 follow the same shape) is in this doc's git history / can be reproduced live via `npm run profile-show -- --user 64620492-5eac-4111-86c2-210774b5f001` — not pasted in full here to keep this doc scannable; the summary table above is the load-bearing result.

## Current git state
Not yet committed. Changed/new since the last commit (`46cf254`):
- Modified: `premed/pipeline/profile-cli.ts` (gap read-out wired into `show`), `premed/pipeline/report.ts` (`printActivityGaps` added)
- New: `premed/src/lib/baselines.ts`, `premed/src/lib/activity-gap.ts`, `premed/src/lib/__tests__/activity-gap.test.ts`, `docs/handoffs/2026-07-03-premed-session-4.md`

No file under `ochem2/` or existing `src/` touched. No DB schema change, no UI, no scraper — matches this session's explicit rules. Run `git status` to confirm before committing.

## Open items / not started
- No DB-level backing for baselines (by design — constants file, swap-out path documented above).
- `teaching`/`publication`/`extracurricular`/`other` have no gap read-out signal at all beyond "hours logged, not benchmarked" — if a future session wants to score these differently (e.g., publication count as a discrete 0/1/2+ scale instead of hours), that's a different data model, not an extension of this one.
- No UI — this is still a CLI-only, terminal-report subsystem.
- The activity category enum still has no DB `CHECK` constraint (flagged in session 3's handoff, still true).

## Env / secrets
`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, unchanged. This session additionally used `WebSearch` for baseline research — no API keys or paid calls involved (it's a harness tool, not billed against the project).

## Key files
| Path | Purpose |
|------|---------|
| `premed/src/lib/baselines.ts` | Cited hour baselines per category, async `getBaseline`/`getAllBaselines` |
| `premed/src/lib/activity-gap.ts` | `computeActivityGaps` — status/gap/ordering logic |
| `premed/src/lib/__tests__/activity-gap.test.ts` | 19 tests — baseline coverage, thresholds, gap math, ordering |
| `premed/pipeline/report.ts` | `printActivityGaps` added this session |
| `premed/pipeline/profile-cli.ts` | `show` now includes the gap read-out section |

## Suggested skills for the next session
- **`review`** — the status-bucket mapping (`[floor, competitive) → "competitive"`, `>= competitive → "strong"`) was an inference from an underspecified task, not something explicitly confirmed with the user; worth a sanity check before anyone builds UI copy or messaging on top of these exact labels.
- **`superpowers:verification-before-completion`** — same pattern as sessions 1–3: typecheck, full premed suite, full-repo suite, live CLI smoke tests against real seeded data before claiming done.
- If the next session touches baselines further: re-run the same research pattern (live search, cite sources, explicit nulls over fake numbers) rather than assuming last session's numbers are still current — premed advising consensus figures do shift year to year.
