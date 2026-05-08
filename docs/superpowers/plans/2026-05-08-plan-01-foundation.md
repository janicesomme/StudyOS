# StudyOS Plan 1: Foundation (Revised)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A signed-in student can sign up, sign in, create a course, and see it reload on the dashboard after a hard refresh. The Supabase connection is verified. Auth is protected. RLS is hardened. Nothing else.

**Deliverable check:** Sign up -> land on dashboard -> add a course -> reload the page -> course still there.

**Architecture:** Vite + React SPA communicating directly with Supabase for auth and data. 3 tables (students, student_profile, courses) created with a single migration. students and student_profile are auto-created via SECURITY DEFINER triggers -- the client never INSERTs into them directly. Protected routing guards all dashboard pages.

**Tech Stack:** React 18, TypeScript, Vite, Supabase (auth + database), React Router v6, Tailwind CSS, Vitest, React Testing Library

---

## Tables in this plan (3 of 15 total)

| Table | Why Plan 1 | Created by |
|---|---|---|
| `students` | Identity layer -- every other table references this | SECURITY DEFINER trigger on auth.users insert |
| `student_profile` | Auto-created on student insert | SECURITY DEFINER trigger on students insert |
| `courses` | First meaningful thing a student does | Client INSERT with RLS |

All other tables (assessment_responses, source_materials, knowledge_units, recall_sessions, recall_results, knowledge_gaps, misconceptions, study_assets, interaction_history, sessions, teaching_approaches, behavior_signals) are deferred to later plans.

---

## Files created in this plan

```
src/
  lib/
    supabase.ts
  types/
    database.ts              (PLAN 1 TEMPORARY -- 3 tables only)
  hooks/
    useAuth.ts
    useCourses.ts
  components/
    auth/
      LoginForm.tsx
      SignupForm.tsx
    courses/
      CourseForm.tsx
    layout/
      DashboardShell.tsx
  pages/
    LoginPage.tsx
    SignupPage.tsx
    DashboardPage.tsx
  App.tsx
  main.tsx
  setupTests.ts
  __tests__/
    hooks/
      useAuth.test.ts
      useCourses.test.ts
    components/
      LoginForm.test.tsx
      SignupForm.test.tsx

supabase/
  migrations/
    20260508000000_plan1_foundation.sql

.env.local
```

---

### Task 1: Scaffold the Vite project

**Files:**
- Creates: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Run Vite scaffolding inside the StudyOS folder**

```
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

Open `http://localhost:5173` in browser. You should see the default Vite + React page. Stop the server (Ctrl+C).

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
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Replace src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Add test script to package.json**

Add `"test": "vitest"` to the `"scripts"` section.

- [ ] **Step 6: Verify test runner works**

```
npm test
```

Expected: `No test files found` or similar -- no errors. Press `q` to exit.

- [ ] **Step 7: Commit**

```
git add . && git commit -m "feat: configure vite test environment and tailwind"
```

---

### Task 4: Supabase project setup and environment

**Files:**
- Create: `.env.local`

- [ ] **Step 1: Create a new Supabase project**

Go to supabase.com, sign in, and create a new project named `studyos`. Save the database password. Wait for provisioning (~2 minutes).

- [ ] **Step 2: Disable email confirmation (development)**

In the Supabase dashboard: **Authentication** -> **Settings** -> scroll to **Email Auth** -> turn off **Enable email confirmations**. Save.

This gives an immediate session on signup, which keeps local testing simple. The code still handles the no-session path in case this is re-enabled later.

- [ ] **Step 3: Get credentials**

**Settings** (gear icon) -> **API**. Copy Project URL and anon public key.

- [ ] **Step 4: Create .env.local**

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 5: Confirm .env.local is gitignored**

```
git status
```

`.env.local` must NOT appear. If it does, add it to `.gitignore` before continuing.

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

### Task 6: Write TypeScript database types (Plan 1 only)

**Files:**
- Create: `src/types/database.ts`

> PLAN 1 TEMPORARY -- covers only the 3 tables created in this plan. Replace with `supabase gen types typescript` after all plan migrations are stable.

- [ ] **Step 1: Create the types file**

```typescript
// src/types/database.ts
// PLAN 1 TEMPORARY -- 3 tables only. Replace with generated types after migrations stabilize.
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
      courses: {
        Row: { id: string; student_id: string; name: string; subject: string; institution: string | null; semester: string | null; exam_date: string | null; created_at: string }
        Insert: { id?: string; student_id: string; name: string; subject: string; institution?: string | null; semester?: string | null; exam_date?: string | null; created_at?: string }
        Update: { name?: string; subject?: string; institution?: string | null; semester?: string | null; exam_date?: string | null }
      }
    }
  }
}

export type Student = Database['public']['Tables']['students']['Row']
export type StudentProfile = Database['public']['Tables']['student_profile']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
```

- [ ] **Step 2: Commit**

```
git add src/types/database.ts && git commit -m "feat: add Plan 1 temporary TypeScript types (3 tables)"
```

---

### Task 7: Write and run the database migration

**Files:**
- Create: `supabase/migrations/20260508000000_plan1_foundation.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260508000000_plan1_foundation.sql

-- students (id = auth.users.id -- created by trigger, never inserted by client)
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- student_profile (one per student, auto-created by trigger on students insert)
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

-- courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  institution TEXT,
  semester TEXT,
  exam_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common course queries
CREATE INDEX idx_courses_student ON courses(student_id);

-- Trigger 1: auto-create students row when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.students (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger 2: auto-create student_profile when students row is created
CREATE OR REPLACE FUNCTION handle_new_student()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.student_profile (student_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_created
  AFTER INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION handle_new_student();

-- Enable RLS on all 3 tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- RLS: students
-- Trigger handles INSERT (SECURITY DEFINER bypasses RLS) -- no INSERT policy needed
CREATE POLICY "students_select_own"
  ON students FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "students_update_own"
  ON students FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS: student_profile
-- Trigger handles INSERT (SECURITY DEFINER bypasses RLS) -- no INSERT policy needed
CREATE POLICY "student_profile_select_own"
  ON student_profile FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "student_profile_update_own"
  ON student_profile FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- RLS: courses (client manages all operations)
CREATE POLICY "courses_select_own"
  ON courses FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "courses_insert_own"
  ON courses FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "courses_update_own"
  ON courses FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "courses_delete_own"
  ON courses FOR DELETE
  USING (auth.uid() = student_id);
```

- [ ] **Step 2: Run the migration in Supabase**

In the Supabase dashboard: click **SQL Editor** -> **New query**. Paste the entire SQL above and click **Run**.

Expected: `Success. No rows returned.` -- no errors.

- [ ] **Step 3: Verify tables exist**

In **Table Editor**: confirm `students`, `student_profile`, and `courses` are present. Confirm RLS is enabled on all three (lock icon visible).

- [ ] **Step 4: Commit the migration file**

```
git add supabase/ && git commit -m "feat: Plan 1 migration -- 3 tables, RLS, triggers"
```

---

### Task 8: useAuth hook (TDD)

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `src/__tests__/hooks/useAuth.test.ts`

- [ ] **Step 1: Create test directory and write the failing test**

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

Expected: FAIL -- `Cannot find module '../../hooks/useAuth'`

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
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null; emailSent: boolean }>
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
    if (error) return { error: error as Error | null, emailSent: false }
    // data.session is null when email confirmation is required
    const emailSent = !data.session
    return { error: null, emailSent }
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

Expected: PASS -- 2 tests passing.

- [ ] **Step 5: Commit**

```
git add src/hooks/useAuth.ts src/__tests__/hooks/useAuth.test.ts && git commit -m "feat: add useAuth hook with tests"
```

---

### Task 9: LoginForm component (TDD)

**Files:**
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/__tests__/components/LoginForm.test.tsx`

- [ ] **Step 1: Write the failing test**

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

Expected: PASS -- 4 tests passing.

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

Expected: PASS -- 3 tests passing.

- [ ] **Step 5: Commit**

```
git add src/components/auth/SignupForm.tsx src/__tests__/components/SignupForm.test.tsx && git commit -m "feat: add SignupForm component with tests"
```

---

### Task 11: useCourses hook (TDD)

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

Expected: PASS -- 2 tests passing.

- [ ] **Step 5: Commit**

```
git add src/hooks/useCourses.ts src/__tests__/hooks/useCourses.test.ts && git commit -m "feat: add useCourses hook with tests"
```

---

### Task 12: Pages, routing, and dashboard shell

**Files:**
- Create: `src/components/layout/DashboardShell.tsx`
- Create: `src/components/courses/CourseForm.tsx`
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

- [ ] **Step 2: Create CourseForm**

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

- [ ] **Step 3: Create LoginPage**

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

- [ ] **Step 4: Create SignupPage (handles both immediate session and email confirmation)**

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
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (name: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    const { error, emailSent } = await signUp(email, password, name)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else if (emailSent) {
      setEmailSent(true)
    } else {
      navigate('/dashboard')
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-sm text-gray-500">
            We sent a confirmation link to your email address. Click it to activate your account, then{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">sign in</Link>.
          </p>
        </div>
      </div>
    )
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

- [ ] **Step 5: Create DashboardPage**

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

- [ ] **Step 6: Wire App.tsx**

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

- [ ] **Step 7: Update main.tsx**

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

- [ ] **Step 8: Commit**

```
git add src/ && git commit -m "feat: add auth pages, protected routing, dashboard shell, and course creation"
```

---

### Task 13: Build verification and all tests

- [ ] **Step 1: Run full test suite**

```
npm test
```

Expected: All tests pass -- no failures.

- [ ] **Step 2: Run build**

```
npm run build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 3: Final commit if needed**

If any fixes were required, commit them:

```
git add . && git commit -m "fix: resolve build or test issues"
```

---

## Manual QA checklist

After `npm run dev`:

- [ ] `/` redirects to `/login`
- [ ] `/dashboard` (unauthenticated) redirects to `/login`
- [ ] LoginPage and SignupPage render without errors
- [ ] Sign up as User A -- confirm immediate redirect to `/dashboard` (email confirmation is disabled)
- [ ] Click "+ Add" -> fill in course name and subject -> click "Add course"
- [ ] Course appears in the list
- [ ] Hard-refresh -- course still there (confirms Supabase persistence)
- [ ] Sign out -- redirected to `/login`

**Two-user RLS test (required):**
- [ ] Sign up / sign in as **User A** -> create at least one course -> sign out
- [ ] Sign up / sign in as **User B** (different email) -> confirm the dashboard shows only User B's courses -- User A's course must not appear
- [ ] Create a course as User B -> confirm only User B's courses are listed
- [ ] Sign out User B -> sign back in as User A -> confirm only User A's courses are visible

**Supabase dashboard verification:**
- [ ] In Table Editor: confirm `students` row, `student_profile` row (auto-created by trigger), and `courses` row all exist for each test user

---

## Risks and assumptions

| Item | Detail |
|---|---|
| Email confirmation | **Disabled for local development** (Auth > Settings > Enable email confirmations OFF). Code still handles the `emailSent` path in SignupPage for when this is re-enabled before shipping. Document in team notes before going to production. |
| Trigger on auth.users | Requires name to be passed as `options.data.name` in signUp. Trigger falls back to email prefix if missing. |
| TypeScript types | Hand-written, covers 3 tables only. Marked PLAN 1 TEMPORARY. Replace with `supabase gen types typescript` after migrations stabilize in a later plan. |
| Vite scaffold in non-empty directory | Choose "Ignore files and continue". Verify with `git status` after -- existing files (BUILD_LOG.md, docs/) must still be present. |
| Supabase provisioning time | Task 4 is a natural pause (~2 minutes). Do not proceed to Task 5 until credentials are confirmed. |
| student_profile INSERT policy | No client INSERT policy is set because the trigger handles creation. If a future plan requires client-side profile creation, add the INSERT policy then. |

---

## Deferred to later plans

| Item | Plan |
|---|---|
| assessment_responses | Plan 5 (Professor onboarding) |
| source_materials, knowledge_units | Plan 2 (Archivist) |
| recall_sessions, recall_results, knowledge_gaps, misconceptions | Plan 3 (Memory Coach) |
| study_assets | Plan 5/6 |
| interaction_history, sessions, teaching_approaches, behavior_signals | Plan 4 (Professor / Study Manager) |
| supabase gen types (full generated types) | After Plan 2 migration |
| Re-enabling email confirmation | Pre-production hardening |
