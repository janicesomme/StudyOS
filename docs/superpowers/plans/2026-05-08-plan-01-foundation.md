# StudyOS Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the complete StudyOS project foundation — Vite + React + TypeScript, full Supabase schema (16 tables with RLS), auth flow (signup/login), course creation, and dashboard shell. A student can sign up, create a course, and see a working dashboard.

**Architecture:** Vite + React SPA communicating directly with Supabase for auth and data. All 16 schema tables created in a single migration with RLS policies locking every row to its owner. Protected routing guards all dashboard pages. TypeScript types mirror the schema exactly.

**Tech Stack:** React 18, TypeScript, Vite, Supabase (auth + database), React Router v6, Tailwind CSS, Vitest, React Testing Library

---

### Task 1: Scaffold the Vite project

**Files:**
- Creates: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Run Vite scaffolding inside the StudyOS folder**

```
cd C:\Users\crm22\StudyOS
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Please choose how to proceed:", choose **Ignore files and continue**.

Expected output: `Done. Now run: npm install`

- [ ] **Step 2: Install base dependencies**

```
npm install
```

Expected: `added N packages` with no errors.

- [ ] **Step 3: Verify the dev server starts**

```
npm run dev
```

Open `http://localhost:5173` in browser. You should see the default Vite + React page. Stop the server (`Ctrl+C`).

- [ ] **Step 4: Commit**

```
git add . && git commit -m "feat: scaffold Vite React TypeScript project"
```

---

### Task 2: Install dependencies

**Files:**
- Modifies: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```
npm install @supabase/supabase-js react-router-dom
```

- [ ] **Step 2: Install Tailwind CSS**

```
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```

- [ ] **Step 3: Install test dependencies**

```
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 4: Commit**

```
git add . && git commit -m "feat: add supabase, router, tailwind, and testing dependencies"
```

---

### Task 3: Configure Vite, Tailwind, and test environment

**Files:**
- Modify: `vite.config.ts`
- Modify: `tailwind.config.js`
- Modify: `src/index.css`
- Create: `src/setupTests.ts`

- [ ] **Step 1: Replace vite.config.ts**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
```

- [ ] **Step 2: Create test setup file**

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Update tailwind.config.js**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Replace src/index.css**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Add test script to package.json**

Open `package.json` and add `"test": "vitest"` to the `"scripts"` section:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest"
}
```

- [ ] **Step 6: Verify test runner works**

```
npm test
```

Expected: `No test files found` or similar — no errors, just no tests yet. Press `q` to exit.

- [ ] **Step 7: Commit**

```
git add . && git commit -m "feat: configure vite test environment and tailwind"
```

---

### Task 4: Supabase project setup and environment

**Files:**
- Create: `.env.local`

- [ ] **Step 1: Create a new Supabase project**

Go to [supabase.com](https://supabase.com), sign in, and create a new project named `studyos`. Save the database password somewhere safe. Wait for provisioning to complete (~2 minutes).

- [ ] **Step 2: Get credentials**

In the Supabase dashboard: **Settings** (gear icon) → **API**. Copy:
- **Project URL** (e.g. `https://xxxx.supabase.co`)
- **anon public key** (long JWT under "Project API keys")

- [ ] **Step 3: Create .env.local in the StudyOS root**

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

`.env.local` is already in `.gitignore` — it will never be committed.

- [ ] **Step 4: Confirm .env.local is gitignored**

```
git status
```

`.env.local` must NOT appear in the output. If it does, add it to `.gitignore` before continuing.

---

### Task 5: Create Supabase client

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Create the client module**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Commit**

```
git add src/lib/supabase.ts && git commit -m "feat: add typed supabase client"
```

---

### Task 6: Write TypeScript database types

**Files:**
- Create: `src/types/database.ts`

- [ ] **Step 1: Create the types file**

Every table has `Row` (what you read), `Insert` (what you write), and `Update` (what you patch). Convenience type aliases appear at the bottom.

```typescript
// src/types/database.ts
export type Database = {
  public: {
    Tables: {
      students: {
        Row: { id: string; email: string; name: string; onboarding_complete: boolean; created_at: string }
        Insert: { id?: string; email: string; name: string; onboarding_complete?: boolean; created_at?: string }
        Update: { email?: string; name?: string; onboarding_complete?: boolean }
      }
      student_profile: {
        Row: { id: string; student_id: string; learning_style: string | null; attention_span_minutes: number | null; academic_level: string | null; pressure_context: string | null; goals: string | null; preferred_explanation_styles: string[]; updated_at: string }
        Insert: { id?: string; student_id: string; learning_style?: string | null; attention_span_minutes?: number | null; academic_level?: string | null; pressure_context?: string | null; goals?: string | null; preferred_explanation_styles?: string[] }
        Update: { learning_style?: string | null; attention_span_minutes?: number | null; academic_level?: string | null; pressure_context?: string | null; goals?: string | null; preferred_explanation_styles?: string[]; updated_at?: string }
      }
      assessment_responses: {
        Row: { id: string; student_id: string; question: string; response: string; created_at: string }
        Insert: { id?: string; student_id: string; question: string; response: string; created_at?: string }
        Update: never
      }
      courses: {
        Row: { id: string; student_id: string; name: string; subject: string; institution: string | null; semester: string | null; exam_date: string | null; created_at: string }
        Insert: { id?: string; student_id: string; name: string; subject: string; institution?: string | null; semester?: string | null; exam_date?: string | null; created_at?: string }
        Update: { name?: string; subject?: string; institution?: string | null; semester?: string | null; exam_date?: string | null }
      }
      source_materials: {
        Row: { id: string; student_id: string; course_id: string; title: string; file_type: string; file_url: string | null; extraction_confidence: number | null; needs_review: boolean; processing_status: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'; created_at: string }
        Insert: { id?: string; student_id: string; course_id: string; title: string; file_type: string; file_url?: string | null; extraction_confidence?: number | null; needs_review?: boolean; processing_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'; created_at?: string }
        Update: { title?: string; file_url?: string | null; extraction_confidence?: number | null; needs_review?: boolean; processing_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'partial' }
      }
      knowledge_units: {
        Row: { id: string; student_id: string; course_id: string; source_material_id: string | null; concept_name: string; plain_english_explanation: string; topic: string | null; subtopic: string | null; difficulty_level: number | null; prerequisite_concept_ids: string[]; common_misconceptions: string | null; testability_score: number | null; extraction_confidence: number | null; source_location: string | null; created_by_agent: string; reviewed: boolean; created_at: string }
        Insert: { id?: string; student_id: string; course_id: string; source_material_id?: string | null; concept_name: string; plain_english_explanation: string; topic?: string | null; subtopic?: string | null; difficulty_level?: number | null; prerequisite_concept_ids?: string[]; common_misconceptions?: string | null; testability_score?: number | null; extraction_confidence?: number | null; source_location?: string | null; created_by_agent?: string; reviewed?: boolean; created_at?: string }
        Update: { concept_name?: string; plain_english_explanation?: string; topic?: string | null; subtopic?: string | null; difficulty_level?: number | null; prerequisite_concept_ids?: string[]; common_misconceptions?: string | null; testability_score?: number | null; extraction_confidence?: number | null; reviewed?: boolean }
      }
      recall_sessions: {
        Row: { id: string; student_id: string; course_id: string; started_at: string; completed_at: string | null; session_length_minutes: number | null }
        Insert: { id?: string; student_id: string; course_id: string; started_at?: string; completed_at?: string | null; session_length_minutes?: number | null }
        Update: { completed_at?: string | null; session_length_minutes?: number | null }
      }
      recall_results: {
        Row: { id: string; recall_session_id: string; knowledge_unit_id: string; student_id: string; result: 'correct' | 'incorrect' | 'partial'; confidence_level: number | null; next_review_date: string | null; created_at: string }
        Insert: { id?: string; recall_session_id: string; knowledge_unit_id: string; student_id: string; result: 'correct' | 'incorrect' | 'partial'; confidence_level?: number | null; next_review_date?: string | null }
        Update: { result?: 'correct' | 'incorrect' | 'partial'; confidence_level?: number | null; next_review_date?: string | null }
      }
      knowledge_gaps: {
        Row: { id: string; student_id: string; knowledge_unit_id: string; gap_severity: number; identified_at: string; resolved_at: string | null }
        Insert: { id?: string; student_id: string; knowledge_unit_id: string; gap_severity: number; identified_at?: string; resolved_at?: string | null }
        Update: { gap_severity?: number; resolved_at?: string | null }
      }
      misconceptions: {
        Row: { id: string; student_id: string; course_id: string; knowledge_unit_id: string; misconception_description: string; evidence_source: 'recall' | 'chat' | 'session'; correction_strategy: string | null; resolved: boolean; identified_at: string; resolved_at: string | null }
        Insert: { id?: string; student_id: string; course_id: string; knowledge_unit_id: string; misconception_description: string; evidence_source: 'recall' | 'chat' | 'session'; correction_strategy?: string | null; resolved?: boolean; identified_at?: string; resolved_at?: string | null }
        Update: { misconception_description?: string; correction_strategy?: string | null; resolved?: boolean; resolved_at?: string | null }
      }
      study_assets: {
        Row: { id: string; student_id: string; course_id: string; asset_type: 'summary' | 'flashcard' | 'practice_question' | 'hint' | 'review_pack'; content: string; knowledge_unit_id: string | null; created_by_agent: string; created_at: string }
        Insert: { id?: string; student_id: string; course_id: string; asset_type: 'summary' | 'flashcard' | 'practice_question' | 'hint' | 'review_pack'; content: string; knowledge_unit_id?: string | null; created_by_agent: string; created_at?: string }
        Update: { content?: string; asset_type?: 'summary' | 'flashcard' | 'practice_question' | 'hint' | 'review_pack' }
      }
      interaction_history: {
        Row: { id: string; student_id: string; course_id: string | null; agent: string; message_role: 'user' | 'assistant'; content: string; created_at: string }
        Insert: { id?: string; student_id: string; course_id?: string | null; agent: string; message_role: 'user' | 'assistant'; content: string; created_at?: string }
        Update: never
      }
      sessions: {
        Row: { id: string; student_id: string; started_at: string; ended_at: string | null; agents_used: string[] }
        Insert: { id?: string; student_id: string; started_at?: string; ended_at?: string | null; agents_used?: string[] }
        Update: { ended_at?: string | null; agents_used?: string[] }
      }
      teaching_approaches: {
        Row: { id: string; student_id: string; approach_description: string; effectiveness_score: number | null; last_used_at: string | null }
        Insert: { id?: string; student_id: string; approach_description: string; effectiveness_score?: number | null; last_used_at?: string | null }
        Update: { approach_description?: string; effectiveness_score?: number | null; last_used_at?: string | null }
      }
      behavior_signals: {
        Row: { id: string; student_id: string; knowledge_unit_id: string; signal_type: 'avoided' | 'rushed' | 'repeated' | 'extended'; recorded_at: string }
        Insert: { id?: string; student_id: string; knowledge_unit_id: string; signal_type: 'avoided' | 'rushed' | 'repeated' | 'extended'; recorded_at?: string }
        Update: never
      }
    }
  }
}

export type Student = Database['public']['Tables']['students']['Row']
export type StudentProfile = Database['public']['Tables']['student_profile']['Row']
export type AssessmentResponse = Database['public']['Tables']['assessment_responses']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type SourceMaterial = Database['public']['Tables']['source_materials']['Row']
export type KnowledgeUnit = Database['public']['Tables']['knowledge_units']['Row']
export type RecallSession = Database['public']['Tables']['recall_sessions']['Row']
export type RecallResult = Database['public']['Tables']['recall_results']['Row']
export type KnowledgeGap = Database['public']['Tables']['knowledge_gaps']['Row']
export type Misconception = Database['public']['Tables']['misconceptions']['Row']
export type StudyAsset = Database['public']['Tables']['study_assets']['Row']
export type InteractionHistory = Database['public']['Tables']['interaction_history']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type TeachingApproach = Database['public']['Tables']['teaching_approaches']['Row']
export type BehaviorSignal = Database['public']['Tables']['behavior_signals']['Row']
```

- [ ] **Step 2: Commit**

```
git add src/types/database.ts && git commit -m "feat: add TypeScript types for all 16 database tables"
```

---

### Task 7: Write and run the database migration

**Files:**
- Create: `supabase/migrations/20260508000000_initial_schema.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260508000000_initial_schema.sql

-- students (id matches auth.users.id)
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- student_profile (one per student, auto-created on student insert)
CREATE TABLE student_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'reading_writing', 'kinesthetic')),
  attention_span_minutes INTEGER,
  academic_level TEXT CHECK (academic_level IN ('high_school', 'college')),
  pressure_context TEXT,
  goals TEXT,
  preferred_explanation_styles JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- assessment_responses
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  institution TEXT,
  semester TEXT,
  exam_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- source_materials
CREATE TABLE source_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'text', 'audio', 'video', 'image')),
  file_url TEXT,
  extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence BETWEEN 0 AND 1),
  needs_review BOOLEAN DEFAULT FALSE,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'complete', 'failed', 'partial')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- knowledge_units (atomic heart of the system)
CREATE TABLE knowledge_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  source_material_id UUID REFERENCES source_materials(id) ON DELETE SET NULL,
  concept_name TEXT NOT NULL,
  plain_english_explanation TEXT NOT NULL,
  topic TEXT,
  subtopic TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  prerequisite_concept_ids UUID[] DEFAULT '{}',
  common_misconceptions TEXT,
  testability_score DECIMAL(3,2) CHECK (testability_score BETWEEN 0 AND 1),
  extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence BETWEEN 0 AND 1),
  source_location TEXT,
  created_by_agent TEXT DEFAULT 'archivist',
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- recall_sessions
CREATE TABLE recall_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  session_length_minutes INTEGER
);

-- recall_results
CREATE TABLE recall_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recall_session_id UUID REFERENCES recall_sessions(id) ON DELETE CASCADE,
  knowledge_unit_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  result TEXT NOT NULL CHECK (result IN ('correct', 'incorrect', 'partial')),
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  next_review_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- knowledge_gaps
CREATE TABLE knowledge_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  knowledge_unit_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
  gap_severity INTEGER NOT NULL CHECK (gap_severity BETWEEN 1 AND 5),
  identified_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(student_id, knowledge_unit_id)
);

-- misconceptions
CREATE TABLE misconceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  knowledge_unit_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
  misconception_description TEXT NOT NULL,
  evidence_source TEXT NOT NULL CHECK (evidence_source IN ('recall', 'chat', 'session')),
  correction_strategy TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  identified_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- study_assets
CREATE TABLE study_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('summary', 'flashcard', 'practice_question', 'hint', 'review_pack')),
  content TEXT NOT NULL,
  knowledge_unit_id UUID REFERENCES knowledge_units(id) ON DELETE SET NULL,
  created_by_agent TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- interaction_history
CREATE TABLE interaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  agent TEXT NOT NULL,
  message_role TEXT NOT NULL CHECK (message_role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  agents_used TEXT[] DEFAULT '{}'
);

-- teaching_approaches
CREATE TABLE teaching_approaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  approach_description TEXT NOT NULL,
  effectiveness_score DECIMAL(3,2) CHECK (effectiveness_score BETWEEN 0 AND 1),
  last_used_at TIMESTAMPTZ
);

-- behavior_signals
CREATE TABLE behavior_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  knowledge_unit_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('avoided', 'rushed', 'repeated', 'extended')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_knowledge_units_student_course ON knowledge_units(student_id, course_id);
CREATE INDEX idx_recall_results_student_unit ON recall_results(student_id, knowledge_unit_id);
CREATE INDEX idx_knowledge_gaps_student_resolved ON knowledge_gaps(student_id, resolved_at);
CREATE INDEX idx_source_materials_processing ON source_materials(processing_status);
CREATE INDEX idx_interaction_history_student_agent ON interaction_history(student_id, agent);

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE recall_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recall_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE misconceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_approaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_signals ENABLE ROW LEVEL SECURITY;

-- RLS policies: each student sees only their own rows
CREATE POLICY "students_own" ON students FOR ALL USING (auth.uid() = id);
CREATE POLICY "student_profile_own" ON student_profile FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "assessment_responses_own" ON assessment_responses FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "courses_own" ON courses FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "source_materials_own" ON source_materials FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "knowledge_units_own" ON knowledge_units FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "recall_sessions_own" ON recall_sessions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "recall_results_own" ON recall_results FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "knowledge_gaps_own" ON knowledge_gaps FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "misconceptions_own" ON misconceptions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "study_assets_own" ON study_assets FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "interaction_history_own" ON interaction_history FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "sessions_own" ON sessions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "teaching_approaches_own" ON teaching_approaches FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "behavior_signals_own" ON behavior_signals FOR ALL USING (auth.uid() = student_id);

-- Trigger: auto-create student_profile when a student row is inserted
CREATE OR REPLACE FUNCTION create_student_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_profile (student_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_created
AFTER INSERT ON students
FOR EACH ROW EXECUTE FUNCTION create_student_profile();
```

- [ ] **Step 2: Run the migration in Supabase**

In the Supabase dashboard: click **SQL Editor** → **New query**. Paste the entire SQL above and click **Run**.

Expected: `Success. No rows returned.` — no errors.

- [ ] **Step 3: Verify all 16 tables exist**

In the Supabase dashboard: click **Table Editor**. You should see: `students`, `student_profile`, `assessment_responses`, `courses`, `source_materials`, `knowledge_units`, `recall_sessions`, `recall_results`, `knowledge_gaps`, `misconceptions`, `study_assets`, `interaction_history`, `sessions`, `teaching_approaches`, `behavior_signals`. That is 15 tables — plus `student_profile` is the 16th if not counted above. Confirm all are present.

- [ ] **Step 4: Commit the migration file**

```
git add supabase/ && git commit -m "feat: complete Supabase schema -- 16 tables, RLS policies, indexes"
```

---

### Task 8: useAuth hook (TDD)

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `src/__tests__/hooks/useAuth.test.ts`

- [ ] **Step 1: Create test directory and write the failing test**

```
mkdir -p src/__tests__/hooks
```

```typescript
// src/__tests__/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { useAuth } from '../../hooks/useAuth'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}))

describe('useAuth', () => {
  it('starts with loading true and no session', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    expect(result.current.session).toBeNull()
  })

  it('sets loading false after session check completes', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.loading).toBe(false)
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```
npm test -- useAuth
```

Expected: FAIL — `Cannot find module '../../hooks/useAuth'`

- [ ] **Step 3: Implement useAuth**

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface UseAuthReturn {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error || !data.user) return { error: error as Error | null }
    const { error: insertError } = await supabase
      .from('students')
      .insert({ id: data.user.id, email, name })
    return { error: insertError as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { session, loading, signIn, signUp, signOut }
}
```

- [ ] **Step 4: Run to confirm it passes**

```
npm test -- useAuth
```

Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```
git add src/hooks/useAuth.ts src/__tests__/hooks/useAuth.test.ts && git commit -m "feat: add useAuth hook with tests"
```

---

### Task 9: LoginForm component (TDD)

**Files:**
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/__tests__/components/LoginForm.test.tsx`

- [ ] **Step 1: Create test directory and write the failing test**

```
mkdir -p src/__tests__/components
```

```typescript
// src/__tests__/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { LoginForm } from '../../components/auth/LoginForm'

describe('LoginForm', () => {
  it('renders email, password inputs and submit button', () => {
    render(<LoginForm onSubmit={vi.fn()} loading={false} error={null} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls onSubmit with email and password', async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} loading={false} error={null} />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('test@test.com', 'password123'))
  })

  it('shows error message when error prop is set', () => {
    render(<LoginForm onSubmit={vi.fn()} loading={false} error="Invalid credentials" />)
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('disables submit button when loading', () => {
    render(<LoginForm onSubmit={vi.fn()} loading={true} error={null} />)
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```
npm test -- LoginForm
```

Expected: FAIL — `Cannot find module '../../components/auth/LoginForm'`

- [ ] **Step 3: Implement LoginForm**

```typescript
// src/components/auth/LoginForm.tsx
import { useState, FormEvent } from 'react'

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void
  loading: boolean
  error: string | null
}

export function LoginForm({ onSubmit, loading, error }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(email, password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Run to confirm it passes**

```
npm test -- LoginForm
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```
git add src/components/auth/LoginForm.tsx src/__tests__/components/LoginForm.test.tsx && git commit -m "feat: add LoginForm component with tests"
```

---

### Task 10: SignupForm component (TDD)

**Files:**
- Create: `src/components/auth/SignupForm.tsx`
- Create: `src/__tests__/components/SignupForm.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/components/SignupForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { SignupForm } from '../../components/auth/SignupForm'

describe('SignupForm', () => {
  it('renders name, email, password inputs and submit button', () => {
    render(<SignupForm onSubmit={vi.fn()} loading={false} error={null} />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('calls onSubmit with name, email, and password', async () => {
    const onSubmit = vi.fn()
    render(<SignupForm onSubmit={onSubmit} loading={false} error={null} />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Jane Smith', 'jane@test.com', 'password123'))
  })

  it('shows error message when error prop is set', () => {
    render(<SignupForm onSubmit={vi.fn()} loading={false} error="Email already in use" />)
    expect(screen.getByText('Email already in use')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```
npm test -- SignupForm
```

Expected: FAIL — `Cannot find module '../../components/auth/SignupForm'`

- [ ] **Step 3: Implement SignupForm**

```typescript
// src/components/auth/SignupForm.tsx
import { useState, FormEvent } from 'react'

interface SignupFormProps {
  onSubmit: (name: string, email: string, password: string) => void
  loading: boolean
  error: string | null
}

export function SignupForm({ onSubmit, loading, error }: SignupFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(name, email, password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Run to confirm it passes**

```
npm test -- SignupForm
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```
git add src/components/auth/SignupForm.tsx src/__tests__/components/SignupForm.test.tsx && git commit -m "feat: add SignupForm component with tests"
```

---

### Task 11: Auth pages, routing, and dashboard shell

**Files:**
- Create: `src/components/layout/DashboardShell.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/SignupPage.tsx`
- Create: `src/pages/DashboardPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create DashboardShell**

```typescript
// src/components/layout/DashboardShell.tsx
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function DashboardShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-indigo-600">StudyOS</span>
        <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700">
          Sign out
        </button>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Create LoginPage**

```typescript
// src/pages/LoginPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to StudyOS</p>
        <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />
        <p className="mt-4 text-sm text-center text-gray-500">
          No account?{' '}
          <Link to="/signup" className="text-indigo-600 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create SignupPage**

```typescript
// src/pages/SignupPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { SignupForm } from '../components/auth/SignupForm'
import { useAuth } from '../hooks/useAuth'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (name: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    const { error } = await signUp(email, password, name)
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Get started</h1>
        <p className="text-sm text-gray-500 mb-6">Create your StudyOS account</p>
        <SignupForm onSubmit={handleSubmit} loading={loading} error={error} />
        <p className="mt-4 text-sm text-center text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create DashboardPage shell**

```typescript
// src/pages/DashboardPage.tsx
import { DashboardShell } from '../components/layout/DashboardShell'

export function DashboardPage() {
  return (
    <DashboardShell>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Today's Focus</h2>
          <p className="text-sm text-gray-400">Add a course and upload materials to get started.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">My Courses</h2>
          <p className="text-sm text-gray-400">No courses yet.</p>
        </div>
      </div>
    </DashboardShell>
  )
}
```

- [ ] **Step 5: Wire App.tsx with routing and auth guard**

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 6: Update main.tsx**

```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Start dev server and verify manually**

```
npm run dev
```

- Go to `http://localhost:5173` — should redirect to `/login`
- Try going to `/dashboard` directly — should redirect to `/login`
- Login and signup pages should render correctly
- Stop the server (`Ctrl+C`)

- [ ] **Step 8: Commit**

```
git add src/ && git commit -m "feat: add auth pages, protected routing, and dashboard shell"
```

---

### Task 12: useCourses hook (TDD)

**Files:**
- Create: `src/hooks/useCourses.ts`
- Create: `src/__tests__/hooks/useCourses.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/hooks/useCourses.test.ts
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useCourses } from '../../hooks/useCourses'

const mockEq = vi.fn()
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockInsert = vi.fn().mockResolvedValue({ error: null })

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
    })),
  },
}))

describe('useCourses', () => {
  beforeEach(() => {
    mockEq.mockResolvedValue({ data: [], error: null })
  })

  it('starts with empty courses and loading true', () => {
    const { result } = renderHook(() => useCourses('student-123'))
    expect(result.current.courses).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('loads courses for the student on mount', async () => {
    const mockCourses = [{
      id: '1', name: 'Organic Chemistry', subject: 'Chemistry',
      student_id: 'student-123', institution: null, semester: null,
      exam_date: null, created_at: '2026-05-08'
    }]
    mockEq.mockResolvedValueOnce({ data: mockCourses, error: null })

    const { result } = renderHook(() => useCourses('student-123'))
    await act(async () => {})

    expect(result.current.courses).toEqual(mockCourses)
    expect(result.current.loading).toBe(false)
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```
npm test -- useCourses
```

Expected: FAIL — `Cannot find module '../../hooks/useCourses'`

- [ ] **Step 3: Implement useCourses**

```typescript
// src/hooks/useCourses.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Course } from '../types/database'

interface CreateCourseInput {
  name: string
  subject: string
  institution?: string
  semester?: string
  exam_date?: string
}

interface UseCoursesReturn {
  courses: Course[]
  loading: boolean
  createCourse: (input: CreateCourseInput) => Promise<{ error: Error | null }>
}

export function useCourses(studentId: string | undefined): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) { setLoading(false); return }

    supabase
      .from('courses')
      .select('*')
      .eq('student_id', studentId)
      .then(({ data, error }) => {
        if (!error && data) setCourses(data)
        setLoading(false)
      })
  }, [studentId])

  const createCourse = async (input: CreateCourseInput) => {
    if (!studentId) return { error: new Error('No student ID') }

    const { error } = await supabase
      .from('courses')
      .insert({ ...input, student_id: studentId })

    if (!error) {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('student_id', studentId)
      if (data) setCourses(data)
    }

    return { error: error as Error | null }
  }

  return { courses, loading, createCourse }
}
```

- [ ] **Step 4: Run to confirm it passes**

```
npm test -- useCourses
```

Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```
git add src/hooks/useCourses.ts src/__tests__/hooks/useCourses.test.ts && git commit -m "feat: add useCourses hook with tests"
```

---

### Task 13: Course creation form and wiring into dashboard

**Files:**
- Create: `src/components/courses/CourseForm.tsx`
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Create CourseForm**

```typescript
// src/components/courses/CourseForm.tsx
import { useState, FormEvent } from 'react'

interface CourseFormProps {
  onSubmit: (name: string, subject: string, examDate: string) => void
  loading: boolean
  onCancel: () => void
}

export function CourseForm({ onSubmit, loading, onCancel }: CourseFormProps) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [examDate, setExamDate] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(name, subject, examDate)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="course-name" className="block text-sm font-medium text-gray-700 mb-1">Course name</label>
        <input id="course-name" type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Organic Chemistry 1" required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="course-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input id="course-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="e.g. Chemistry" required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="exam-date" className="block text-sm font-medium text-gray-700 mb-1">Exam date (optional)</label>
        <input id="exam-date" type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Adding...' : 'Add course'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Update DashboardPage to use courses**

```typescript
// src/pages/DashboardPage.tsx
import { useState } from 'react'
import { DashboardShell } from '../components/layout/DashboardShell'
import { CourseForm } from '../components/courses/CourseForm'
import { useCourses } from '../hooks/useCourses'
import { useAuth } from '../hooks/useAuth'

export function DashboardPage() {
  const { session } = useAuth()
  const { courses, loading, createCourse } = useCourses(session?.user.id)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleCreateCourse = async (name: string, subject: string, examDate: string) => {
    setCreating(true)
    await createCourse({ name, subject, exam_date: examDate || undefined })
    setCreating(false)
    setShowForm(false)
  }

  return (
    <DashboardShell>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Today's Focus</h2>
          <p className="text-sm text-gray-400">Add a course and upload materials to get started.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="text-sm text-indigo-600 font-medium hover:underline">
                + Add
              </button>
            )}
          </div>
          {showForm && (
            <CourseForm onSubmit={handleCreateCourse} loading={creating} onCancel={() => setShowForm(false)} />
          )}
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : courses.length === 0 && !showForm ? (
            <p className="text-sm text-gray-400">No courses yet.</p>
          ) : (
            <ul className="space-y-2 mt-2">
              {courses.map(course => (
                <li key={course.id} className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{course.name}</p>
                  <p className="text-xs text-gray-400">{course.subject}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
```

- [ ] **Step 3: Manual end-to-end test**

```
npm run dev
```

1. Go to `http://localhost:5173/signup` — create an account with your real email
2. You should land on `/dashboard`
3. Click **+ Add** in the My Courses panel
4. Enter: name = "Organic Chemistry 1", subject = "Chemistry", pick an exam date
5. Click **Add course** — course should appear in the list
6. Refresh the page — course should still be there (persisted to Supabase)
7. Stop the server

- [ ] **Step 4: Run all tests**

```
npm test
```

Expected: All tests pass — no failures.

- [ ] **Step 5: Final commit**

```
git add . && git commit -m "feat: add course creation and wire into dashboard -- Plan 1 complete"
```

---

## Plan 1 complete

**Deliverable:** A student can sign up, sign in, create a course, and see a working dashboard. All 16 schema tables are live in Supabase with RLS. The foundation every other plan builds on.

**Next:** Plan 2 — The Archivist (file upload + knowledge unit extraction via Claude API).
