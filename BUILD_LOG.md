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

### Plan 2 -- CODE COMPLETE, SUPABASE SETUP INCOMPLETE

All code is written, committed, and passing (29 tests green, build clean). The app will not work end-to-end until the Supabase manual steps below are completed.

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

### Test state
- 29 tests passing, 0 failures
- Build: clean

---

## 3. Next Steps

### IMMEDIATE -- Complete the Supabase manual setup for Plan 2

The code is done. These are the three things still needed before first QA run. Do them in order.

---

### STEP A: Run the database migration

Go to your Supabase dashboard. Click **SQL Editor** in the left sidebar. Click **New query**. Open the file `supabase/migrations/20260508010000_plan2_archivist.sql` in VS Code, copy the entire contents, paste into the SQL editor, and click **Run**.

Expected result: `Success. No rows returned.`

Then click **Table Editor** in the left sidebar and confirm that `source_materials` and `knowledge_units` now appear in the list. Both should show a lock icon (RLS enabled).

---

### STEP B: Add Storage policies

The `course-materials` bucket already exists. Now add 4 security policies so students can only access their own files.

In the Supabase dashboard: click **Storage** in the left sidebar, then click the **Policies** tab at the top. Find `course-materials` in the list and click **New policy**. Choose **For full customization**.

The policy editor has individual fields -- do NOT paste the full SQL statement. Fill in the fields exactly as shown below for each policy.

---

**Policy 1 of 4**

- Policy name: `Users can download their own files`
- Allowed operation: SELECT
- USING expression (paste only this, nothing else):

```
bucket_id = 'course-materials' AND auth.uid()::text = (storage.foldername(name))[1]
```

Click **Save**.

---

**Policy 2 of 4**

Click **New policy** again. Choose **For full customization**.

- Policy name: `Users can upload to their own folder`
- Allowed operation: INSERT
- WITH CHECK expression (paste only this, nothing else):

```
bucket_id = 'course-materials' AND auth.uid()::text = (storage.foldername(name))[1]
```

Click **Save**.

---

**Policy 3 of 4**

Click **New policy** again. Choose **For full customization**.

- Policy name: `Users can update their own files`
- Allowed operation: UPDATE
- USING expression (paste only this, nothing else):

```
bucket_id = 'course-materials' AND auth.uid()::text = (storage.foldername(name))[1]
```

Click **Save**.

---

**Policy 4 of 4**

Click **New policy** again. Choose **For full customization**.

- Policy name: `Users can delete their own files`
- Allowed operation: DELETE
- USING expression (paste only this, nothing else):

```
bucket_id = 'course-materials' AND auth.uid()::text = (storage.foldername(name))[1]
```

Click **Save**.

---

### STEP C: Deploy the Archivist edge function

This deploys the AI extraction function to Supabase and gives it your Anthropic API key.

Run these commands one at a time in a PowerShell terminal from the project folder (`C:\Users\crm22\StudyOS`):

**1. Install the Supabase CLI:**
```
npm install -g supabase
```

**2. Log in to Supabase:**
```
supabase login
```
This opens a browser tab. Click to confirm. Come back to the terminal when done.

**3. Find your project ref:**
In the Supabase dashboard, click **Settings** (gear icon at the bottom of the left sidebar), then click **General**. Copy the **Reference ID** -- it is a 16-character string like `abcdefghijklmnop`.

**4. Link the project:**
```
supabase link --project-ref YOUR_REFERENCE_ID_HERE
```
It will ask for your database password. This is the password you set when you created the Supabase project.

**5. Deploy the function:**
```
supabase functions deploy archivist --project-ref YOUR_REFERENCE_ID_HERE
```

**6. Set your Anthropic API key:**
```
supabase secrets set ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY_HERE --project-ref YOUR_REFERENCE_ID_HERE
```
Your Anthropic API key is at console.anthropic.com -- click API Keys in the left sidebar.

---

### After completing Steps A, B, and C: First QA test

Start the dev server (`npm run dev`) and do this test:

1. Sign in
2. Click a course on the dashboard -- it should navigate to `/courses/{id}`
3. Create a small text file on your desktop with a few sentences about any topic (e.g. paste in a paragraph from Wikipedia). Save it as `test.txt`.
4. Click the file picker on the CoursePage, select `test.txt`, click Upload
5. A card should appear showing status **pending**, then change to **processing**, then **complete** -- without you refreshing the page
6. Click the completed card -- knowledge units extracted from your text should appear on the right

---

### After Plan 2

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
