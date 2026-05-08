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
Do NOT ask clarifying questions before giving the summary — read the file, report, then ask.

The working directory is: C:\Users\crm22\StudyOS

---

## 1. What This Project Is

**StudyOS** is a subject-agnostic AI operating system for students. It is a separate, standalone product from the AI OCHEM STUDY SYSTEM (which is the playbook/card system at C:\Users\crm22\AI OCHEM STUDY SYSTEM).

StudyOS combines an AI study assistant and a 24/7 personal tutor. It ingests everything a student learns from, builds a personalized knowledge base, runs specialized agents, and prepares students for exams throughout the semester — not just the night before.

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

**Tech stack:** React + TypeScript + Vite, Supabase (auth + database), Claude API, Tailwind CSS, Vitest

**Key design decisions (locked):**
- students.id = auth.users.id (Supabase auth pattern)
- Schema-first: no agent is built until the full schema is approved
- All 16 tables designed before any code is written
- knowledge_units is the atomic heart of the system
- student_profile feeds every agent; Professor reads it most deeply
- RLS on every table: each student sees only their own rows

---

## 2. Current State

### Repository
- Local: C:\Users\crm22\StudyOS
- Branch: master
- GitHub: not yet set up

### What exists right now
```
StudyOS/
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-05-08-studyos-design.md   (FULL DESIGN SPEC v2 -- read this)
│       └── plans/
│           └── 2026-05-08-plan-01-foundation.md  (PLAN 1 -- ready to execute)
├── supabase/                                      (empty)
├── src/                                           (empty)
├── .gitignore
└── BUILD_LOG.md
```

### No application code has been written yet.
The repo contains only design documents. Plan 1 is written and ready to execute.

---

## 3. Next Steps

### Immediate (next session)

**Execute Plan 1: Foundation**

File: `docs/superpowers/plans/2026-05-08-plan-01-foundation.md`

Plan 1 covers 13 tasks:
- Tasks 1-4: Vite + React + TypeScript scaffold, dependencies, Supabase project setup
- Tasks 5-7: Supabase client, TypeScript types for all 16 tables, full schema migration
- Tasks 8-10: useAuth hook (TDD), LoginForm (TDD), SignupForm (TDD)
- Task 11: Auth pages, protected routing, dashboard shell
- Tasks 12-13: useCourses hook (TDD), course creation form wired into dashboard

**Deliverable from Plan 1:** A student can sign up, sign in, create a course, and see a working dashboard. All 16 schema tables are live in Supabase with RLS.

**How to execute:** Use the `superpowers:subagent-driven-development` skill (recommended) or `superpowers:executing-plans` skill.

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
| `docs/superpowers/specs/2026-05-08-studyos-design.md` | Full design spec v2 -- product vision, all agents, schema, build sequence |
| `docs/superpowers/plans/2026-05-08-plan-01-foundation.md` | Plan 1 -- ready to execute, all 13 tasks with complete code |

---

## 5. Session Log

### Session 01 (2026-05-08)
- Brainstormed StudyOS concept from scratch
- Defined target user, product vision, Four Cs architecture
- Designed six-agent system (including Study Manager and Professor)
- Designed 16-table Supabase schema
- Wrote design spec v2 (incorporating ChatGPT architecture review)
- Initialized repo at C:\Users\crm22\StudyOS
- Wrote Plan 1: Foundation (13 tasks, fully executable)
- Next: Execute Plan 1
