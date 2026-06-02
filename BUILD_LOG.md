# StudyOS Build Log

---

## INSTRUCTIONS FOR CLAUDE (read this first)

You have been asked to read this BUILD_LOG to start or continue a work session.

Do the following, in this order:

1. Read this entire file.
2. Summarize the current state of the project in 3-4 sentences.
3. State exactly what the next task is (from Section 3).
4. Ask the user to confirm before doing any work.

Do NOT start building, writing, or editing anything until the user says go.
Do NOT ask clarifying questions before giving the summary -- read the file, report, then ask.

The working directory is: C:\Users\crm22\StudyOS

---

## 1. What This Project Is

**StudyOS** is a subject-agnostic AI operating system for students. It is a separate, standalone product from the AI OCHEM STUDY SYSTEM (which is the playbook/card system at C:\Users\crm22\AI OCHEM STUDY SYSTEM).

StudyOS combines an AI study assistant and a 24/7 personal tutor. It ingests everything a student learns from, builds a personalized knowledge base, runs specialized agents, and prepares students for exams throughout the semester -- not just the night before.

**Core product claim:** "Your AI study assistant and personal tutor, working all semester so you're ready before exam day."

**Target user:** High school through college students under academic pressure (private school, professional parents, fraternities/sororities) who have money and motivation but were never taught how to learn.

**First test case:** Organic Chemistry 1 (using the OChem playbook content as seed data).

---

## 1a. Architecture

**Four Cs framework:**
- Context: student profile, knowledge base, course structure, performance history
- Connections: everything the student uploads (PDF, slides, notes, voice, video)
- Capabilities: six specialist agents
- Cadence: autonomous behavior between sessions

**Six agents:**
1. Archivist -- ingests uploads into structured knowledge units
2. Memory Coach -- spaced repetition, recall sessions, gap tracking
3. Study Manager -- daily planning, "what do I do next?" (owns the Cadence layer)
4. Note Architect -- organized summaries from raw materials
5. Exam Strategist -- practice questions, high-yield topics, review packs
6. Professor -- 24/7 personalized tutor, Socratic method, knows the student deeply

**Orchestrator** sits above all six agents -- thin routing layer only.

**Tech stack:** React 19, TypeScript 6, Vite 8, Supabase (auth + database), React Router v7, Tailwind CSS v4, Vitest 4, React Testing Library

**Key design decisions (locked):**
- students.id = auth.users.id (Supabase auth pattern)
- students and student_profile rows are created by SECURITY DEFINER triggers -- the client never INSERTs into them directly
- Schema-first: no agent is built until the full schema is approved
- 15 tables total across all plans (original plan said 16 -- corrected)
- knowledge_units is the atomic heart of the system
- student_profile feeds every agent; Professor reads it most deeply
- RLS on every table: each student sees only their own rows
- RLS uses both USING and WITH CHECK where appropriate (hardened)

---

## 2. Current State

### Repository
- Local: C:\Users\crm22\StudyOS
- Branch: master
- GitHub: not yet set up
- Supabase project: studyos (renamed from existing project)

### Plan 1 -- COMPLETE AND QA VERIFIED

All 13 tasks done. Two-user RLS test passed.

### Plan 2 -- COMPLETE AND QA VERIFIED

All code written, committed, and passing (29 tests green, build clean). Supabase setup complete. QA passed -- 29 knowledge units extracted from a real file end-to-end.

### Session 09 additions -- No Fear Ochem skill hardening + Lewis Structures (2026-05-17)

**Vertical slice completed:**
- Generated hydronium.png and ammonium.png via MolView/Playwright script
- Inserted both images into `docs/no-fear-ochem/chapter-01/01-04-formal-charge.md` in the appropriate Left/Right table rows
- Removed "Drawings needed" placeholder block -- formal charge document is now fully published

**Section 1.3 Lewis Structures document generated:**
- Output: `docs/no-fear-ochem/chapter-01/01-03-lewis-structures.md`
- 6 Klein knowledge units grounded (Covalent Bond, Lewis Dot Structures, Octet Rule, Lone Pairs, Bond Length/Strength, Drawing Steps -- all Section 1.3 / SkillBuilder 1.2)
- 3 molecule images generated: water.png, methane.png, ammonia.png
- Document reviewed against new skill rules and fully revised before final save

**nofear-ochem skill -- second major upgrade (.claude/skills/nofear-ochem/SKILL.md):**
8 new rules added after reviewing the first generated section:
1. Plain-meaning-first rule: plain English always leads, Ochem term in parentheses after. Pattern reversed from prior version. Examples embedded in skill.
2. Naked Terms list: 24 Ochem terms that must never appear without a same-sentence plain-English explanation (nucleophile, basicity, valence electrons, octet rule, lone pair, etc.)
3. Metaphor rule: metaphors must return to exam-relevant chemistry language -- bad/good examples embedded
4. Lone pair wording rule: never say lone pairs "are not looking to bond" -- they can and do donate electrons; bad/good examples embedded
5. What To Notice First: new required Section 6 in every document -- scannable list of what to look for first when solving a problem on this concept
6. Common Student Confusion format: mandatory Wrong thought / Why it causes mistakes / Corrected thought structure for every confusion item
7. Training Wheels OFF rule tightened: must not use unexplained jargon even in condensed version -- bad/good examples embedded
8. QA Checklist: 11-item checklist required as Section 11 at end of every generated document

Output format is now 11 sections (was 9):
1. Source Lookup Summary | 2. Section Title | 3. Why This Matters | 4. Left/Right Table | 5. Why Do I Care Chain | 6. What To Notice First (NEW) | 7. Exam-Useful Takeaway | 8. Common Student Confusion | 9. Tiny Tactic | 10. Training Wheels OFF | 11. QA Checklist (NEW)

---

### Session 08 additions -- Knowledge Base Grounding Layer (2026-05-17)

Three new Supabase tables live. Three new local scripts. nofear-ochem skill fully upgraded. First grounded No Fear document generated.

**New tables (all migrations applied in Supabase dashboard):**
- `reagents` -- 113 rows from Master Organic Chemistry Reagent Guide PDF. World-readable (open SELECT policy). Service role required for INSERT.
- `exam_questions` -- 20 rows from acid/base question bank (Q1-Q20). Per-student RLS. All six card fields (janice_shortcut, student_visible_trigger, what_student_does, struggle_point, why_easy_in_system, pre_lesson_needed) plus classification and topic arrays.
- `knowledge_units` now has 67 rows -- Klein Chapter 1 ingested via local ingest-chapter script (bypasses edge function timeout).

**New local scripts (all in scripts/, all use .env.local for credentials):**
- `scripts/extract-reagents.ts` -- sends a PDF to Claude Opus via streaming, extracts structured reagent JSON, inserts into reagents table. Run: `npm run extract-reagents -- "path/to/pdf"`
- `scripts/ingest-chapter.ts` -- local replacement for Archivist edge function for large PDFs. Uploads to Supabase Storage, streams PDF to Claude Opus, inserts knowledge_units, updates source_materials status. Run: `npm run ingest-chapter -- "path/to/pdf" "Title"`
- `scripts/import-question-bank.ts` -- reads all markdown files in question_bank_index_batches/, sends each to Claude, extracts structured exam_questions JSON, inserts into table. Run: `npm run import-question-bank`

**nofear-ochem skill -- fully rewritten (.claude/skills/nofear-ochem/SKILL.md):**
- Source Discipline section: six non-negotiable rules. Source wins over memory. [UNVERIFIED] tag for misses. No guessing.
- Reagent Lookup Protocol: Bash curl to Supabase REST API using SUPABASE_ANON_KEY. WebFetch does NOT work (no custom header support).
- Klein Knowledge Units Protocol: Bash curl to knowledge_units using SUPABASE_SERVICE_ROLE_KEY (bypasses RLS, filters by STUDENT_ID explicitly).
- Drawing Protocol: screenshotByName via MolView script. Never text descriptions.
- Output format now has 9 sections -- added Source Lookup Summary as Section 1.

**Vertical slice tested and working:**
- Concept: Formal Charge (Klein Section 1.4)
- Klein lookup returned 1 verified unit from Section 1.4
- Document written from verified source, drawings flagged for generation
- Output: `docs/no-fear-ochem/chapter-01/01-04-formal-charge.md`

**Critical .env.local note:**
Both VITE_ prefixed AND non-prefixed vars must exist in .env.local. Vite only exposes VITE_ vars to the browser. Scripts use non-prefixed. Required keys:
```
VITE_SUPABASE_URL=...         (browser)
VITE_SUPABASE_ANON_KEY=...    (browser)
SUPABASE_URL=...              (scripts)
SUPABASE_ANON_KEY=...         (scripts)
SUPABASE_SERVICE_ROLE_KEY=... (scripts)
ANTHROPIC_API_KEY=...         (scripts)
STUDENT_ID=f022dd8c-3d18-4b78-b4f3-511b61022207   (scripts)
COURSE_ID=5a004484-4b43-4a74-bd76-65bbd924ec17    (scripts)
```

```
New files added in Plan 2:
supabase/
  migrations/
    20260508010000_plan2_archivist.sql   (NOT YET RUN in Supabase)
  functions/
    archivist/
      index.ts                           (NOT YET DEPLOYED)
src/
  types/database.ts                      (updated -- now covers 5 tables)
  hooks/useSourceMaterials.ts
  hooks/useKnowledgeUnits.ts
  components/materials/
    UploadForm.tsx
    MaterialCard.tsx
    KnowledgeUnitList.tsx
  pages/CoursePage.tsx
  App.tsx                                (updated -- /courses/:id route added)
  pages/DashboardPage.tsx                (updated -- courses link to /courses/:id)
  __tests__/hooks/useSourceMaterials.test.ts
  __tests__/hooks/useKnowledgeUnits.test.ts
  __tests__/components/UploadForm.test.tsx
  __tests__/components/MaterialCard.test.tsx
```

### Session 10 additions -- Module 2 infra completion + image ingest pipeline + app cleanup (2026-06-02)

**Module 2 infra steps completed (were outstanding from last session):**
- Migration `20260602000000_module2_image_fields.sql` run in Supabase (image_url, ai_tagged, answer_key columns + exam-question-images private storage bucket)
- `chapter-translator` edge function redeployed (topic_tags logic was added last session)
- ANTHROPIC_API_KEY re-set as Supabase edge function secret (was missing -- all Claude calls were 401ing)

**Structure and Bonding past exam ingested:**
- File: `STRUCTURE AND BONDING PAST EXAM Q AND A.docx` placed in `C:\Users\crm22\StudyOS\source_materials\`
- `npm run ingest-docx` run. Result: 223 images labelled from carry-down headings, 0 AI-suggested, 0 needs_review, 223 rows inserted
- Script ran twice (accidental) -- 446 rows created. Deduped back to 223 by keeping earliest created_at per image_url
- exam_questions subsequently TRUNCATED to empty -- user decided to redesign the question source strategy before re-ingesting (see below)

**Delete material button added (CoursePage / MaterialCard):**
- `useSourceMaterials.ts` -- added `deleteMaterial(id)`: deletes storage file then DB row, refreshes list
- `MaterialCard.tsx` -- outer element changed from `<button>` to `<div>` (can't nest buttons); added `onDelete` prop; small x button top-right stops propagation
- `CoursePage.tsx` -- wired `deleteMaterial` into `onDelete` on each card

**question_source per-course setting:**
- New migration: `supabase/migrations/20260602020000_course_question_source.sql`
  - Adds `question_source text not null default 'generated' check (... in ('image_bank','generated'))` to `courses` table
  - Sets ochem course (`5a004484-4b43-4a74-bd76-65bbd924ec17`) to `'image_bank'`
- `database.ts` -- `Course` type updated with `question_source: 'image_bank' | 'generated'`
- `chapter-translator/index.ts` -- reads `question_source` from the course row; skips question generation entirely when `'image_bank'`; full generation path intact and dormant for future subjects
- `customQuestions.ts` -- `ClaudeQuestionSchema` preserved; `TranslatorResultSchema` updated to make `questions` optional (`default []`)
- `ChapterTranslatorPage.tsx` -- conditional UI: if `questions.length === 0` (image_bank mode) shows concepts + plain English + topic tags + "Drill these topics" button; if questions present shows question preview + save flow

**Chapter Translator prompt rewritten (Pattern-First pedagogy):**
- `SYSTEM_PROMPT` and `buildPrompt` critical rules now enforce Janice's Stricter Rules from `PATTERN_DESIGN_LOG.md`:
  - `student_visible_trigger` must start with "Look for" or "You will see" -- visible on page only
  - `what_student_does` must be numbered mechanical steps, no "Consider"/"Think about"
  - `janice_shortcut` 1-2 sentences MAX (5-second spoken rule)
  - `struggle_point` must describe a failure mode, not a knowledge gap
  - Every ochem term translated inline in parentheses on first use

**PDF upload added to Chapter Translator:**
- `pdfjs-dist` v6.0.227 installed
- `ChapterTranslatorPage.tsx` -- added "Upload PDF" file input above text box; uses `pdfjs-dist` to extract text client-side and auto-populate the textarea; fills title from filename; shows "Reading PDF..." while extracting

**Past exams folder surveyed (no processing done):**
- Location: `C:\Users\crm22\StudyOS\docs\past exams and answer keys\`
- 793 files total: 788 PDF, 3 docx, 1 xlsx, 1 png
- 7 subfolders: COMBINED PAST COLLEGE EXAMS, NEW TESTS 10-20, new tests 2022, ORG II, Q ANALYSIS BY MIDTERM EXAM, SKILLS SETS NEEDED, WHAT NEED TO KNOW FROM QUESTIONS
- **NEW TESTS 10-20 is the clean set**: 53 matched question/key pairs, 0 orphans. Naming: `11[code][year]ex[N].pdf` + `11[code][year]ex[N]k.pdf`
- Exam numbering in NEW TESTS 10-20: ex1 (35 files), ex2 (32), ex3 (26), ex4 (14), finals (13). Pattern is ex1/ex2/ex3/ex4 for 11xxx series; Midterm_1/Midterm_2/Final for 30A/30B series. No single consistent pattern across all files.
- **ALL PDFs are scanned image files** (0-1 text blocks). Text extraction will return nothing. Any ingest pipeline must treat pages as images.
- COMBINED PAST COLLEGE EXAMS folder: naming is chaotic across many universities and naming conventions. Not worth processing systematically without manual curation first.
- Question layout not confirmed visually (disk space prevented rendering). Recommend opening `11JRF17ex1.pdf` to verify before designing ingest.
- Survey complete. Ingest pipeline not yet designed. User will review before next steps.

### Session 11 additions -- Module 3 Exam Intelligence (2026-06-02)

**Correction to Session 10 survey:** The question sheets (e.g. `11JRF17ex1.pdf`) are TEXT-BASED PDFs with embedded vector text -- NOT scanned. Session 10 incorrectly flagged all past exam PDFs as scanned. The answer key files (e.g. `11JRF17ex1k.pdf`) ARE scanned handwritten pages. The distinction matters: question text extracts directly, key pages are stored as images only.

**Module 3 spec and plan written:**
- Spec: three-tier cards (QUESTION -> HINT -> ANSWER), point-weighted frequency map, two drill modes (topic worksheet + intact exam)
- Plan: `docs/superpowers/plans/2026-06-02-module3-exam-intelligence.md` -- 7 tasks, all implemented this session

**New migration (written, NOT YET RUN in Supabase):**
- `supabase/migrations/20260602030000_module3_exam_intelligence.sql`
- Creates `source_exams` table (one row per exam file: course_code, year, exam_number, original_filename, question_count)
- Adds 10 new columns to `exam_questions`: hint, answer_image_url, source_exam_id (FK source_exams), exam_number, exam_year, question_order, point_value, sub_parts, has_structure, raw_text
- RLS on source_exams: select/insert/update/delete all scoped to auth.uid() = student_id
- **MANUAL STEP REQUIRED: paste this migration into Supabase dashboard SQL editor and run it before running any ingest scripts**

**New scripts (all in scripts/, all use .env.local for credentials):**
- `scripts/parse-exam-sheet.ts` -- extracts text from question-sheet PDFs using pdfjs-dist; parses question boundaries, sub-parts, point values. Run: `npm run parse-exam-sheet -- "path/to/file.pdf"`. Also exports `parseFilename`, `extractPages`, `parseQuestions` for other scripts.
- `scripts/propose-topics.ts` -- calls Claude Haiku on all 17 question sheets, proposes free-form topic label per question, prints deduplicated frequency list, saves `topic_proposals.json`. Run: `npm run propose-topics`. Output feeds into TOPIC_ENUM decision.
- `scripts/render-key-pages.py` -- Python/PyMuPDF renderer; renders each page of a key PDF as a 2x-zoom PNG. Called by the TypeScript wrapper.
- `scripts/render-key-pages.ts` -- TypeScript wrapper for the Python renderer; used by ingest pipeline.
- `scripts/ingest-exam-pairs.ts` -- full pipeline: pairs 53 question+key PDFs, parses questions, upserts source_exams row, renders key pages, uploads PNGs to `exam-question-images` bucket, tags topic (Claude Haiku + TOPIC_ENUM), generates hint (Claude Sonnet), inserts exam_questions rows. Supports `--dry-run` for single-pair test. Run: `npm run ingest-exam-pairs`. **DO NOT RUN until: (a) migration is applied, (b) TOPIC_ENUM is updated with confirmed canonical list.**
- `scripts/build-frequency-map.ts` -- queries exam_questions (Module 3 rows only), prints point-weighted topic x exam_number table to console. Run: `npm run frequency-map`.

**TOPIC_ENUM note:** `ingest-exam-pairs.ts` has a placeholder TOPIC_ENUM at the top (12 items). This must be replaced with the canonical list from the propose-topics output BEFORE running the ingest. The propose-topics script was fixed this session after a bug caused silent exit (see below).

**Bug fixed -- ESM main guard on parse-exam-sheet.ts:**
`parse-exam-sheet.ts` was calling `run()` unconditionally at the bottom. When `propose-topics.ts` imported it, Node executed `run()`, which saw no PDF argument and called `process.exit(1)` -- silently killing the process. Fixed with: `if (path.resolve(process.argv[1] ?? '') === path.resolve(fileURLToPath(import.meta.url))) { run()... }`. The propose-topics script now starts correctly.

**UI changes:**
- `src/hooks/useExamQuestions.ts` -- added optional `options: { sourceExamId?, examNumber? }` parameter. Intact-exam mode orders by `question_order`; topic worksheet mode filters by `exam_number`. Existing callers unaffected (default `{}`).
- `src/pages/DrillPage.tsx` -- replaced two-tier `flipped` state with three-tier `tier: 'question' | 'hint' | 'answer'`. Reads `source_exam_id` and `exam_number` from URL params. Shows hint tier only when `q.hint` is present. Answer tier shows `answer_image_url` image first, then `answer_key` text, then placeholder. Shows exam_number and point_value badges. Back link goes to exam-picker.
- `src/pages/ExamPickerPage.tsx` (NEW) -- two-mode picker at `/courses/:id/exam-picker`. Topic worksheet mode: pick exam number + topic -> drill filtered set. Full exam mode: pick a specific past exam -> drill all questions in original order.
- `src/App.tsx` -- `/courses/:id/exam-picker` route added.
- `src/pages/CoursePage.tsx` -- drill link updated to point to exam-picker.

**Test state:**
- 29 tests passing, 0 failures
- Build: clean
- exam_questions table: EMPTY (migration not yet run; table not yet extended)
- source_exams table: does not exist yet (migration not yet run)

---

## 3. Next Steps

### CURRENT -- Complete Module 3 ingest sequence

All pipeline code is written. Three manual steps remain before data is in the database:

**Step 1 -- Run the migration (REQUIRED FIRST)**
Open Supabase dashboard -> SQL editor. Paste and run `supabase/migrations/20260602030000_module3_exam_intelligence.sql`.
Verify: `source_exams` table appears; `exam_questions` now has `hint`, `answer_image_url`, `source_exam_id`, etc.

**Step 2 -- Generate and review the topic list**
```
npm run propose-topics
```
Takes ~3-5 minutes (17 files x ~7 questions x Claude Haiku). Prints a frequency-sorted list of proposed topic labels and saves `topic_proposals.json`.
Review the list, collapse synonyms into a canonical set (e.g. `ACID_BASE` + `ACIDITY` -> `ACIDITY`).
Then open `scripts/ingest-exam-pairs.ts` and replace the `TOPIC_ENUM` array (near the top, clearly commented) with the confirmed list.

**Step 3 -- Dry run the ingest**
```
npm run ingest-exam-pairs -- --dry-run
```
Processes ONE exam pair. Inserts one `source_exams` row and ~7 `exam_questions` rows with hints and answer_image_url. Check Supabase dashboard to confirm the rows look correct (hint text, answer_image_url pointing to a key page, verified=false).

**Step 4 -- Full ingest**
```
npm run ingest-exam-pairs
```
Processes all matched pairs (17 question files found in NEW TESTS 10-20 as of last scan). Takes ~15-20 minutes. Logs per-question progress. Failed pairs are logged but don't stop the pipeline.

**Step 5 -- Review the frequency map**
```
npm run frequency-map
```
Prints point-weighted topic x exam_number table. This is the exam-relevance triage output.

**Step 6 -- Test the drill UI**
Start the dev server and navigate to a course -> click Drill -> ExamPickerPage. Verify both modes work: topic worksheet picker (select exam + topic -> drill three-tier cards) and full exam mode (select an exam -> drill in original order).

### ALSO PENDING -- No Fear Ochem content generation

The grounding layer is live and the skill is hardened. The immediate priorities are:

**Priority 1 -- Ingest Klein Chapters 2-12**
Use `npm run ingest-chapter` for each chapter PDF. User has access to Klein PDF and can export chapters on their PDF platform. Recommended: ingest chapters as they are needed for content work rather than all at once.
Command: `npm run ingest-chapter -- "C:\path\to\klein-chX.pdf" "Klein Chapter X -- Title"`

**Priority 2 -- Complete the vertical slice -- DONE**
hydronium.png and ammonium.png generated and inserted into `docs/no-fear-ochem/chapter-01/01-04-formal-charge.md`. Document is fully published.

**Priority 3 -- Continue No Fear Ochem documents**
1.3 Lewis Structures is complete. Continue in this order:
1.5 Resonance -> 1.6 Electronegativity/Polarity -> 1.7 Induction
Use nofear-ochem skill. It will query Klein knowledge_units via Bash curl before writing each section.
Note: the skill now produces 11 sections including What To Notice First and QA Checklist. All future sections must pass the QA checklist before being considered done.

**Priority 4 -- exam_questions skill integration**
The nofear-ochem skill does not yet query exam_questions. Add a protocol to query related exam questions by topic and surface the Janice Shortcut and Struggle Point at the end of each document. This closes the loop: concept -> exam question -> cramming shortcut.

**Priority 5 -- Question bank expansion**
Q1-Q20 (acid-base) are in the database. Next: add Q21+ from subsequent question bank PDFs as they are processed. Run `npm run import-question-bank` after adding new markdown files to question_bank_index_batches/.

Do NOT start Plan 3 (Memory Coach) until the strategic question is answered. See Strategic Checkpoint.

### Upcoming plans (order unchanged, all on hold pending strategy decision)

- Plan 3: Memory Coach (recall sessions + spaced repetition)
- Plan 4: Study Manager + Today's Focus
- Plan 5: The Professor (onboarding assessment + tutoring)
- Plan 6: Exam Strategist + Note Architect

---

## 4. Key Reference Files

| File | Purpose |
|---|---|
| `docs/superpowers/specs/2026-05-08-studyos-design.md` | Full design spec v2 -- product vision, all agents, 15-table schema |
| `docs/superpowers/plans/2026-05-08-plan-01-foundation.md` | Plan 1 -- complete, for reference only |
| `docs/superpowers/plans/2026-05-08-plan-02-archivist.md` | Plan 2 -- complete, for reference only |
| `PATTERN_DESIGN_LOG.md` | Content design log -- Pattern-First framework, all 15 patterns, 5-pack compression, question bank workflow, session checkpoints. Read this for all curriculum work. |
| `source_materials/acid_base_question_bank_001.pdf` | Smith Ch 3 question bank -- 93 pages, questions embedded as images. Must be processed visually using PyMuPDF (see Implementation Notes). Do not use pdftotext. |
| `question_bank_index_batches/q001_q010_test_batch.md` | Structured index of Q1-Q10 with classification and Janice teaching columns. Template for all future batches. |
| `question_bank_index_batches/q011_q020_batch.md` | Structured index of Q11-Q20. Same six-field card format. |
| `.claude/skills/nofear-ochem/SKILL.md` | No Fear Ochem skill -- fully upgraded Session 08. Source Discipline, Klein lookup, Reagent lookup, Drawing Protocol, 9-section output format. Uses Bash curl for all Supabase queries (WebFetch lacks header support). |
| `.claude/skills/nofear-compress/SKILL.md` | No Fear Compress skill -- finds minimum viable visual compression of any Ochem concept. |
| `docs/no-fear-ochem/chapter-01/01-04-formal-charge.md` | First grounded No Fear document. Generated from Klein knowledge_units lookup. Drawings not yet generated -- see Priority 2 in Section 3. |
| `docs/ochem/chp1_raw.txt` | Klein Chapter 1 full text extracted via pdfplumber. Superseded by knowledge_units in Supabase -- use the DB lookup, not this file, when writing No Fear sections. |
| `scripts/molview-screenshot.ts` | Screenshots 2D skeletal structures from MolView via Playwright. By name: `npm run screenshot-molecule -- name "molecule-name" "filename"`. By CID: `npm run screenshot-molecule -- cid 12345 "filename"`. Output: `docs/no-fear-ochem/images/`. |
| `scripts/extract-reagents.ts` | One-time extraction script -- already run, 113 reagents in DB. Do not re-run unless rebuilding from scratch. |
| `scripts/ingest-chapter.ts` | Local chapter ingestion -- use this instead of app upload for large PDFs (bypasses edge function timeout). Requires STUDENT_ID and COURSE_ID in .env.local. |
| `scripts/import-question-bank.ts` | Reads question_bank_index_batches/*.md, extracts structured exam_questions, inserts into Supabase. Run after adding new batch files. |
| `docs/superpowers/plans/2026-06-02-module3-exam-intelligence.md` | Module 3 implementation plan -- all 7 tasks complete. Read for pipeline architecture and TOPIC_ENUM instructions. |
| `scripts/parse-exam-sheet.ts` | Parses text-based question-sheet PDFs. Exports `parseFilename`, `extractPages`, `parseQuestions` for pipeline scripts. CLI: `npm run parse-exam-sheet -- "path/to/file.pdf"`. ESM-safe: guarded main so importing doesn't trigger CLI. |
| `scripts/propose-topics.ts` | Proposes free-form topic labels across all question sheets via Claude Haiku. Run ONCE before first ingest. Output feeds into TOPIC_ENUM in ingest-exam-pairs.ts. `npm run propose-topics`. |
| `scripts/render-key-pages.py` | PyMuPDF renderer -- renders key PDF pages as 2x-zoom PNGs. Called by render-key-pages.ts wrapper. |
| `scripts/ingest-exam-pairs.ts` | Full Module 3 ingest pipeline. Pairs 53 question+key PDFs, parses, tags, hints, uploads key images, inserts rows. Update TOPIC_ENUM before running. `npm run ingest-exam-pairs`. `--dry-run` for single pair. |
| `scripts/build-frequency-map.ts` | Prints point-weighted topic x exam_number frequency table from ingested data. `npm run frequency-map`. |
| `topic_proposals.json` | Output of propose-topics run -- raw per-question topic proposals. Generated at repo root. Use to define canonical TOPIC_ENUM. |

---

## 5. Implementation Notes

**Tech versions actually installed:**
- React 19, React Router v7, Tailwind CSS v4, Vite 8, TypeScript 6, Vitest 4

**Tailwind v4:** Uses `@import "tailwindcss"` in index.css. No tailwind.config.js. Uses `@tailwindcss/vite` plugin in vite.config.ts.

**TypeScript 6 gotchas:**
- `verbatimModuleSyntax: true` -- type-only imports must use `import type` or inline `type` keyword
- Supabase JS v2 `.insert()` -- single-line inserts use `@ts-expect-error` (see useCourses.ts). Multi-line insert+select chains use `(supabase.from('table') as any)` cast instead (see useSourceMaterials.ts)
- Supabase JS v2 `.update()` chains also need the `as any` cast in some cases
- Vitest mock variables must be declared with `vi.hoisted()` if referenced inside `vi.mock()` factory -- plain `const` declarations are not initialized in time due to hoisting
- Import `defineConfig` from `vitest/config` not `vite` in vite.config.ts

**PostCSS:** Empty `postcss.config.js` in project root is intentional -- it overrides a parent-directory postcss config from another project. Do not delete it.

**Supabase email confirmation:** Must be OFF for local dev. Setting is at Authentication -> Providers -> Email -> "Confirm email".

**signup flow:** Signup always navigates to /dashboard on success.

**Storage path structure:** Files are stored at `{studentId}/{courseId}/{timestamp}-{filename}` in the `course-materials` bucket. The storage policies use this structure to restrict access.

**Edge function:** The Archivist runs on Supabase Edge Functions (Deno runtime). It verifies both the source_material and its parent course belong to the authenticated user before writing any knowledge_units. It uses the service role key (injected automatically by Supabase -- not in .env.local).

**PDF processing (question bank):** The acid_base_question_bank_001.pdf has question content embedded as images -- pdftotext extracts only labels and section headers, not the actual questions. Use PyMuPDF to render pages as images. PyMuPDF is installed (pip3 install pymupdf, version 1.27.2). Render at 2x zoom: `mat = fitz.Matrix(2.0, 2.0)`. pdftotext is at /clangarm64/bin/pdftotext.exe (useful for structure inspection only).

---

## 6. Session Log

### Session 01 (2026-05-08)
- Brainstormed StudyOS concept from scratch
- Defined target user, product vision, Four Cs architecture
- Designed six-agent system
- Designed 15-table Supabase schema
- Wrote design spec v2
- Initialized repo
- Wrote Plan 1: Foundation (13 tasks)

### Session 02 (2026-05-08)
- Revised Plan 1: reduced to 3 tables, hardened RLS, trigger pattern, two-user QA test
- Scaffolded Vite project (React 19, Vite 8, TypeScript 6)
- Installed all dependencies (Tailwind v4, Vitest 4, Supabase JS, React Router v7)
- Ran Plan 1 migration -- 3 tables live with RLS and triggers
- Built all auth and course components with TDD (11 tests)
- Fixed TypeScript 6 compatibility issues (import type, vitest/config, insert cast)
- Fixed PostCSS conflict with parent directory config
- Fixed Supabase email confirmation issue (setting location, removed emailSent logic)
- Plan 1 QA complete -- two-user RLS test passed

### Session 03 (2026-05-08)
- Wrote and revised Plan 2: The Archivist
- Built all Plan 2 code: useSourceMaterials, useKnowledgeUnits, UploadForm, MaterialCard, KnowledgeUnitList, CoursePage, Archivist edge function
- Fixed Vitest hoisting issue (vi.hoisted pattern for mock variables)
- Fixed TypeScript 6 incompatibility with Supabase multi-line insert+select chain (as any cast)
- 29 tests passing, build clean, all committed
- Supabase manual setup (migration, storage policies, edge function deploy) NOT YET DONE -- see Section 3

### Session 04 (2026-05-09)
- Completed all Supabase setup for Plan 2: migration run, storage policies applied, edge function deployed, Anthropic API key set
- Fixed supabase config.toml missing from StudyOS -- CLI was resolving workdir to parent directory
- Fixed edge function JSON parsing -- made it robust against Claude preamble text (find first [ last ])
- Increased max_tokens from 8192 to 16000 to handle longer files
- Added diagnostic error logging to edge function error messages
- Plan 2 QA passed -- 29 knowledge units extracted from real file end-to-end

### Session 05 (2026-05-10) -- Content design, no code
- Resumed from Acid/Base Pattern Compression checkpoint (PATTERN_DESIGN_LOG.md)
- Confirmed compressed 5-pack student-facing system (Core Product Moves, pKa Moves, ARIO Helpers, Helper Counting, Twist Cards)
- Confirmed automaticity mission format rule: exam-style questions only, not flashcards
- Established question bank processing workflow: PyMuPDF page rendering (installed), visual inspection per batch
- Processed Q1-Q10 from acid_base_question_bank_001.pdf as test batch
- Built two-table index format: classification table + Janice teaching logic table
- Saved to question_bank_index_batches/q001_q010_test_batch.md
- Full session checkpoint in PATTERN_DESIGN_LOG.md -- read that file for content work context

### Session 07 (2026-05-15) -- No Fear Ochem skill system, no StudyOS code

Started the No Fear Ochem content system inside StudyOS. Two reusable Claude Code skills built and committed.

**nofear-ochem skill** (`.claude/skills/nofear-ochem/SKILL.md`):
- Transforms Ochem 1 textbook sections into student-friendly "No Fear" learning documents
- Teaching philosophy: every explanation must return to electron movement, bond forming/breaking, or exam use
- Training Wheels ON by default: vocabulary table of plain-English definitions for all key terms
- 8-section output format: title, why-this-matters, left/right table, why-do-I-care chain, exam takeaways, common confusion, tiny tactic, training wheels OFF version
- Output format: HTML with side-by-side columns (left = textbook, right = No Fear)

**Pilot document** (`docs/no-fear-ochem/chapter-01/01-04-formal-charge-pilot.html`):
- Section 1.4 Formal Charge from Klein Chapter 1
- Actual textbook text extracted from PDF (pdfplumber) on the left
- No Fear translation on the right with Training Wheels ON
- Key compression discovered in session: FC = column number minus dots minus sticks
  (bond lines already encode the halving step -- no arithmetic needed)

**nofear-compress skill** (`.claude/skills/nofear-compress/SKILL.md`):
- Second-pass skill: finds the minimum viable, visually-grounded compression of any Ochem concept
- 5-step process: identify core operation -> map visual elements -> find eliminated step -> generate candidates -> verify accuracy
- Quality-reviewed by subagent -- one major calibration fix applied (worked example was teaching the model to accept formula-variable rewrites; fixed to enforce visual-element language at Step 4)
- Self-tested: trace through formal charge confirms all 5 steps produce correct output when followed literally
- Most useful from Chapter 2 onwards where formula density is higher

**PDF extraction:** Klein Chapter 1 extracted to `docs/ochem/chp1_raw.txt` using pdfplumber.
Diagrams (Lewis structures) were not extracted -- placeholders used in pilot HTML.
Next pass should add inline SVG or simple CSS diagrams for structures.

**Key content insight (Chapter 1 blueprint):**
Chapter 1's job is teaching students to read molecules before reactions. Every section connects to: where are the electrons, where are they missing or extra, where are they being pulled, where might change happen.

### Session 08 (2026-05-17) -- Knowledge base grounding layer

Built the full grounding layer for the No Fear Ochem system. All work is live in Supabase.

**Molecule screenshot utility:**
- Built `scripts/molview-screenshot.ts` -- Playwright headless Chromium, queries PubChem by name for CID, loads MolView via CID URL, dismisses modal, runs "Clean structure", screenshots 2D panel
- Tested on 1-methylcyclohexene and beta-ocimene -- both clean
- Added `npm run screenshot-molecule` to package.json

**Reagents table (Layer 1 grounding):**
- Built `scripts/extract-reagents.ts` -- PDF to Claude Opus (streaming, 32k tokens), structured JSON extraction, Supabase insert
- Ran against Master Organic Chemistry Reagent Guide PDF (79 pages)
- Result: 113 reagents inserted, 0 skipped, status complete
- Migration: `supabase/migrations/20260517000000_plan3_reagents.sql`
- World-readable SELECT policy; service role for writes

**Klein Chapter 1 ingestion (Layer 2 grounding):**
- Built `scripts/ingest-chapter.ts` -- local version of Archivist that bypasses edge function timeout
- Handles stuck "processing" records automatically before creating new ones
- Uploaded Klein Ch 1 PDF and ran extraction
- Result: 67 knowledge_units inserted (status: complete)
- Edge function timeout is ~150s on free tier -- always use ingest-chapter.ts for full chapters

**exam_questions table (Layer 4 grounding):**
- Migration: `supabase/migrations/20260517010000_plan3_exam_questions.sql`
- Built `scripts/import-question-bank.ts` -- reads markdown batches, Claude extracts structured JSON
- Ran against Q1-Q10 and Q11-Q20 batches
- Result: 20 questions inserted; Q5 and Q15 had difficulty "E-P+" (not in enum), inserted manually as "P+", script updated to normalize mixed difficulties automatically
- All six card fields stored: janice_shortcut, student_visible_trigger, what_student_does, struggle_point, why_easy_in_system, pre_lesson_needed

**nofear-ochem skill -- major upgrade:**
- Source Discipline: six non-negotiable rules at top of skill
- Reagent Lookup Protocol: Bash curl with SUPABASE_ANON_KEY (WebFetch cannot send custom headers)
- Klein Knowledge Units Protocol: Bash curl with SUPABASE_SERVICE_ROLE_KEY, filtered by STUDENT_ID
- Drawing Protocol: screenshotByName, never text descriptions
- 9-section output format (added Source Lookup Summary as Section 1)

**Vertical slice:**
- Concept: Formal Charge (Klein 1.4)
- Queried knowledge_units: 1 unit found (Section 1.4, plain_english_explanation used directly)
- Document written from verified source: `docs/no-fear-ochem/chapter-01/01-04-formal-charge.md`
- Drawings flagged but not yet generated (hydronium, ammonium)

**Env and dependency changes:**
- Added @anthropic-ai/sdk to devDependencies (npm package, not Deno import)
- .env.local now requires both VITE_ prefixed keys (browser) AND unprefixed (scripts) -- see Section 2 note
- STUDENT_ID and COURSE_ID added to .env.local for script use

### Session 06 (2026-05-11) -- Tiny Tactics skill builder, no StudyOS code

Built the `tiny-tactics-close-the-loop-explanation` Claude Code skill at `C:\Users\crm22\.agents\skills\tiny-tactics-close-the-loop-explanation\SKILL.md`.

**Purpose:** Rewrites or validates organic chemistry explanations for struggling students using the close-the-loop pattern. Part of the Tiny Tactics teaching system.

**Iteration 1:**
- Core pattern established: exam term -> plain cause -> plain effect -> exam term again
- 5-field output format: Revised explanation, Exam term used, Plain-language bridge used, Close-the-loop check, If FAIL
- Evals run: 4 test cases, with-skill vs baseline (no-skill)
- Results: 100% with-skill vs 70% baseline

**Iteration 2 (user-directed revision):**
- Problem identified: iteration-1 skill accepted textbook labels ("inductive stabilization," "resonance stabilization," "steric hindrance") as valid closing terms. These are not beginner-safe -- they are names, not explanations.
- Revised skill enforces strict 5-part structure: TERM -> CAUSE -> EFFECT -> CORE EXAM RETURN -> OPTIONAL LABEL
- Core exam outcomes (the only valid closers): more/less stable, stronger/weaker acid, stronger/weaker base, better/worse leaving group, more/less reactive, favored/not favored
- Labels may only appear as optional name tags after the core outcome, always with "which just means..." translation
- Self-check added: 5 questions Claude must ask before finalizing any rewrite
- Bad/good example pairs added for induction, resonance, steric hindrance
- Evals run: 4 test cases, new skill vs old skill
- Results: 100% new skill vs 60% old skill (+40 points)

**Eval workspace:** `C:\Users\crm22\.agents\skills\tiny-tactics-close-the-loop-explanation-workspace\`

**Iteration 3 (2026-05-11 -- today):**
- New vocabulary rule added to skill: every ochem term used anywhere in the explanation (not just the final label) must be translated inline
- Ran evals on the two historically failing cases: eval-2 (induction-no-bridge) and eval-4 (resonance-carboxylate)
- Primary vocab targets PASSED: "conjugate base" and "carboxylate/ion" now correctly translated inline
- Two new gaps found: "electron density" untranslated in label sentence (eval-2), "H+" used as symbol without explanation (eval-4)
- Third issue found: agents were applying the close-the-loop check to their revised output (marking PASS) instead of the original input (should be FAIL)
- All three fixed in SKILL.md:
  - "electron density" added to vocabulary table
  - "proton" entry extended to cover H+ symbol form
  - Close-the-loop check field clarified to say it refers to the ORIGINAL input, not the revised explanation
**Iteration 4 (2026-05-12):**
- Ran all 4 evals against the updated SKILL.md (evals 1-3 as regression checks, eval-4 as targeted fix verification)
- All three targeted fixes confirmed:
  - "electron density" now translated inline even in the label sentence (eval-2: the failing case)
  - H+ now translated inline when it is the primary concept being discussed (evals 3 and 4)
  - Close-the-loop check field now consistently refers to the original input -- all 4 evals correctly output FAIL for the original
- Stale eval assertion updated: the old wording said explanations must "end on a core exam outcome -- not a textbook label." The corrected wording now allows ending on a translated optional label (step 5) provided the core exam outcome appeared before it and the label uses "which just means..." translation. Old wording conflicted with the skill's own GOOD examples.
- One acceptable H+ shorthand issue noted and accepted for v1: when H+ appears embedded inside another term's inline definition (e.g., "the leftover piece after the acid gives away H+"), it is not independently translated. This is contextually defensible -- H+ is incidental shorthand there, not an introduced concept. No fix needed for v1.
- Possible v1.1 improvement: if student confusion appears around H+ in the conjugate base context, add a note to the skill that H+ should be translated even when embedded inside another term's definition.
- **Skill frozen as v1. SKILL.md updated with version: v1 and status: frozen.**

### Session 11 (2026-06-02) -- Module 3 Exam Intelligence pipeline + UI

Full Module 3 spec written and all 7 tasks implemented this session using subagent-driven development. Pipeline code complete and verified; migration not yet applied; data not yet ingested.

**Schema (migration written, not yet run):**
- New `source_exams` table: one row per exam file
- `exam_questions` extended with 10 new columns (hint, answer_image_url, source_exam_id, exam_number, exam_year, question_order, point_value, sub_parts, has_structure, raw_text)

**Pipeline scripts built:**
- `parse-exam-sheet.ts` -- pdfjs-dist text extraction, regex question parser. Tested on 11JRF17ex1.pdf: 7 questions, all point values, Q4 a-e sub-parts detected. pdfjs-dist required `legacy/build/pdf.mjs` import + `require.resolve` for worker path on Windows.
- `propose-topics.ts` -- Claude Haiku topic proposal across all question sheets. Fixed ESM main guard bug (parse-exam-sheet was calling `run()` on import, killing the process silently). Script now runs correctly.
- `render-key-pages.py` + `render-key-pages.ts` -- PyMuPDF renderer + TypeScript wrapper. Tested on 11JRF17ex1k.pdf: 7 PNGs rendered clean. Windows `\r\n` line ending fix applied.
- `ingest-exam-pairs.ts` -- full pipeline. Per-call API error handling and try/finally cleanup added after code review.
- `build-frequency-map.ts` -- aggregation and console table output.

**UI changes:**
- `DrillPage.tsx` -- three-tier (question -> hint -> answer) replaces two-tier flip
- `ExamPickerPage.tsx` (new) -- topic worksheet + intact-exam picker at `/courses/:id/exam-picker`
- `App.tsx` + `CoursePage.tsx` -- route and nav link added

**Bug found and fixed:**
`parse-exam-sheet.ts` called `run()` unconditionally at module level. When imported by `propose-topics.ts`, it executed, found no process.argv[2], and called `process.exit(1)` silently. Fixed with `if (path.resolve(process.argv[1] ?? '') === path.resolve(fileURLToPath(import.meta.url)))` guard.

**Tests:** 29 passing, 0 failures. Build clean.

---

## STRATEGIC CHECKPOINT (2026-05-09) -- Before Plan 3

### What is working

- **Archivist extraction:** 29 knowledge units extracted from a real document. Pipeline is end-to-end live.
- **Electron Tactics prototype (separate codebase):** Students complete tiny missions, earn power-ups, unlock levels. The game loop feels engaging enough to replay.

### New strategic direction under evaluation

A potential connection has been identified between the two systems: extracted knowledge units from the Archivist could feed directly into a Tiny Tactics game engine, turning each knowledge unit into a playable mission rather than a flashcard.

Key concept: after a learner masters a tiny skill, offer an optional **"Ultimate Game" bridge mission** -- a larger final-task problem (e.g. a full organic chemistry synthesis) that shows exactly where that tiny skill appears inside a real exam scenario. This closes the gap between isolated recall and applied performance.

### Hold on Plan 3

Do NOT start Plan 3 (Memory Coach) until a decision is made on the following question:

**Should Memory Coach support the Tiny Tactics learning game loop, or become a separate spaced-repetition feature?**

If the answer is "support the game loop," the schema and agent design for Plan 3 will look very different from a conventional SRS system. Decide first, then plan.
