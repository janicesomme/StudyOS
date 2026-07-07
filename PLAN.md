# Plan: Session 12 — Rubric Calibration Benchmark + Essay Review Render Fixes
_Locked via grill — by Claude + Janice_

## Goal
Ground the Committee Simulator's 1-5 scores against a small set of real, published, accepted medical-school personal statements, and fix the essay-review UI so commentary renders at a usable length instead of mid-sentence-truncated. Concretely: a one-off pipeline scores ~10 published essays (essay-only mode, no student profile) and stores per-dimension scores (never essay text) in a new reference-tier table; the dashboard overlays that calibration range behind the user's own score bars; and a compliance-preserving prose-guard change stops commentary fields from clipping at 15 words.

## Approach

### 1. Source: single Crimson page, not multi-URL discovery
`https://www.thecrimson.com/topic/sponsored-successful-medical-essays-2019/` is confirmed (fetched with an honest, disclosed User-Agent per its robots.txt, which permits general crawlers — `ClaudeBot` specifically is disallowed sitewide but that's not the identity this pipeline uses) to be **one page containing all 10 essays inline**, each bounded by a `<strong>ESSAY</strong>` marker and a per-essay disclaimer paragraph — not an index of links. No discovery/crawl logic needed.

`premed/pipeline/calibrate-rubric.ts`:
- Fetches that one URL (respects robots.txt via the existing `premed/src/lib/robots.ts` check, same pattern as `scrape-class-profiles.ts`, custom `User-Agent: StudyOSPremedBot/1.0 (...)`).
- Parses with JSDOM (already a dependency, same as `school-stats-extraction.ts`'s `htmlToText`) rather than a raw string split. **Corrected after inspecting the actual page structure** (each block is richer than initially assumed): each of the 10 blocks is `<strong>ESSAY</strong>` → the applicant's own first-person essay paragraphs → `<strong>REVIEW</strong>` → The Crimson's own third-person editorial commentary → a disclaimer paragraph. The essay-only span is `ESSAY` → `REVIEW`, **not** `ESSAY` → disclaimer — the commentary/disclaimer span is Crimson's own writing, never sent to the API and never part of what's scored. Within that span, `<p>` elements wrapping a `.shortcodes-wrapper` div (a pull-quote that duplicates a sentence already in an adjacent paragraph) and the literal `___` divider paragraph are skipped — only the real essay paragraphs are concatenated.
- **Hard-fails if the parse doesn't find exactly 10 essay blocks** (not a soft >100-word skip-and-continue) — a wrong count means the split logic itself is broken, not that one essay happened to be short; better to stop and report than silently proceed on a miscount.
- Prints each block's label and word count before the cost-gate `--go` prompt, so a visibly wrong split (near-zero or absurdly large word count) is catchable by eye before spending money.
- Labels each block `crimson-2019-essay-01` .. `-10` (ordinal — the source HTML doesn't consistently name the applicant per block, so no reliable name-based label exists).
- `source_url` is the same URL for all 10 rows (accurate — that is where the content lives); `source_label` disambiguates.
- **No essay text or essay-derived substrings ever appear in console output or thrown-error messages** — only labels, word counts, and scores are logged. Errors during fetch/parse report the label/stage, never the text being processed.

### 2. Essay-only committee-simulator call
No changes needed to `committee-simulator.ts` — `reviewEssay(anthropic, model, { essay })` already supports essay-only mode (no `activitySummaries`, no `school` → 5 dimensions scored, `mission_fit` excluded, matching how the UI's optional-school behavior already works today).

### 3. Prose guard: raise the cap, keep the guard
`committee-simulator.ts`'s `PROSE_GUARD_MAX_WORDS` changes from **15 → 40**. This is the compliance guard against the model sneaking a full ghostwritten paragraph into a "challenge question" or "priority fix" — it stays in place, just wide enough that legitimate single-sentence commentary stops getting clipped mid-thought. Applies everywhere `reviewEssay()` is called (CLI script, Edge Function, and this session's calibration pipeline) — not a calibration-only change. Existing stored reviews in `pm_essay_reviews` keep their already-truncated text (data was saved that way; not retroactively fixed).

### 4. Scores-only persistence (hard rule, tested)
For each of the 10 calibration essays: call `reviewEssay()`, extract **only** `{ [dimension]: score }` pairs from `dimensionScores` into a plain object, and discard everything else from the response immediately — including `evidenceQuotes` (verbatim essay text) and all commentary fields (`challengeQuestion`, `strengths`, `priorityFixes`, `verdict`, `consistencyFlags`, `redFlags`), none of which are in the target schema anyway. The essay text itself lives only in a local variable for the duration of the API call, never written to a file, the DB, or a fixture.

### 5. New migration: `pm_rubric_calibration`
Reference-tier table, same RLS pattern as `pm_schools` (RLS enabled, single `SELECT USING (true)` policy, no INSERT/UPDATE/DELETE policy — writes only via the service-role key from the pipeline script). Columns exactly as specified: `id, source_label, source_url, rubric_version, scores jsonb, model, created_at`, plus a `UNIQUE (rubric_version, source_url, source_label)` constraint — closes the race an app-level pre-check alone can't (two concurrent runs both passing the "does it exist" check before either inserts). File: `supabase/migrations/<next-timestamp>_premed_rubric_calibration.sql`. User applies it manually in the Supabase SQL editor (no direct DB access from this session, consistent with every prior migration this project).

Idempotency: the pipeline still checks for existing rows first and skips with a printed notice unless `--force` is passed (avoids an obvious accidental double-spend before even trying), but the DB constraint is the actual guarantee — insert uses `upsert` with `onConflict: 'rubric_version,source_url,source_label'` so a race (or a deliberate re-run) can never produce duplicate rows for the same essay/version.

`scores` values are validated with a Zod schema (`{ [dimension]: number 1-5 }`, keys restricted to the known `RubricDimensionKey` enum minus `mission_fit`) before every insert — this is the actual enforcement point, since there's exactly one writer (this pipeline script) and Postgres `CHECK` constraints on JSONB internal shape would add migration complexity disproportionate to a single-writer reference table. `PmRubricCalibrationSchema`/type added to `premed/src/lib/schemas.ts`, matching the existing convention for every other typed DB row (`PmProfile`, `PmActivity`, `PmEssayReview`), so the frontend fetch helper isn't working with an unvalidated `any`.

**Post-migration verification, before any frontend wiring or live run**: once the user confirms the migration is applied, run two read checks — one via the service-role client (confirms the table exists at all) and, critically, one via a plain anon-key client with no auth session (the same access level the browser overlay actually has) reading `pm_rubric_calibration`. A service-role check alone proves nothing about RLS — it bypasses RLS entirely, so it would pass even if the `SELECT USING (true)` policy were missing or misconfigured. Both must succeed before frontend wiring begins.

### 6. Cost gate
Same protocol as `review-essay.ts` / `scrape-class-profiles.ts`: print a plan (per-essay estimated tokens/cost via the existing `estimateReviewTokens`/cost-rate constants, ~10 essays), require `--go` before any live call. One difference from the two existing scripts, scoped to this new one only: the pre-call and mid-run projections use `reviewEssay`'s actual `max_tokens: 2000` ceiling as the per-call output-token assumption, not an average-case estimate — a true worst-case upper bound rather than a heuristic, so "stop mid-run if a subsequent call would breach the cap" is an actual guarantee, not just usually-true. (In practice this changes nothing about the printed number for a 10-essay run — worst case is ~$0.35 total, far under the $5 cap — it just makes the safety property real. Not applied retroactively to `review-essay.ts`/`scrape-class-profiles.ts`; hardening their existing average-case projections is out of scope for this session.)

### 7. Calibration stats — computed on read, not stored separately
New shared function in `premed/src/lib/rubric-calibration.ts`: given all `pm_rubric_calibration` rows (or a fetched subset), computes per-dimension `{ min, median, max, n }`. Used two ways:
- `calibrate-rubric.ts` calls it once at the end of a live run and prints the result (satisfies "printed").
- `EssayReviewSection` calls it client-side against the same read-open table (satisfies "stored" — the stored rows are the single source of truth, stats are always freshly derived, never a separately-maintained blob that can drift).

No second migration/table for precomputed stats.

**`rubric-calibration.ts` stays browser-safe — stats math only, plain objects in, plain numbers out.** It has no `jsdom`, no `fs`, no Node-only import of any kind, and is never the place the HTML-parsing/essay-splitting logic (step 1) lives — that logic stays entirely inside `calibrate-rubric.ts` (a Node-only pipeline file `EssayReviewSection` never imports from). This boundary is deliberate: `rubric-calibration.ts` is imported by browser code, so a Node-only dependency landing in it would make Vite try to bundle `jsdom` into the frontend.

### 8. EssayReviewSection wiring (`premed/src/ui/sections/EssayReviewSection.tsx`)
`pm_rubric_calibration` is global reference data, independent of the logged-in profile — unlike `useRealProfileData` (deliberately scoped to per-user RLS-gated data). `EssayReviewSection` already receives `supabase` as a prop; it fetches calibration rows itself on mount via the new lib function, rather than threading it through `useRealProfileData`. Two distinct empty/failure states, not one: if the fetch succeeds and the table genuinely has zero rows (calibration not yet run), the overlay silently doesn't render — bars look exactly as they do today. If the fetch itself errors (RLS misconfigured, table doesn't exist yet, network failure), that's `console.error`'d — still no visible band (never a broken UI), but no longer indistinguishable from "just hasn't been run yet" to a developer debugging it.

### 9. Benchmark overlay (visual)
Each dimension's `ScoreBar` becomes a track with: a lighter-shaded background band spanning calibration min→max, a thin tick at the median, and the user's own colored bar drawn on top (unchanged from today). One caption above the dimension list: `"Accepted-essay range (n=X published essays)"` (kept as originally specified — `n=X` already discloses this is a small published sample, not a claim of statistical rigor). A dimension the current review has but calibration doesn't cover (e.g. `mission_fit`, which calibration never scores since it's essay-only) just renders its plain score bar with no band/tick — never a broken or empty band.

### 10. Render restructuring (EssayReviewSection)
New top-to-bottom order: **verdict** line, then **priority fixes** (relabeled "Your three moves"), then **dimension detail** (with benchmark overlay), then **red flags + consistency flags** together at the bottom. No truncation anywhere in the render (relies on step 3's cap raise — nothing is pathologically long, so no expand/collapse mechanism is built).

### 11. Tests
- `rubric-calibration.ts` stats math (min/median/max, including odd/even-length sets, single-essay edge case).
- Benchmark overlay renders correctly against fixture calibration ranges (band position, median tick position, caption text with correct `n`), and correctly omits the band/tick for a dimension absent from calibration data (e.g. `mission_fit`).
- No-essay-text-persisted guard, two tests, not one: (a) the calibration row-builder's output, given a fake full `EssayReview` (with `evidenceQuotes` populated), contains only `{ dimension: score }` pairs; (b) the pipeline's console-summary formatters (block-label/word-count line, cost-plan line) are small pure functions taking only labels/numbers as input — a test feeds them fixture data alongside a fake essay string and asserts the fake essay substring never appears in the formatted output, catching a future regression where someone accidentally threads essay text into a log line.
- Essay-block parser fixture test: a small fake HTML document with a handful of `ESSAY` markers, asserting correct block count/boundaries — alongside (not instead of) the runtime hard-fail on anything other than exactly 10 blocks against the real page.
- Prose-guard boundary test updated to the new 40-word cap, including a case with visibly more than 40 words verifying truncation + the `[...]` marker still fire — the guard changed its threshold, it didn't stop existing.
- Existing 303 tests stay green.

### 11a. `package.json` script
Adds `"calibrate-rubric": "tsx --env-file=.env.local premed/pipeline/calibrate-rubric.ts"`, matching every other pipeline script's convention — without it, "same cost-gate protocol as review-essay.ts" wouldn't actually be runnable the same way.

### 12. Live run (after "go")
Full calibration pass against the 10 parsed essays (cost gate first, `--go` required). Then re-render one of the user's already-stored real reviews in the dashboard with the new overlay active, screenshot for the handoff.

### 13. Handoff
`docs/handoffs/2026-07-05-premed-session-12.md`, following the established format.

## Key decisions & tradeoffs
- **Single-page parse vs. generic multi-URL crawler**: built for what's actually there (one URL, 10 embedded essays) rather than speculative generality for URLs that don't exist yet.
- **Prose guard raised 15→40, not removed**: preserves the compliance defense-in-depth (schema shape + prompt instruction + word cap) while fixing the actual complaint (mid-sentence clipping); affects all future reviews app-wide, not just calibration.
- **No separate stats table**: calibration stats are always derived live from the raw per-essay rows — can't drift out of sync with the source data, at the cost of a small aggregation on every dashboard load (n≤10, negligible).
- **EssayReviewSection fetches calibration data itself**, bypassing `useRealProfileData` — reference/global data doesn't belong in a hook explicitly scoped to per-profile RLS-gated state.
- **No expand/collapse UI**: the 40-word cap makes it structurally unnecessary; simpler component, nothing to test for expand state.
- **Idempotency guard (app-level skip-check + DB-level `UNIQUE` constraint via `upsert`)**: the pre-check prevents an obvious accidental double-spend before even trying; the constraint is the actual race-proof guarantee.
- **Copyright/reference-use judgment (user-confirmed)**: thecrimson.com's robots.txt sets `Content-Signal: ai-train=no, use=reference` on this content. Sending the full essay text to Anthropic for a one-time scoring inference (never stored, never used for training, never redistributed) was reviewed with the user as a business/legal judgment call, not an engineering one — user confirmed proceeding is acceptable under "reference" use.
- **Benchmark label kept as originally specified** ("Accepted-essay range") despite the source being one sponsored/editorial Crimson collection rather than a statistically representative accepted-applicant sample — user confirmed `n=X` disclosure is sufficient, no rewording needed.

## Risks / open questions
- The Crimson page's HTML structure could differ slightly from what was sampled (e.g. inconsistent nesting around the `ESSAY` marker for some of the 10 blocks) — mitigated by hard-failing on anything other than exactly 10 parsed blocks (rather than a soft per-block word-count skip) and printing each block's label/word-count before the cost-gate `--go` prompt, so a wrong split is catchable by eye before spending money.

## Out of scope
- Re-fixing already-stored `pm_essay_reviews` rows truncated under the old 15-word cap.
- A materialized/precomputed stats table.
- Expand/collapse UI for long text.
- Any change to `ochem2/`.
- Adding more calibration source URLs beyond this one page (can be a future session once/if a genuine second source is identified).
