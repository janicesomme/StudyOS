# StudyOS Module 1 — No Fear Chapter Translator

## Goal
Add the missing front door to the existing No-Fear trainer: a route that
takes a dense chapter and returns (1) big concepts, (2) plain-English
rewrite, (3) recall questions in the EXISTING question schema, so output
flows straight into the trainer's drill queue.

## Hard constraints
- Conform to the existing question type in src/lib/customQuestions.ts — do
  NOT invent a new shape. Generated questions must populate via the same
  path the content studio uses.
- Stack stays as-is: React/TS, TanStack Router, shadcn, Vite, Anthropic SDK.
- One API call returns strict JSON; validate with Zod before use.
- Subject-agnostic engine: ochem-specific behaviour lives in a
  `subjectProfile` config, not hardcoded. Ochem is the default profile.

## Build steps
1. Read src/lib/customQuestions.ts and the question type. Report the shape
   before writing anything.
2. Add src/routes/chapter-translator.tsx (input: paste/upload chapter).
3. Add the API call + Zod schema returning { concepts[], plainEnglish,
   questions[] } where questions[] matches the existing type exactly.
4. Wire questions[] into customQuestions so they appear in the drill queue.
5. Render concepts + plainEnglish in chapter-guides.$chapterId.tsx.
6. Run the build, fix type errors, confirm the drill loop works end to end.

## Definition of done
Paste an ochem chapter → see concepts + plain English → one click → drill
the generated questions in the existing trainer.