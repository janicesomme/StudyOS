# StudyOS Module 2 — Exam Image Library Ingest + Chapter Matching

## Goal
Turn a teacher's existing library of drawn exam questions (Word docs of
images + topic labels + answer letters) into a tagged, drillable bank, and
surface the RIGHT questions when a student translates a chapter. The drawn
mechanism/structure art is the source of truth — no AI-generated arrows.

## Source material shape (read this before designing)
- Input: .docx files, one per chapter (e.g. Chapter 1 = Structure & Bonding).
- Each file contains many inline images (the actual exam questions, drawn
  with structures/arrows) interleaved with text lines.
- Text lines are mostly TOPIC LABELS acting as section headers
  (e.g. "HYBRIDIZATION", "RESONANCE", "BOILING POINT", "VSEPR") followed in
  some cases by a single-letter ANSWER ("A", "C", "D").
- A label governs a RUN of images: it applies to every image after it until
  the next label appears. One label → several questions is normal.
- Some "labels" are navigation notes, not topics (e.g. "MOVE TO ENANTIOMERS",
  "MOVE TO CHP 3 - REACTIONS"). These are NOT topic tags — detect and skip
  them (heuristic: starts with "MOVE TO", or is a known non-topic phrase).
- Near the end of files, some images may have NO governing label (collected
  but not yet sorted). These must be handled, not guessed.

## Hard constraints
- The image is the question. Store/attach it via the existing
  QuestionImageCard component. Do NOT try to redraw or generate arrows.
- Conform to the existing question schema in src/lib/customQuestions.ts.
  Reuse the same insert path as Module 1 (student_id, course_id, verified
  injected at write time). Do NOT invent a new shape.
- Every ingested question gets verified:false until the teacher approves.
- Stack unchanged: React/TS, TanStack Router, shadcn, Supabase, Anthropic SDK.

## Ingest pipeline (one-time script per chapter file)
1. Parse the .docx in document order, producing an ordered stream of
   {type:'label'|'answer'|'image', value, position}.
2. Carry-down tagging: walk the stream; maintain "current label". When a
   label line appears (and is not a MOVE-TO/navigation note), set current
   label. Each image inherits the current label + the nearest following or
   preceding answer letter if present.
3. Classify each image into one of three states:
   - `labelled`   — had a governing topic label. tag = label, trusted.
   - `ai_suggested` — NO governing label. Send the image to Claude (vision)
     with the list of EXISTING topic labels from this chapter; Claude
     proposes the best-fit topic. Store proposed topic, ai_tagged:true,
     verified:false.
   - `needs_review` — no label AND vision low-confidence / refuses. tag=null,
     flagged for manual triage.
4. Extract images to storage (Supabase storage bucket) and write one
   exam_questions row per image:
   - question_type / topic / pattern  ← the resolved label
   - answer letter (if found)
   - image reference (storage path) for QuestionImageCard
   - verified:false, ai_tagged: (true for state 2/3 else false)
   - leave pedagogical text fields (janice_shortcut, struggle_point, etc.)
     empty/optional for image questions — they are NOT required here the way
     they were for Module 1 generated questions. (Adjust the Zod schema:
     image-sourced questions use a relaxed variant.)
5. Output a summary: counts per state, and a list of every ai_suggested /
   needs_review item for the teacher to approve in one pass.

## Teacher review
- A simple review view: show the flagged images (ai_suggested + needs_review)
  with the proposed topic, a dropdown of existing topics, and an approve
  button that sets verified:true and locks the tag.

## Chapter matching (the student-facing payoff)
- Extend the Module 1 translator result: after producing concepts[] for an
  uploaded chapter, map each concept to the chapter's topic tags (string /
  semantic match against the label set, e.g. concept "geometry around an
  atom" → "VSEPR").
- Surface matching verified image questions into the drill queue alongside
  (or instead of) generated text questions.
- Result for the student: upload Chapter 1 → plain English → THEIR real,
  correctly-drawn exam questions, matched to the chapter → drill.

## Definition of done
- Run ingest on the Chapter 1 docx → bank populated; every image either
  trusted-labelled or flagged for review; navigation notes skipped; orphans
  caught, never silently mislabelled.
- Translate a Chapter 1 text → concepts matched to topics → real drawn exam
  questions appear in the drill queue.

## Build order
1. Adjust customQuestions.ts: add a relaxed Zod variant for image-sourced
   questions (pedagogical text fields optional; image ref required).
2. Write the .docx ingest script (label carry-down + MOVE-TO skip + orphan
   detection + vision-suggest). Run on Chapter 1, report the summary.
3. Build the teacher review view for flagged items.
4. Add concept→topic matching to the translator and surface image questions
   into the drill.
