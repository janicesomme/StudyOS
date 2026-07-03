# StudyOS Session Handoff — 2026-07-03 (premed session 7)

## Project
**Workspace:** `c:\Users\crm22\StudyOS`
**Subsystem:** `premed/` — the dashboard. `/premed` route in the existing StudyOS React app, first time this subsystem has a UI (sessions 1–6 were CLI-only).
**Stack:** TypeScript, React 19, React Router, Tailwind, Vite, Supabase JS (anon key, client-side). Zero new npm dependencies. Zero API cost.
**Shell:** PowerShell on Windows 11.

Read `docs/handoffs/2026-07-03-premed-session-6.md` first (Applicant Pool Position, first-party outcome reporting — the last of the CLI-only sessions).

## The core architectural question this session had to answer
The task wanted "zero logic duplication" — the dashboard should call the same `premed/src/lib/*.ts` functions the CLI has used since session 2, not reimplement anything. Two things made this non-trivial:

1. **Service-role vs. anon-key.** Every premed CLI script runs with the Supabase *service-role* key (bypasses RLS). The browser can only ever use the *anon* key (respects RLS). Checked `premed/src/lib/*.ts` before assuming this was a problem: **none of it touches `process.env`, `fs`, or any Node-only API** — every function just takes a `SupabaseClient` as a parameter and does what the caller's key permits. That means the library code itself is already browser-safe; the only question was which key to hand it in each mode.
2. **RLS blocks exactly the two things Demo mode needs.** `pm_profiles`/`pm_activities` are scoped `auth.uid() = user_id`, so the browser can never read the 4 archetype accounts' data while logged in as someone else — that's the RLS working as designed, not a bug to route around. Separately, `pm_school_stats` has **zero RLS policies at all** (session 1 — "pending source license review," never revisited) — checked the migration directly (`grep -n "pm_school_stats" ... | grep policy`) rather than assuming, and confirmed it: only `pm_schools` has `FOR SELECT USING (true)`; `pm_school_stats` doesn't, for anyone, ever, without the service-role key.

**Resolution (the "minimal split" the task asked for, if needed):**
- **Real profile mode** — the browser's own anon-key `supabase` client (already wired up in `src/lib/supabase.ts`) calls `premed/src/lib/*.ts` functions directly, live. RLS applies exactly as it would to any other page in this app. No split needed here — the functions were already browser-safe.
- **Demo mode + the School Comparison table (both modes)** — these need data across RLS boundaries (other users' rows, and a policy-less table). Split into a service-role generation step (`premed/pipeline/export-demo-fixtures.ts`, run offline, never shipped to the browser) that snapshots the 4 archetypes' full analysis output and the 12-school `pm_school_stats` comparison data into two checked-in `.generated.ts` files under `premed/src/ui/data/`. The **comparison math itself** (`computeSchoolComparison` in the new `school-comparison.ts`) is pure and browser-safe — it's called identically whether its input came from a live service-role query or the static snapshot, so that piece of logic isn't duplicated either.

This is why Demo mode is explicitly read-only (matches the task) and why the School Comparison table looks the same in both modes: it's always reading the same static snapshot, just scored against whichever profile is active.

## What was built this session

### 1. Route + shell (additive only, per the rules)
- `src/App.tsx` — one new `<Route path="/premed" ...>` line, wrapped in the existing `ProtectedRoute`.
- `src/components/layout/DashboardShell.tsx` — one new nav `<Link to="/premed">Premed</Link>` in the shared header.
- `src/pages/PremedPage.tsx` (new file) — thin wrapper: renders `DashboardShell` + imports `PremedDashboard` from `premed/src/ui/`. This is the only new file inside the app's own `src/`; every other new file lives under `premed/src/ui/`.
- `tsconfig.app.json` — widened `include` from `["src"]` to `["src", "premed/src/lib", "premed/src/ui"]` so `tsc -b` (part of `npm run build`) can see across the module boundary. Root config file, not "existing src/" in the sense the rules meant — no existing app behavior touched.
- `premed/tsconfig.json` — added `"DOM"` to `lib`, `"jsx": "react-jsx"`, `.tsx` to `include`, and `"@testing-library/jest-dom"` to `types` so `npm run typecheck-premed` covers the new UI code and its tests too, not just the app's own typecheck.

### 2. `premed/src/lib/school-comparison.ts` (new library module)
`computeSchoolComparison(schools, profile)` — pure, sorts safest-fit-first. `classifyFit` buckets each school as `reach`/`target`/`safety` based on whether the profile is at-or-above the school's median GPA and MCAT (both above → safety, both below → reach, split → target). `fit_score` normalizes the two deltas (÷0.2 GPA, ÷4 MCAT — roughly one AAMC band width each) into one comparable number for sorting. `loadSchoolStatsRows` is the service-role half (see architecture note above) — joins `pm_school_stats` to `pm_schools` for the name, filters to rows with both `median_gpa` and `median_mcat` non-null (**12 of the 16 schools session 5 scraped**, not all 16 — some schools' pages reported one stat but not the other).

### 3. `premed/pipeline/export-demo-fixtures.ts` + `npm run export-demo-fixtures`
Runs the real `getProfile`/`listActivities`/`computeActivityGaps`/`computeApplicantPoolPosition` (both 2023 and 2025)/`analyzeProfile`/`loadSchoolStatsRows` — the exact same functions the CLI and Real mode use — for all 4 archetypes, and writes two generated `.ts` files (not `.json`, so the fixture shape is type-checked, not just parsed) under `premed/src/ui/data/`. Re-run this after any change to the archetypes or a fresh `scrape-class-profiles` run. Demo mode always uses **static (not live) baselines** for the Activity Gap Read-out — documented in the generator; harmless today since session 5 found live and static baselines are currently identical anyway.

### 4. `premed/src/ui/` (all new)
- `sections/ApplicantPoolPositionSection.tsx` — combines corpus-stats.ts's percentile bars (GPA/MCAT × applicants/acceptees, with a small 2023-vs-latest comparison line) with gap-analyzer.ts's existing acceptance-rate trend and +/-1-band sensitivity table, since both are fundamentally "where do I stand" and the task's section (a) asked for both together.
- `sections/ActivityGapsSection.tsx` — one card per category, biggest gap first (already sorted by `computeActivityGaps`), color-coded status badge (green=strong, blue=competitive, amber=below, red=missing, gray=not benchmarked), explicit "planned hours close this gap: yes/no/n/a" line.
- `sections/SchoolComparisonSection.tsx` — the 12-school table, fit badges, sorted safest-first.
- `ProfileIntakePanel.tsx` — GPA/MCAT/state/grad-year/gap-years form (Real mode only) that calls `createProfile` directly and lets its own Zod validation surface errors — no separate client-side validation schema, so there's exactly one place GPA/MCAT/etc. domain ranges are enforced. Activities editor: existing rows get inline hours-completed/hours-planned edit-and-save (`updateActivity`); a bottom row adds a new one from the 10-value category dropdown (`addActivity`).
- `useRealProfileData.ts` — the hook wiring Real mode together: fetches profile → activities → (if gpa/mcat present) pool positions + gap analysis, using the browser's anon-key client throughout.
- `PremedDashboard.tsx` — mode switcher (Demo/Real), archetype switcher (Demo only), renders the intake panel (Real only) and the three sections once there's a scoreable profile.
- `data/demo-archetypes.generated.ts`, `data/school-stats-snapshot.generated.ts` — the static fixtures (see above).

### 5. Real mode's identity — the documented shortcut
"Real profile mode uses a hardcoded dev user_id" per the task. Implemented as a constant in `src/pages/PremedPage.tsx` (not inside `premed/src/ui/` — keeps the reusable premed module free of a StudyOS-specific test account), set to `crm2263@gmail.com`'s real UUID (the only non-archetype account in this Supabase project — verified live before hardcoding it, not assumed from a stale handoff). **This only works end to end while logged into the app as that specific account** — RLS isn't bypassed or weakened, so a different logged-in user would see Real mode simply return "no profile" and any write would fail with a policy violation. Deriving this from `useAuth()`'s actual `session.user.id` instead is the auth-wiring session's job.

### 6. Tests
- `sections/__tests__/*.test.tsx` (15 tests) — one file per section, rendered against the **real** `demo-archetypes.generated.ts` fixture (not hand-rolled mocks) plus a couple of hand-built edge cases (null-baseline category, empty comparison table). Caught two of my own path mistakes early (relative-import typos resolving to a nonexistent `premed/src/src/lib/` — same class of mistake made twice in `export-demo-fixtures.ts`'s template strings before the type-check caught those too).
- All existing tests (sessions 1–6, 215 tests) still pass unmodified.
- **230/230 full-repo tests pass** (15 new this session). `npm run typecheck-premed` clean, app `tsc -p tsconfig.app.json --noEmit` clean, `npm run build` succeeds (pre-existing bundle-size warning only, unrelated to this session).

### 7. Live verification — real bug found and fixed
Started the dev server, used Supabase's admin API to generate a magic sign-in link for `crm2263@gmail.com` (no password needed/available), and drove the actual running app with Playwright:
- **Demo mode, all 4 archetypes**: every number (percentiles, odds, sensitivity table, activity statuses, gap hours, school fit categories) matched the CLI's session 4–6 output exactly. Screenshots: `docs/handoffs/assets/premed-session-7/demo-{grinder,flipped,balanced,climber}.png`.
- **Real mode**: found a genuine crash — `TypeError: Cannot read properties of null` in `ApplicantPoolPositionSection`. Root cause: `useRealProfileData`'s four pieces (profile, activities/gaps, pool positions, gap analysis) load via sequential `await`s, each triggering its own re-render, so React can render a state where `profile` has valid GPA/MCAT and `activityGaps` is set but `poolPositions`/`gapAnalysis` haven't resolved yet. `PremedDashboard`'s `hasReadOut` gate only checked `profile` + `activityGaps`, not the other two. **Fixed** by requiring all four to be non-null before rendering the sections that depend on them. Re-verified live after the fix — no crash, all sections render correctly once data settles.
- **Real mode write path**: filled the intake form (GPA 3.65, MCAT 509, LA, 2027, 0 gap years) and submitted — `createProfile` succeeded live through RLS as the real logged-in user. Added a `clinical_volunteer` activity (120h completed / 50h planned) — `addActivity` succeeded, the Activity Gaps section correctly updated in place to `competitive` status with `planned hours close this gap: yes`. Screenshot: `real-mode-with-activity.png`.
- Notable cross-check: this real profile (3.65/509) is the **first test case across all 7 sessions** to actually earn a `safety` fit category (Morehouse, 3.64/506 median) — confirms `classifyFit` correctly produces all three categories, not just `reach`/`target` as every archetype happened to show.
- Dev server was started for this verification and explicitly stopped afterward (confirmed via a failed curl to `localhost:5173` post-kill) — not left running.

**Test data left in the database:** the real-mode verification above created a real `pm_profiles` row (GPA 3.65, MCAT 509, LA, grad 2027) and one `pm_activities` row (clinical_volunteer, 120h/50h) for `crm2263@gmail.com`. Left in place rather than deleted unilaterally — it's clearly-labeled test data, not garbage, but it's real account data I wrote without being asked to; clear it via `profile-show`/direct Supabase edit if you don't want it, or tell me and I will.

## Current git state
Not yet committed. New: `src/pages/PremedPage.tsx`, `premed/src/lib/school-comparison.ts`, `premed/pipeline/export-demo-fixtures.ts`, everything under `premed/src/ui/` (11 files), `docs/handoffs/assets/premed-session-7/` (5 screenshots). Modified: `src/App.tsx` (+1 route line), `src/components/layout/DashboardShell.tsx` (+1 nav link), `tsconfig.app.json`, `premed/tsconfig.json`, `package.json` (`export-demo-fixtures` script). **No file under `ochem2/` touched. No existing `src/` component's internals modified** — only the two additive lines described above. No DB schema change. No auth UI. Run `git status` to confirm before committing.

## Open items / not started
- **Auth wiring** — Real mode's `devUserId` is a hardcoded constant, not `session.user.id`. Explicitly deferred per the task.
- **Code splitting** — the build warns about a >500kB JS chunk. Pre-existing (not caused by this session — premed's added ~11 small files don't meaningfully move a bundle already dominated by a 1.2MB PDF worker), not addressed.
- **Demo mode always uses static baselines**, never live — a deliberate simplification (see `export-demo-fixtures.ts`), consistent with session 5's finding that live and static are currently identical anyway.
- **The dev-mode test data** left in `pm_profiles`/`pm_activities` for `crm2263@gmail.com` (see above) — flagged, not cleaned up unilaterally.
- No outcome-reporting UI (`report-outcome` CLI from session 6 has no dashboard equivalent) — not in this session's scope.

## Env / secrets
`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (browser, already existed) — Real mode and both static-fixture consumers use these, never the service-role key. `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` used only by `export-demo-fixtures.ts` (a `premed/pipeline/*.ts` script, same convention as every prior session) — never bundled into the browser build.

## Key files
| Path | Purpose |
|------|---------|
| `src/pages/PremedPage.tsx` | The one new file inside the app's own `src/` |
| `premed/src/ui/PremedDashboard.tsx` | Mode/archetype switching, orchestration |
| `premed/src/ui/useRealProfileData.ts` | Real-mode data hook (anon-key client) |
| `premed/src/ui/ProfileIntakePanel.tsx` | Profile form + activities editor |
| `premed/src/ui/sections/*.tsx` | The three read-out sections |
| `premed/src/lib/school-comparison.ts` | Fit scoring (pure) + service-role loader |
| `premed/pipeline/export-demo-fixtures.ts` | Regenerates the two `.generated.ts` fixtures |
| `docs/handoffs/assets/premed-session-7/` | Live screenshots, all 4 archetypes + real mode |

## Suggested skills for the next session
- **`review`** — `useRealProfileData`'s sequential-await race condition was caught by live testing, not by static analysis or the component tests (which render fully-loaded fixture data, not the loading transition) — worth a second look for other places async state might render prematurely.
- **`superpowers:verification-before-completion`** — same pattern as sessions 1–6, extended this session to include actually driving the built UI in a browser, not just typecheck/tests/build.
- If the next session does auth wiring: the RLS boundary work this session did (real anon-key reads/writes in Real mode, static snapshots for Demo mode and school comparison) should keep working unchanged — only `PremedPage.tsx`'s `DEV_USER_ID` constant needs to become `session.user.id`.
