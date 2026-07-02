# StudyOS Session Handoff — 2026-07-01

## Project
**Workspace:** `c:\Users\crm22\StudyOS`
**Repo:** https://github.com/janicesomme/StudyOS (branch: master)
**Stack:** React 19, TypeScript 6, Vite, Tailwind 4, Supabase JS, Zod 4, Anthropic SDK 0.96.0
**Shell:** PowerShell on Windows 11 — always use PowerShell syntax

## What was built this session

### 1. Practice engine — three new lib files
All three pass `tsc --noEmit` and 60/60 tests.

**`src/lib/practice-progress.ts`**
- Port of `ochem-ii-mastery/src/lib/progress.ts`
- localStorage attempt tracker, key `studyos-eas-attempts-v1`
- `Attempt` type: `{ question_id, score: 0|1|3|5, hints_used, used_solution, created_at, scratchpad? }`
- Exports `progress.all()`, `recordAttempt()`, `latestFor()`, `clear()`
- Fires `window.dispatchEvent(new Event('attempts-updated'))` after every write

**`src/lib/eas-adapter.ts`**
- Maps live `EasProblem` / `EasSolutionStep` rows to practice-engine shapes
- Exports: `Chapter`, `Question`, `Topic`, `Hint`, `Step` types
- Functions: `toQuestion()`, `toHints()`, `toStep()`, `toTopics()`, `toChapters()`
- `Chapter.id = String(problem.chapter)` — this is the join key used by readiness.ts
- `Topic.id = problem.topic` (the raw string) — join key against `Question.topic_id`
- Difficulty cut-points: null → `'medium'`, ≤3 → `'easy'`, ≤6 → `'medium'`, >6 → `'hard'`
- **Current data reality:** `topic`, `difficulty`, `hint_1/2`, `checklist_hint` are ALL null in live DB — will populate via enrich-problems.ts pipeline

**`src/lib/practice-readiness.ts`**
- Port of `ochem-ii-mastery/src/lib/readiness.ts`
- Imports from `./practice-progress` and `./eas-adapter` (not `./queries-types` — that file doesn't exist here)
- Key exports: `statusFor()`, `computeChapterStat()`, `latestPerQuestion()`, `buildReviewIds()`
- Scoring: hint penalty `min(hints_used * 0.05, 0.15)`, solution penalty `0.1`
- Thresholds: 85+ strong, 70+ solid, 50+ shaky, <50 danger
- Review flag: `score <= 1 || used_solution || hints_used >= 2`

### 2. EasPracticePage.tsx — full scored practice instrument
**`src/pages/EasPracticePage.tsx`** — complete rewrite of the previous viewer.

**Tier flow (per expanded problem):**
- Tier 1: full `question_text_raw` + "Show hint" (if hints exist) + self-score row always visible
- Tier 2: hints revealed one at a time via `toHints()` — currently no-op (all hints null in DB)
- Tier 3: "Show solution" triggers deferred `getProblemWithSteps()` call + step ladder + `question_analysis` debrief block ("What this was really testing / How it was disguised / The cue you should have caught")
- On score click: `progress.recordAttempt()` → card collapses, score badge appears on row

**Pedagogy decision (confirmed by user):** `question_analysis` shown ONLY at Tier 3 as a debrief. Showing `skill_tested` at Tier 1 deletes recognition training — the whole point of the `disguise` field.

**Readiness display:** Per-source-group header (not per-chapter) — Option A aggregation, direct math matching `computeChapterStat`. Shows status chip (Untested/Shaky/Solid/etc.) + `readiness%` + `attempted/total`.

**Other:** Review filter toggle (All / Flagged for review), `attempts-updated` event listener, score badges inline on collapsed rows.

### 3. Enrichment pipeline — `ochem2/eas/pipeline/enrich-problems.ts`
Two-phase script to fill the 8 null pedagogy fields on all 157 `o2_eas_problems` rows.

**Key design decisions:**
- No API calls on plain invocation — prints plan + cost estimate and exits
- `--propose` runs Phase 1 (Haiku), `--enrich` runs Phase 2 (Sonnet), `--dry-run` limits to 3
- Idempotent: Phase 2 skips rows where `topic IS NOT NULL`
- Phase 1 reads from live DB (not corpus JSON files)
- Tool_use + Zod validation on both phases
- `hint_1` validated with `.startsWith('Look for') || .startsWith('You will see')`
- `checklist_hint` validated with `.refine(v => !/(consider|think about)/i.test(v))`
- TOPIC_ENUM guard: Phase 2 exits immediately if array is empty

**Cost estimate (printed by script):**
- Phase 1 (Haiku): ~$0.079
- Phase 2 (Sonnet): ~$1.25
- Total: ~$1.33

**Dry-run verified:** 3 sample topic labels from `--propose --dry-run`:
- "Activating and deactivating groups"
- "multi-substituent directing reinforcement"
- "sigma complex stability and charge placement"

Labels show right intent (skill categories) but inconsistent casing — expected from 3 samples; full 157-run will give frequency data to consolidate from.

**npm script added to `package.json`:**
```
"enrich-eas-problems": "tsx --env-file=.env.local ochem2/eas/pipeline/enrich-problems.ts"
```

## Current git state
The new files (`practice-progress.ts`, `eas-adapter.ts`, `practice-readiness.ts`, `EasPracticePage.tsx`, `enrich-problems.ts`, updated `package.json`) are **not yet committed**. The previous commit (`cbab3da`) covers everything up to the last `git push`.

Run `git status` to confirm before committing.

## Data reality (important context)
- **157 rows** in `o2_eas_problems`, all with non-null `question_analysis` (skill_tested, disguise, recognition_cue populated by decompose pipeline)
- `topic`, `difficulty`, `hint_1`, `hint_2`, `checklist_hint`, `common_trap`, `memory_trick`, `high_yield` are ALL null — these are what `enrich-problems.ts` fills
- Corpus JSON files (`ochem2/eas/corpus/*.json`) are raw extracts — enriched fields only exist in the live DB after the enrich pipeline runs
- `topic` being null means `toTopics()` returns `[]` and `computeChapterStat` returns `weakest: null` — safe, no errors

## Enrichment — COMPLETE

**Run date:** 2026-07-01
**Result:** 157 / 157 rows enriched (154 on first pass, 3 retried and caught on second pass)
**Failures:** 0 remaining — all 157 rows have non-null `topic`
**Actual cost:** $3.27 (main run) + $0.07 (retry) = **$3.34 total**
**Tokens:** ~460k in / ~130k out (Sonnet 4.6)

3 failures on first pass were Zod validation rejections:
- `eas-klein-q88`, `eas-smith-q75`: model omitted `memory_trick` field entirely
- `eas-mcmurry-q32`: `checklist_hint` contained banned word "consider"
All three passed cleanly on retry.

**Topic distribution (from live DB — not counted here, derive with a query or from battle map next step)**

## Next steps

### 1. Verify /eas-practice renders enriched fields
Open the app, navigate to `/eas-practice`, and confirm that hints, checklist, common trap, memory trick, topic chips, and difficulty badges all render for real problems. Check null-safety paths still hold (no crash if a field is somehow missing).

### 2. Port sprint engine from ochem-ii-mastery
Source: `ochem-ii-mastery/src/lib/sprint.ts` (prototype repo).
Target: `src/lib/sprint.ts` in StudyOS.
Adapt imports to use `./eas-adapter` and `./practice-progress` (not the prototype's progress/queries).

### 3. Build battle map from real topic frequencies
Now that all 157 rows have `topic` set, query `o2_eas_problems` grouped by `topic` to get counts. Use those real frequencies to build the battle-map UI component that shows topic coverage and student weakness at a glance.

## Env requirements
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — pipeline scripts
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — app (read-only)
- `ANTHROPIC_API_KEY` — Anthropic SDK (auto-picked up by `new Anthropic()`)
All loaded via `tsx --env-file=.env.local` — no dotenv call in scripts.

## Key files
| Path | Purpose |
|------|---------|
| `src/lib/practice-progress.ts` | localStorage attempt tracker |
| `src/lib/eas-adapter.ts` | EasProblem → practice-engine type mappings |
| `src/lib/practice-readiness.ts` | Scoring, readiness %, status chips |
| `src/pages/EasPracticePage.tsx` | Full scored practice UI |
| `ochem2/eas/pipeline/enrich-problems.ts` | Two-phase enrichment script |
| `ochem2/eas/pipeline/topic-proposals.json` | Frequency-sorted raw topic labels from --propose |
| `src/types/database.ts` | Live Supabase type definitions |
| `src/lib/eas.ts` | Supabase fetch functions for EAS tables |
| `ochem2/eas/pipeline/load-supabase.ts` | Reference for pipeline conventions |

## Suggested skills

- **`gsd:resume-work`** — if there's a GSD plan to restore
- **`review`** — before committing the new files, get a code review pass on `enrich-problems.ts` (the most complex new file)
- **`nofear-ochem`** — if working on the OChem pedagogy/content side
- **`tdd`** — if adding tests for the new lib files (practice-progress, eas-adapter, practice-readiness have no unit tests yet)
- **`superpowers:verification-before-completion`** — run before marking any phase done

## Conventions to follow
- **No Python** — TypeScript only for all scripts (CLAUDE.md hard rule)
- **JSON-first** — write to disk, verify, then load to DB (never analyze straight to DB)
- **Flag any paid API cost** before running — enrich-problems.ts already does this
- **Student-facing output** is always re-expressed, never verbatim textbook text
- **PowerShell syntax** — Windows 11, no WSL
- Build verification: `npx tsc --noEmit && npx vitest run`
