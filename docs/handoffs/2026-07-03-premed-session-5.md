# StudyOS Session Handoff — 2026-07-03 (premed session 5)

## Project
**Workspace:** `c:\Users\crm22\StudyOS`
**Subsystem:** `premed/` — class-profile scraper feeding `pm_school_stats`, plus a static/live baseline swap for the Activity Gap Read-out.
**Stack:** TypeScript, Zod, `@supabase/supabase-js`, `@anthropic-ai/sdk`, `jsdom` (new devDependency: `@types/jsdom`), vitest.
**Shell:** PowerShell on Windows 11.

Read `docs/handoffs/2026-07-03-premed-session-4.md` first (Activity Gap Read-out, hardcoded baselines). This session builds the "live" counterpart.

## Two real constraints surfaced before writing code — read these first

**1. `pm_school_stats`' real UNIQUE constraint is `(school_id, cycle_year)`, not `(school_id, cycle_year, source)`.** The task scoped the upsert key as the latter, but the migration (checked before writing any upsert logic) only has the former — and no separate `source_url` column exists either. No schema changes in scope this session, so `upsertSchoolStats` upserts on the real constraint (`school_id,cycle_year`) and folds the source URL into the single `source` text column as `class_profile:<url>`. Practical effect: a second future data source for the same school+cycle_year would overwrite this pipeline's row. Harmless today (`class_profile` is the only source ever written), but worth remembering if a future session adds MSAR or another source.

**2. `pm_schools` has no UNIQUE constraint on `name`.** Same situation as `pm_activities` in session 3 — idempotency for `seed-schools.ts` had to be application-level (find-by-name, then update-or-insert), not a DB-level upsert.

Neither blocked progress — both are documented workarounds consistent with how this codebase has handled the same category of surprise twice before.

## What was built this session

### 1. `premed/pipeline/seed-schools.ts` — 30-school seed
Researched live (parallel web research across 3 groups of 10) rather than assumed from memory: official name, state, public/private, 2-4 mission keywords, class size, and each school's real "entering class profile" URL. `class_size` is `null` wherever sources conflicted or nothing was confirmed on an official page — never a guessed number. 4 of 30 schools (University of Florida, University of Colorado, Meharry, New York Medical College) have no confirmed class-profile URL, so they're seeded with basic info but never queued for scraping.

Idempotent via `ensureSchool` (find-by-name, update-or-insert — see constraint #2 above). Verified live: ran twice, 30 rows both times, same IDs.

### 2. `premed/pipeline/scrape-class-profiles.ts` + supporting `src/lib` modules
- **`premed/src/lib/robots.ts`** — minimal robots.txt parser (`Disallow` rules for `User-agent: *`), pure/testable.
- **`premed/src/lib/school-stats-extraction.ts`** — `ExtractedSchoolStatsSchema` (Zod, every field nullable, same domain ranges as the DB CHECK constraints), `htmlToText` (jsdom-based, strips script/style/nav/footer/header), `truncateForExtraction` (10,000-char cap — bounds cost, admissions stats live in the first few thousand chars of these pages), `estimateTokens`, `buildExtractionPrompt` (explicitly instructs "null if not stated... never estimate, infer, or carry over a number from general knowledge").
- **`premed/src/lib/school-stats-store.ts`** — `loadSchoolIdMap`, `upsertSchoolStats` (constraint #1 above).
- **`scrape-class-profiles.ts`** — orchestration: `discoverQueue()` (robots.txt check + plain `fetch()`, zero API cost) always runs first; `printPlan()` prints exact pages queued / model / estimated tokens / estimated cost / hard cap and **exits without calling any API unless `--go` is passed**. Two phases, each with its own gate: `--phase=haiku` (default) and `--phase=sonnet-retry` (reads a `premed/source-data/scrape-retry-queue.json` artifact — gitignored — written by the haiku phase listing schools where extraction found nothing usable; the retry phase re-fetches just those pages and prints its own separate cost estimate requiring its own separate `--go`). A hard $5 budget cap is checked before every single API call (`runningCost() + estimatedNextCallCost`), not just once at the start — the run would abort mid-loop if projected spend ever exceeded it.

### 3. Cost gate — followed exactly as specified, twice
Per this session's non-negotiable rule, presented the exact plan (pages queued, model, estimated tokens, estimated cost) to the user via `AskUserQuestion` before either phase and did not proceed without an explicit "Go":
- **Haiku phase**: 22/30 schools fetched successfully (4 had no confirmed URL, 4 failed to fetch — 3× HTTP 403 bot-blocking on Johns Hopkins/Michigan/UW, 1× HTTP 404 stale Loyola URL). Estimated $0.0235. User approved. **Actual: $0.0439**, 16 upserted, 6 flagged low-quality (all-null extraction).
- **Sonnet retry phase**: 6 schools re-queued. Estimated $0.0248. User approved separately. **Actual: $0.0526** — all 6 still came back all-null even with the stronger model.
- **Total spend: $0.0965**, far under the $5 cap. Every dollar was pre-approved before being spent.

The 6 that failed both passes (Harvard, Stanford, Vanderbilt, LSU New Orleans, UNC, GWU) match what the session's own school-research notes flagged earlier: several of these schools' stats live in a linked PDF or an image/infographic, not in the raw page HTML — no model can extract text that was never fetched. This is a known limitation of "plain fetch, no headless browser" (explicitly required this session), not an extraction-quality bug.

### 4. Live vs. static baseline swap — `premed/src/lib/baselines-live.ts`
- New shared `BaselineProvider` type in `baselines.ts` (`{ getBaseline, getAllBaselines }`) plus `staticBaselineProvider` wrapping the existing hardcoded constants.
- `createLiveBaselineProvider(supabase)` derives `competitive` as the median of a mapped `pm_school_stats` column across schools with non-null data (minimum 3 schools, else fall back to static); `floor` is **always** retained from the static baseline — school-reported medians describe competitive applicants, not a "meaningful minimum" concept, so there's no live analog to derive a floor from.
- **A third, more fundamental constraint discovered here**: `pm_school_stats` has exactly two hours-shaped columns — `median_clinical_hours` and `median_research_hours` — for all 10 activity categories. `clinical_volunteer` and `clinical_paid` both have to map to the single `median_clinical_hours` column (the schema doesn't distinguish paid vs. volunteer clinical hours); `research` maps to `median_research_hours`; the other 7 categories (`nonclinical_volunteer`, `shadowing`, `leadership`, `teaching`, `publication`, `extracurricular`, `other`) have **no possible live column at all**, regardless of how much scraping ever happens, without a schema change. `publication` additionally can't be backed by `pct_with_publications` even though that column exists — it's a percentage, not an hours metric, a different unit entirely. This isn't "sparse data now, more later fixes it" — it's a structural ceiling on what this table can ever answer. Documented in code comments; the fallback-to-static behavior already required by the task absorbs this correctly, so no code changed by discovering it, but it's worth knowing before anyone builds further on `pm_school_stats` assuming it can eventually cover all 10 categories.
- `computeActivityGaps(activities, provider = staticBaselineProvider)` in `activity-gap.ts` now takes an optional injected provider — fully backward compatible, every existing call site keeps static behavior unchanged.
- `profile-cli.ts show` gained `--baselines live|static` (defaults to `static`), invalid values rejected with a clean error.

### 5. Live result: `--baselines live` currently equals `--baselines static`, for a real reason
After the scrape, **every one of the 16 successfully-scraped schools has `median_clinical_hours: null` and `median_research_hours: null`** — these school pages report GPA/MCAT/in-state%/gap-year% prominently but essentially never publish applicant activity-hour medians on their own site (that data typically lives in AAMC/MSAR aggregates instead, not individual school admissions pages). Verified live for all 4 archetypes: `profile-show --baselines static` and `profile-show --baselines live` produce **byte-identical** gap read-out sections (only the `(baselines: live|static)` header line differs) — confirmed with a diff, not just inferred. This is the swap infrastructure working exactly as designed (correct fallback when live data is sparse — here, zero) against real data, not a bug. Full grinder `--baselines live` output:

```
=== Activity Gap Read-out === (biggest gaps first)
  clinical_paid            you=0h (planned +0h)  baseline: floor=150h competitive=300h
    status=missing  gap-to-competitive=300h  planned hours close this gap: no
    note: Paid clinical roles (EMT/scribe/CNA) run higher than volunteer hours since they are employment; 300h+ is the widely-cited competitive range.
  nonclinical_volunteer    you=0h (planned +0h)  baseline: floor=50h competitive=100h
    status=missing  gap-to-competitive=100h  planned hours close this gap: no
  leadership               you=0h (planned +0h)  baseline: floor=40h competitive=100h
    status=missing  gap-to-competitive=100h  planned hours close this gap: no
  shadowing                you=0h (planned +0h)  baseline: floor=40h competitive=75h
    status=missing  gap-to-competitive=75h  planned hours close this gap: no
  clinical_volunteer       you=150h (planned +0h)  baseline: floor=100h competitive=150h
    status=strong  gap-to-competitive=none (met/exceeded)  planned hours close this gap: n/a
  research                 you=400h (planned +0h)  baseline: floor=150h competitive=400h
    status=strong  gap-to-competitive=none (met/exceeded)  planned hours close this gap: n/a
  teaching / publication / extracurricular / other:  status=not benchmarked (unchanged from session 4)
```
(identical for flipped/balanced/climber — see raw run output if needed, not pasted here to keep this doc scannable)

### 6. Tests
- `robots.test.ts` (7), `school-stats-extraction.test.ts` (16 — schema validation with fixture HTML, `isLowQualityExtraction`, `htmlToText` fixture stripping, truncation, token estimate), `school-stats-store.test.ts` (5 — insert, upsert idempotency on the real compound key, different-cycle-year creates a second row not a conflict, `cycle_year: null` hard-fails), `baselines-live.test.ts` (9 — enough-data median derivation, floor retention, sparse-data fallback, zero-data fallback, no-mapped-column categories always static, `publication` always static, `getAllBaselines` mixed live/static), `seed-schools.test.ts` (5 — insert, idempotency, exactly 30 schools, no duplicate names, every URL is real-or-null never guessed), plus one new test in `activity-gap.test.ts` proving `computeActivityGaps` actually uses an injected live provider end-to-end.
- Fixed `fake-supabase.ts`'s `upsert` to support compound (`"col1,col2"`) conflict keys, not just single columns — needed for `pm_school_stats`' real constraint; verified this didn't break the single-column upsert test already used by `profiles.test.ts`.
- All existing tests (sessions 1–4, 146 tests) still pass unmodified.
- **190/190 full-repo tests pass** (44 new this session). Typecheck (`npm run typecheck-premed`) clean.

## Current git state
Not yet committed. New: `premed/pipeline/seed-schools.ts`, `premed/pipeline/scrape-class-profiles.ts`, `premed/src/lib/robots.ts`, `premed/src/lib/school-stats-extraction.ts`, `premed/src/lib/school-stats-store.ts`, `premed/src/lib/baselines-live.ts`, 6 new test files. Modified: `premed/src/lib/baselines.ts` (`BaselineProvider` type), `premed/src/lib/activity-gap.ts` (optional provider param), `premed/pipeline/profile-cli.ts` (`--baselines` flag), `premed/src/lib/__tests__/fake-supabase.ts` (compound upsert keys), `package.json`/`package-lock.json` (new scripts + `@types/jsdom` devDependency), `.gitignore` (retry-queue artifact). No file under `ochem2/` or existing `src/` touched. No DB schema change. Run `git status` to confirm before committing.

## Open items / not started
- No UI — still CLI-only.
- 4 schools have no scrapeable URL (Florida, Colorado, Meharry, NYMC) and 6 more have URLs that plain-fetch can't extract data from (PDF/image/JS-rendered stats) — 10/30 schools will never get live data without either a headless browser (explicitly out of scope) or manual data entry.
- `pm_school_stats` structurally cannot back 7 of the 10 activity categories (see finding #4 above) without a schema change — flagged, not solved, since schema changes are out of scope this session.
- `median_clinical_hours`/`median_research_hours` are currently 100% null across all scraped schools — the live baseline provider is fully built and tested but has no real numeric effect on any archetype's read-out yet. It would activate the moment 3+ schools' `median_clinical_hours` or `median_research_hours` get populated from some future source.
- `--phase=sonnet-retry` can be re-run any time the retry-queue file is non-empty; it's currently `[]` (all 6 retried, all still empty) so re-running it now would say "nothing to do."

## Env / secrets
`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` unchanged. `ANTHROPIC_API_KEY` (already present in `.env.local` from before this session) used for the first time this session — real spend, $0.0965 total, both amounts pre-approved via explicit cost gates before any call was made.

## Key files
| Path | Purpose |
|------|---------|
| `premed/pipeline/seed-schools.ts` | 30-school seed data + `ensureSchool` |
| `premed/pipeline/scrape-class-profiles.ts` | Scraper orchestration, cost gates, 2 phases |
| `premed/src/lib/robots.ts` | robots.txt parser |
| `premed/src/lib/school-stats-extraction.ts` | Extraction schema, HTML cleanup, prompt |
| `premed/src/lib/school-stats-store.ts` | `pm_school_stats` upsert (real constraint) |
| `premed/src/lib/baselines-live.ts` | Live `BaselineProvider`, fallback logic |
| `premed/src/lib/baselines.ts` | `BaselineProvider` type + static provider (session 4, extended this session) |
| `premed/pipeline/profile-cli.ts` | `show` now takes `--baselines live\|static` |

## Suggested skills for the next session
- **`review`** — the two "real constraint" workarounds (compound-key-that-isn't, application-level idempotency) are exactly the kind of thing worth a second look before a future session builds further on `pm_school_stats`.
- **`superpowers:verification-before-completion`** — same pattern as sessions 1–4.
- If a future session wants live baselines to actually diverge from static: it needs either a different data source that reports activity-hour medians directly (AAMC's own aggregate publications, not individual school sites) or a schema change to let `pm_school_stats` carry per-category hour columns — both explicitly out of scope this session, both real prerequisites for this feature's numbers to ever move.
