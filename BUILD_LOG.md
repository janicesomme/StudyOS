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
- students and student_profile rows are created by SECURITY DEFINER triggers -- the client never INSERTs into them
- Schema-first: no agent is built until the full schema is approved
- All 15 tables designed before any code is written (plan had 16 -- corrected to 15)
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

### What exists right now
```
StudyOS/
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-05-08-studyos-design.md      (full design spec v2)
│       └── plans/
│           └── 2026-05-08-plan-01-foundation.md   (REVISED Plan 1 -- in progress)
├── supabase/
│   └── migrations/
│       └── 20260508000000_plan1_foundation.sql    (RUNS IN SUPABASE -- already applied)
├── src/
│   ├── lib/
│   │   └── supabase.ts                            (typed Supabase client)
│   ├── types/
│   │   └── database.ts                            (Plan 1 temp types -- 3 tables)
│   ├── setupTests.ts
│   ├── main.tsx                                   (Vite default -- will be replaced in Task 12)
│   ├── App.tsx                                    (Vite default -- will be replaced in Task 12)
│   └── index.css                                  (Tailwind v4 import)
├── package.json                                   (React 19, Vite 8, TS 6, Vitest 4)
├── vite.config.ts                                 (Tailwind v4 plugin + vitest config)
├── .env.local                                     (gitignored -- Supabase credentials present)
└── BUILD_LOG.md
```

### Supabase state
- 3 tables live: students, student_profile, courses
- RLS enabled on all 3 with hardened USING + WITH CHECK policies
- Trigger: auth.users INSERT -> students row (SECURITY DEFINER)
- Trigger: students INSERT -> student_profile row (SECURITY DEFINER)
- Email confirmation: DISABLED for local dev

### Plan 1 task progress
- [x] Task 1: Scaffold Vite project
- [x] Task 2: Install dependencies
- [x] Task 3: Configure Vite, Tailwind, test environment
- [x] Task 4: Supabase project setup and .env.local
- [x] Task 5: Create Supabase client
- [x] Task 6: Write TypeScript types (3 tables)
- [x] Task 7: Write and run database migration
- [ ] Task 8: useAuth hook (TDD)
- [ ] Task 9: LoginForm component (TDD)
- [ ] Task 10: SignupForm component (TDD)
- [ ] Task 11: useCourses hook (TDD)
- [ ] Task 12: Pages, routing, dashboard shell
- [ ] Task 13: Build verification and all tests

---

## 3. Next Steps

### Immediate (next session)

**Continue Plan 1 -- Tasks 8-13**

Pick up at Task 8: useAuth hook (TDD).

Plan file: `docs/superpowers/plans/2026-05-08-plan-01-foundation.md`

Tasks 8-13 are pure code -- no more Supabase dashboard work needed until manual QA.

Task 8: useAuth hook (write failing test, implement, pass)
Task 9: LoginForm component (TDD)
Task 10: SignupForm component (TDD)
Task 11: useCourses hook (TDD)
Task 12: Pages, routing, dashboard shell, CourseForm (wire everything together)
Task 13: Build verification + full test suite + manual QA (two-user RLS test)

**Use:** `superpowers:executing-plans` skill to continue execution.

### After Plan 1
- Plan 2: The Archivist (file upload + knowledge unit extraction via Claude API)
- Plan 3: Memory Coach (recall sessions + spaced repetition)
- Plan 4: Study Manager + Today's Focus
- Plan 5: The Professor (onboarding assessment + tutoring)
- Plan 6: Exam Strategist + Note Architect

---

## 4. Key Reference Files

| File | Purpose |
|---|---|
| `docs/superpowers/specs/2026-05-08-studyos-design.md` | Full design spec v2 -- product vision, all agents, 15-table schema |
| `docs/superpowers/plans/2026-05-08-plan-01-foundation.md` | Revised Plan 1 -- task-by-task with code, pick up at Task 8 |

---

## 5. Implementation Notes (for next session)

**Tech versions actually installed (differ from original plan):**
- React 19 (plan assumed 18) -- compatible, no API differences for our usage
- React Router v7 (plan assumed v6) -- BrowserRouter/Routes/Route API still works
- Tailwind CSS v4 (plan assumed v3) -- uses `@import "tailwindcss"` not directives, no tailwind.config.js needed, uses @tailwindcss/vite plugin
- Vite 8, TypeScript 6, Vitest 4 -- all latest, compatible

**Tailwind v4 note:** No `tailwind.config.js` file. Content scanning is automatic. CSS uses `@import "tailwindcss"`. The vite.config.ts already has the `@tailwindcss/vite` plugin wired in.

**TypeScript 6 note:** `tsconfig.app.json` has `"erasableSyntaxOnly": true` and `"verbatimModuleSyntax": true`. Avoid using TypeScript enum syntax or `import type` mixing in the same statement.

**Test runner:** `npm test -- --run` for a single non-watch pass. `npm test` for watch mode.

---

## 6. Session Log

### Session 01 (2026-05-08)
- Brainstormed StudyOS concept from scratch
- Defined target user, product vision, Four Cs architecture
- Designed six-agent system (including Study Manager and Professor)
- Designed 15-table Supabase schema (original plan incorrectly said 16 -- corrected)
- Wrote design spec v2 (incorporating ChatGPT architecture review)
- Initialized repo at C:\Users\crm22\StudyOS
- Wrote Plan 1: Foundation (13 tasks, fully executable)

### Session 02 (2026-05-08)
- Revised Plan 1: reduced scope to 3 tables, hardened RLS, added trigger pattern, fixed email confirmation handling, updated QA to two-user app test
- Scaffolded Vite project (React 19, Vite 8, TypeScript 6)
- Installed all dependencies (Tailwind v4, Vitest 4, Supabase JS, React Router v7)
- Configured Vite for Tailwind v4 + vitest
- Set up Supabase project (renamed existing project to studyos)
- Disabled email confirmation for local dev
- Created .env.local with live credentials
- Ran Plan 1 migration -- 3 tables live with RLS and triggers
- Created typed Supabase client and Plan 1 TypeScript types
- Next: Tasks 8-13 (pure code, no more dashboard work)
