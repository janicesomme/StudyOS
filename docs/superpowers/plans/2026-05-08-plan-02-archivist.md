# Plan 2: The Archivist (Revised)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A student can upload a .txt file to a course (primary path), the Archivist edge function extracts structured knowledge units via Claude API, and those units appear on /courses/:id. PDF is in scope but marked experimental.

**Architecture:** Client validates file type, uploads to Supabase Storage, inserts a source_materials row (status=pending), immediately refreshes the UI, then fires the edge function invoke without awaiting. A polling effect in the hook re-fetches source_materials every 3 seconds while any material is pending/processing, so the UI updates automatically as the edge function progresses. The edge function verifies ownership of both the material and the course before writing knowledge_units. All Claude response parsing is hardened with field validation and clamping before any rows are written.

**Tech Stack (confirmed from package.json):**
- React 19.2.5, React Router v7.15.0
- TypeScript 6.0.2 (`verbatimModuleSyntax: true` -- type-only imports must use `import type` or inline `type`)
- Vite 8.0.10 with `@vitejs/plugin-react` 6.0.1
- Tailwind CSS v4.2.4 via `@tailwindcss/vite` plugin (no tailwind.config.js -- uses `@import "tailwindcss"` in index.css)
- Vitest 4.1.5 (`defineConfig` from `vitest/config`, not `vite`)
- Supabase JS v2.105.4 (`.insert()` types incompatible with TS6 -- use `@ts-expect-error` with explicit Insert type)
- Edge function runtime: Deno (npm: specifiers for Anthropic SDK, esm.sh for Supabase client)

---

## TypeScript 6 reminders

- Type-only imports: `import { useState, type FC } from 'react'` or `import type { Foo } from './foo'`
- Supabase `.insert()`: `@ts-expect-error` with a typed Insert variable (see useCourses.ts for the established pattern)
- `defineConfig` must be imported from `vitest/config`

---

## Files in this plan

```
New:
  supabase/
    functions/
      archivist/
        index.ts
    migrations/
      20260508010000_plan2_archivist.sql
  src/
    hooks/
      useSourceMaterials.ts
      useKnowledgeUnits.ts
    components/
      materials/
        UploadForm.tsx
        MaterialCard.tsx
        KnowledgeUnitList.tsx
    pages/
      CoursePage.tsx
    __tests__/
      hooks/
        useSourceMaterials.test.ts
        useKnowledgeUnits.test.ts
      components/
        UploadForm.test.tsx
        MaterialCard.test.tsx

Modified:
  src/types/database.ts       (add source_materials + knowledge_units)
  src/App.tsx                 (add /courses/:id route)
  src/pages/DashboardPage.tsx (link course items to /courses/:id)
```

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260508010000_plan2_archivist.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- source_materials
CREATE TABLE source_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'txt')),
  file_url TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'complete', 'failed', 'partial')),
  extraction_confidence NUMERIC(3,2),
  needs_review BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- knowledge_units (atomic heart of the system)
CREATE TABLE knowledge_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  source_material_id UUID NOT NULL REFERENCES source_materials(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,
  plain_english_explanation TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  prerequisite_concept_ids UUID[] DEFAULT '{}',
  common_misconceptions TEXT[] DEFAULT '{}',
  testability_score INTEGER CHECK (testability_score BETWEEN 1 AND 5),
  extraction_confidence NUMERIC(3,2),
  source_location TEXT,
  created_by_agent TEXT NOT NULL DEFAULT 'archivist',
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_source_materials_course ON source_materials(course_id);
CREATE INDEX idx_source_materials_student ON source_materials(student_id);
CREATE INDEX idx_knowledge_units_course ON knowledge_units(course_id);
CREATE INDEX idx_knowledge_units_source ON knowledge_units(source_material_id);
CREATE INDEX idx_knowledge_units_student ON knowledge_units(student_id);

-- RLS
ALTER TABLE source_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_units ENABLE ROW LEVEL SECURITY;

-- source_materials: client manages all CRUD
CREATE POLICY "sm_select_own" ON source_materials FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "sm_insert_own" ON source_materials FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "sm_update_own" ON source_materials FOR UPDATE
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "sm_delete_own" ON source_materials FOR DELETE USING (auth.uid() = student_id);

-- knowledge_units: client reads only; Archivist writes via service role (bypasses RLS)
CREATE POLICY "ku_select_own" ON knowledge_units FOR SELECT USING (auth.uid() = student_id);
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Dashboard -> SQL Editor -> New query -> paste -> Run.

Expected: `Success. No rows returned.`

- [ ] **Step 3: Verify in Table Editor**

Confirm `source_materials` and `knowledge_units` exist. Confirm RLS is enabled on both (lock icon visible). In the `source_materials` table schema, confirm `error_message` column is present.

- [ ] **Step 4: Commit**

```
git add supabase/migrations/ && git commit -m "feat: Plan 2 migration -- source_materials, knowledge_units, RLS"
```

---

### Task 2: TypeScript types update

**Files:**
- Modify: `src/types/database.ts`

Read the current file before editing. Then replace its entire contents with:

- [ ] **Step 1: Replace the file contents**

```typescript
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
      source_materials: {
        Row: {
          id: string
          student_id: string
          course_id: string
          title: string
          file_type: 'pdf' | 'txt'
          file_url: string
          processing_status: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'
          extraction_confidence: number | null
          needs_review: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          title: string
          file_type: 'pdf' | 'txt'
          file_url: string
          processing_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'
          extraction_confidence?: number | null
          needs_review?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          processing_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'
          extraction_confidence?: number | null
          needs_review?: boolean
          error_message?: string | null
        }
      }
      knowledge_units: {
        Row: {
          id: string
          student_id: string
          course_id: string
          source_material_id: string
          concept_name: string
          plain_english_explanation: string
          topic: string
          subtopic: string | null
          difficulty_level: number | null
          prerequisite_concept_ids: string[]
          common_misconceptions: string[]
          testability_score: number | null
          extraction_confidence: number | null
          source_location: string | null
          created_by_agent: string
          reviewed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          source_material_id: string
          concept_name: string
          plain_english_explanation: string
          topic: string
          subtopic?: string | null
          difficulty_level?: number | null
          prerequisite_concept_ids?: string[]
          common_misconceptions?: string[]
          testability_score?: number | null
          extraction_confidence?: number | null
          source_location?: string | null
          created_by_agent?: string
          reviewed?: boolean
          created_at?: string
        }
        Update: { reviewed?: boolean }
      }
    }
  }
}

export type Student = Database['public']['Tables']['students']['Row']
export type StudentProfile = Database['public']['Tables']['student_profile']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type SourceMaterial = Database['public']['Tables']['source_materials']['Row']
export type SourceMaterialInsert = Database['public']['Tables']['source_materials']['Insert']
export type KnowledgeUnit = Database['public']['Tables']['knowledge_units']['Row']
```

- [ ] **Step 2: Run build to confirm no type errors**

```
npm run build
```

Expected: exits 0. Fix any errors before continuing.

- [ ] **Step 3: Commit**

```
git add src/types/database.ts && git commit -m "feat: add Plan 2 types -- source_materials, knowledge_units"
```

---

### Task 3: Supabase Storage bucket + Supabase CLI

No code files -- manual steps in the Supabase dashboard and CLI setup.

- [ ] **Step 1: Create Storage bucket**

Dashboard -> Storage -> New bucket.
- Name: `course-materials`
- Public bucket: OFF (private)
- Click Create bucket.

- [ ] **Step 2: Set Storage policies**

Dashboard -> Storage -> Policies -> course-materials -> New policy -> For full customization.

Add these four policies. The path structure is `{studentId}/{courseId}/{filename}`. In PostgreSQL, `storage.foldername(name)` returns a 1-indexed array, so index `[1]` is the studentId folder.

**SELECT:**
```sql
CREATE POLICY "Users can download their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-materials'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**INSERT:**
```sql
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-materials'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**UPDATE:**
```sql
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-materials'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**DELETE:**
```sql
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-materials'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

- [ ] **Step 3: Install Supabase CLI**

```
npm install -g supabase
```

Verify: `supabase --version`. If `supabase` is not found after install, use `npx supabase` as a prefix for all subsequent CLI commands.

- [ ] **Step 4: Log in to Supabase CLI**

```
supabase login
```

Opens a browser. Confirm authentication. Expected: `Logged in as ...`

- [ ] **Step 5: Note your project ref**

Dashboard -> Settings (gear) -> General -> Reference ID. It looks like `abcdefghijklmnop` (16 characters). You will need this in Task 6.

- [ ] **Step 6: Link the project**

```
supabase link --project-ref YOUR_PROJECT_REF
```

Enter your database password when prompted. Expected: `Linked to project.`

---

### Task 4: useSourceMaterials hook (TDD)

**Files:**
- Create: `src/hooks/useSourceMaterials.ts`
- Create: `src/__tests__/hooks/useSourceMaterials.test.ts`

The hook has three responsibilities:
1. Load materials for a course on mount
2. Validate file type, upload, insert, and fire the edge function (fire-and-forget)
3. Poll source_materials every 3 seconds while any material is pending or processing

The polling is driven by a `useEffect` that watches the `materials` array. When no materials are active it does nothing. Polling is not tested with fake timers in the unit tests -- it is verified manually in QA.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/hooks/useSourceMaterials.test.ts
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useSourceMaterials } from '../../hooks/useSourceMaterials'

const mockUpload = vi.fn()
const mockInvoke = vi.fn()
const mockSingle = vi.fn()
const mockEqInsert = vi.fn()
const mockEqSelect = vi.fn()
const mockOrder = vi.fn()
const mockSelectChain = vi.fn()
const mockInsertChain = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'source_materials') {
        return {
          select: mockSelectChain,
          insert: mockInsertChain,
        }
      }
      return { select: mockSelectChain }
    }),
    storage: {
      from: vi.fn(() => ({ upload: mockUpload })),
    },
    functions: {
      invoke: mockInvoke,
    },
  },
}))

describe('useSourceMaterials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrder.mockResolvedValue({ data: [], error: null })
    mockEqSelect.mockReturnValue({ order: mockOrder })
    mockSelectChain.mockReturnValue({ eq: mockEqSelect })
    mockInvoke.mockResolvedValue({ error: null })
  })

  it('starts with empty materials and loading true', () => {
    const { result } = renderHook(() => useSourceMaterials('course-1', 'student-1'))
    expect(result.current.materials).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('loads materials for the course on mount', async () => {
    const mockMaterials = [{
      id: 'mat-1',
      student_id: 'student-1',
      course_id: 'course-1',
      title: 'Lecture Notes',
      file_type: 'txt',
      file_url: 'student-1/course-1/notes.txt',
      processing_status: 'complete',
      extraction_confidence: 0.9,
      needs_review: false,
      error_message: null,
      created_at: '2026-05-08T00:00:00Z',
    }]
    mockOrder.mockResolvedValueOnce({ data: mockMaterials, error: null })

    const { result } = renderHook(() => useSourceMaterials('course-1', 'student-1'))
    await act(async () => {})

    expect(result.current.materials).toEqual(mockMaterials)
    expect(result.current.loading).toBe(false)
  })

  it('rejects unsupported file types', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useSourceMaterials('course-1', 'student-1'))
    await act(async () => {})

    const file = new File(['content'], 'notes.docx', { type: 'application/msword' })
    let outcome: { error: Error | null } = { error: null }
    await act(async () => {
      outcome = await result.current.uploadAndProcess({ file, courseId: 'course-1', studentId: 'student-1' })
    })

    expect(outcome.error).not.toBeNull()
    expect(outcome.error?.message).toMatch(/unsupported/i)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('accepts .txt files', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })
    mockUpload.mockResolvedValueOnce({ error: null })

    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockSingle })
    mockSingle.mockResolvedValue({ data: { id: 'mat-new', processing_status: 'pending' }, error: null })
    mockEqInsert.mockReturnValue({ select: mockInsertSelect })
    mockInsertChain.mockReturnValue({ eq: mockEqInsert, select: mockInsertSelect })
    mockInsertSelect.mockReturnValue({ single: mockSingle })

    const { result } = renderHook(() => useSourceMaterials('course-1', 'student-1'))
    await act(async () => {})

    const file = new File(['some content'], 'notes.txt', { type: 'text/plain' })
    let outcome: { error: Error | null } = { error: null }
    await act(async () => {
      outcome = await result.current.uploadAndProcess({ file, courseId: 'course-1', studentId: 'student-1' })
    })

    expect(outcome.error).toBeNull()
    expect(mockUpload).toHaveBeenCalled()
  })

  it('returns error when storage upload fails', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })
    mockUpload.mockResolvedValueOnce({ error: new Error('Storage full') })

    const { result } = renderHook(() => useSourceMaterials('course-1', 'student-1'))
    await act(async () => {})

    const file = new File(['content'], 'notes.txt', { type: 'text/plain' })
    let outcome: { error: Error | null } = { error: null }
    await act(async () => {
      outcome = await result.current.uploadAndProcess({ file, courseId: 'course-1', studentId: 'student-1' })
    })

    expect(outcome.error).not.toBeNull()
    expect(outcome.error?.message).toBe('Storage full')
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

```
npm test -- useSourceMaterials
```

Expected: FAIL -- `Cannot find module '../../hooks/useSourceMaterials'`

- [ ] **Step 3: Implement useSourceMaterials**

```typescript
// src/hooks/useSourceMaterials.ts
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SourceMaterial, SourceMaterialInsert } from '../types/database'

const ALLOWED_EXTENSIONS = ['txt', 'pdf'] as const
type AllowedExt = (typeof ALLOWED_EXTENSIONS)[number]

interface UploadInput {
  file: File
  courseId: string
  studentId: string
}

interface UseSourceMaterialsReturn {
  materials: SourceMaterial[]
  loading: boolean
  uploadAndProcess: (input: UploadInput) => Promise<{ error: Error | null }>
  refreshMaterials: () => Promise<void>
}

export function useSourceMaterials(
  courseId: string | undefined,
  studentId: string | undefined
): UseSourceMaterialsReturn {
  const [materials, setMaterials] = useState<SourceMaterial[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMaterials = useCallback(async () => {
    if (!courseId || !studentId) { setLoading(false); return }
    const { data } = await supabase
      .from('source_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
    if (data) setMaterials(data as SourceMaterial[])
    setLoading(false)
  }, [courseId, studentId])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  // Poll while any material is pending or processing
  useEffect(() => {
    const hasActive = materials.some(
      (m) => m.processing_status === 'pending' || m.processing_status === 'processing'
    )
    if (!hasActive) return
    const interval = setInterval(fetchMaterials, 3000)
    return () => clearInterval(interval)
  }, [materials, fetchMaterials])

  const uploadAndProcess = async ({
    file,
    courseId,
    studentId,
  }: UploadInput): Promise<{ error: Error | null }> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !(ALLOWED_EXTENSIONS as readonly string[]).includes(fileExt)) {
      return { error: new Error('Unsupported file type. Only .txt and .pdf files are accepted.') }
    }
    const typedExt = fileExt as AllowedExt

    const filePath = `${studentId}/${courseId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(filePath, file)

    if (uploadError) return { error: uploadError as Error }

    const insertData: SourceMaterialInsert = {
      student_id: studentId,
      course_id: courseId,
      title: file.name.replace(/\.[^/.]+$/, ''),
      file_type: typedExt,
      file_url: filePath,
      processing_status: 'pending',
    }

    // @ts-expect-error supabase-js v2 insert types incompatible with TypeScript 6
    const { data: material, error: insertError } = await supabase
      .from('source_materials')
      .insert(insertData)
      .select()
      .single()

    if (insertError || !material) {
      return { error: (insertError as Error) ?? new Error('Insert failed') }
    }

    // Refresh immediately so UI shows pending status
    await fetchMaterials()

    // Fire-and-forget: invoke does not block the UI
    // Polling picks up status changes; invoke handles marking failed on error
    supabase.functions
      .invoke('archivist', { body: { source_material_id: (material as SourceMaterial).id } })
      .then(({ error: fnError }) => {
        if (fnError) {
          supabase
            .from('source_materials')
            .update({ processing_status: 'failed', error_message: fnError.message })
            .eq('id', (material as SourceMaterial).id)
        }
        fetchMaterials()
      })

    return { error: null }
  }

  return { materials, loading, uploadAndProcess, refreshMaterials: fetchMaterials }
}
```

- [ ] **Step 4: Run to confirm tests pass**

```
npm test -- useSourceMaterials
```

Expected: PASS -- 4 tests passing.

- [ ] **Step 5: Commit**

```
git add src/hooks/useSourceMaterials.ts src/__tests__/hooks/useSourceMaterials.test.ts && git commit -m "feat: add useSourceMaterials hook with file validation, polling, and tests"
```

---

### Task 5: useKnowledgeUnits hook (TDD)

**Files:**
- Create: `src/hooks/useKnowledgeUnits.ts`
- Create: `src/__tests__/hooks/useKnowledgeUnits.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/hooks/useKnowledgeUnits.test.ts
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useKnowledgeUnits } from '../../hooks/useKnowledgeUnits'

const mockEq = vi.fn()
const mockSelect = vi.fn(() => ({ eq: mockEq }))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ select: mockSelect })),
  },
}))

describe('useKnowledgeUnits', () => {
  beforeEach(() => {
    mockEq.mockResolvedValue({ data: [], error: null })
  })

  it('starts with empty units and loading true', () => {
    const { result } = renderHook(() => useKnowledgeUnits('mat-1'))
    expect(result.current.units).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('loads knowledge units for the source material', async () => {
    const mockUnits = [{
      id: 'ku-1',
      student_id: 'student-1',
      course_id: 'course-1',
      source_material_id: 'mat-1',
      concept_name: 'SN2 Reaction',
      plain_english_explanation: 'A substitution where the nucleophile attacks as the leaving group departs.',
      topic: 'Reactions',
      subtopic: 'Substitution',
      difficulty_level: 3,
      prerequisite_concept_ids: [],
      common_misconceptions: ['Confusing SN1 and SN2 conditions'],
      testability_score: 5,
      extraction_confidence: 0.95,
      source_location: 'p. 12',
      created_by_agent: 'archivist',
      reviewed: false,
      created_at: '2026-05-08T00:00:00Z',
    }]
    mockEq.mockResolvedValueOnce({ data: mockUnits, error: null })

    const { result } = renderHook(() => useKnowledgeUnits('mat-1'))
    await act(async () => {})

    expect(result.current.units).toEqual(mockUnits)
    expect(result.current.loading).toBe(false)
  })

  it('does nothing when sourceMaterialId is undefined', async () => {
    const { result } = renderHook(() => useKnowledgeUnits(undefined))
    await act(async () => {})
    expect(result.current.units).toEqual([])
    expect(result.current.loading).toBe(false)
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

```
npm test -- useKnowledgeUnits
```

Expected: FAIL -- `Cannot find module '../../hooks/useKnowledgeUnits'`

- [ ] **Step 3: Implement useKnowledgeUnits**

```typescript
// src/hooks/useKnowledgeUnits.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { KnowledgeUnit } from '../types/database'

interface UseKnowledgeUnitsReturn {
  units: KnowledgeUnit[]
  loading: boolean
}

export function useKnowledgeUnits(sourceMaterialId: string | undefined): UseKnowledgeUnitsReturn {
  const [units, setUnits] = useState<KnowledgeUnit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sourceMaterialId) { setLoading(false); return }

    supabase
      .from('knowledge_units')
      .select('*')
      .eq('source_material_id', sourceMaterialId)
      .then(({ data }) => {
        if (data) setUnits(data as KnowledgeUnit[])
        setLoading(false)
      })
  }, [sourceMaterialId])

  return { units, loading }
}
```

- [ ] **Step 4: Run to confirm tests pass**

```
npm test -- useKnowledgeUnits
```

Expected: PASS -- 3 tests passing.

- [ ] **Step 5: Commit**

```
git add src/hooks/useKnowledgeUnits.ts src/__tests__/hooks/useKnowledgeUnits.test.ts && git commit -m "feat: add useKnowledgeUnits hook with tests"
```

---

### Task 6: Archivist edge function

**Files:**
- Create: `supabase/functions/archivist/index.ts`

The edge function:
1. Authenticates the caller using the JWT
2. Fetches the source_materials row, verifying both the material and its course belong to the authenticated user
3. Updates status to `processing`
4. Downloads the file from Supabase Storage
5. Calls Claude API -- TXT as plain text content, PDF as base64 document (experimental)
6. Validates the Claude response is a non-empty JSON array
7. Validates and sanitizes every knowledge unit -- clamps numeric fields, skips units missing required fields
8. Marks status `partial` if some units failed validation, `complete` if all passed, `failed` if nothing usable was extracted
9. Writes valid knowledge units via service role (bypasses RLS -- ownership was verified in step 2)

- [ ] **Step 1: Create the function file**

```typescript
// supabase/functions/archivist/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Clamp an integer to [min, max]. Returns null if val is not a valid number.
function clampInt(val: unknown, min: number, max: number): number | null {
  const n = Number(val)
  if (!Number.isFinite(n)) return null
  return Math.min(Math.max(Math.round(n), min), max)
}

// Clamp a float to [min, max]. Returns null if val is not a valid number.
function clampFloat(val: unknown, min: number, max: number): number | null {
  const n = Number(val)
  if (!Number.isFinite(n)) return null
  return Math.min(Math.max(n, min), max)
}

// Update source_materials to failed with a stored error message.
async function markFailed(
  // deno-lint-ignore no-explicit-any
  db: any,
  id: string,
  message: string
): Promise<void> {
  await db.from('source_materials').update({
    processing_status: 'failed',
    error_message: message,
  }).eq('id', id)
}

const SYSTEM_PROMPT =
  'You are the Archivist, a knowledge extraction specialist for an academic study system. ' +
  'Extract every discrete, testable concept from the provided material. ' +
  'Your output will be used to build study sessions, recall exercises, and exam prep.'

const EXTRACTION_PROMPT =
  'Extract all knowledge units from this academic material.\n\n' +
  'Return ONLY a valid JSON array. No other text, no markdown code fences, no explanation.\n' +
  'Each element must have exactly these fields:\n' +
  '- concept_name: string (short precise name)\n' +
  '- plain_english_explanation: string (clear 2-4 sentence explanation a student can understand)\n' +
  '- topic: string (main topic area)\n' +
  '- subtopic: string | null\n' +
  '- difficulty_level: integer 1-5 (1=fundamental, 5=advanced)\n' +
  '- common_misconceptions: string[] (errors students commonly make; empty array if none)\n' +
  '- testability_score: integer 1-5 (1=unlikely to be tested, 5=almost certainly tested)\n' +
  '- extraction_confidence: number 0.0-1.0 (your confidence this extraction is accurate)\n' +
  '- source_location: string | null (page or section reference if visible in the material)'

interface RawUnit {
  concept_name: unknown
  plain_english_explanation: unknown
  topic: unknown
  subtopic?: unknown
  difficulty_level?: unknown
  common_misconceptions?: unknown
  testability_score?: unknown
  extraction_confidence?: unknown
  source_location?: unknown
}

interface ValidatedUnit {
  student_id: string
  course_id: string
  source_material_id: string
  concept_name: string
  plain_english_explanation: string
  topic: string
  subtopic: string | null
  difficulty_level: number | null
  prerequisite_concept_ids: string[]
  common_misconceptions: string[]
  testability_score: number | null
  extraction_confidence: number | null
  source_location: string | null
  created_by_agent: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const body = await req.json()
    const { source_material_id } = body as { source_material_id?: string }
    if (!source_material_id || typeof source_material_id !== 'string') {
      return new Response('Missing source_material_id', { status: 400, headers: corsHeaders })
    }

    // Fetch source_materials row -- must belong to the authenticated user
    const { data: material, error: materialError } = await supabaseAdmin
      .from('source_materials')
      .select('*')
      .eq('id', source_material_id)
      .eq('student_id', user.id)
      .single()

    if (materialError || !material) {
      return new Response('Material not found', { status: 404, headers: corsHeaders })
    }

    // Verify the related course also belongs to the same user
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('student_id')
      .eq('id', material.course_id)
      .single()

    if (courseError || !course || course.student_id !== user.id) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }

    // Guard: skip if already processed
    if (material.processing_status === 'complete') {
      return new Response(
        JSON.stringify({ success: true, count: 0, message: 'Already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabaseAdmin
      .from('source_materials')
      .update({ processing_status: 'processing', error_message: null })
      .eq('id', source_material_id)

    // Download file from Supabase Storage (service role bypasses bucket policies)
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('course-materials')
      .download(material.file_url)

    if (downloadError || !fileData) {
      await markFailed(supabaseAdmin, source_material_id, 'Failed to download file from storage')
      return new Response('Download failed', { status: 500, headers: corsHeaders })
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    // Build message content based on file type
    // TXT: primary supported path
    // PDF: experimental -- may fail on complex layouts or very large files
    let messageContent: Anthropic.MessageParam['content']

    if (material.file_type === 'txt') {
      const text = await fileData.text()
      if (!text.trim()) {
        await markFailed(supabaseAdmin, source_material_id, 'File is empty')
        return new Response('Empty file', { status: 400, headers: corsHeaders })
      }
      messageContent = [{ type: 'text', text: `${EXTRACTION_PROMPT}\n\n---\n\n${text}` }]
    } else {
      // PDF -- experimental
      const buffer = await fileData.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)
      messageContent = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        },
        { type: 'text', text: EXTRACTION_PROMPT },
      ]
    }

    let claudeResponse: Anthropic.Message
    try {
      claudeResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: messageContent }],
      })
    } catch (err) {
      await markFailed(supabaseAdmin, source_material_id, `Claude API error: ${String(err)}`)
      return new Response('Claude API call failed', { status: 502, headers: corsHeaders })
    }

    const responseText =
      claudeResponse.content[0]?.type === 'text' ? claudeResponse.content[0].text : ''

    // Parse JSON -- strip markdown code fences if present
    const stripped = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    let rawUnits: unknown
    try {
      rawUnits = JSON.parse(stripped)
    } catch {
      await markFailed(supabaseAdmin, source_material_id, 'Claude response was not valid JSON')
      return new Response('Parse error', { status: 500, headers: corsHeaders })
    }

    // Must be a non-null array
    if (!Array.isArray(rawUnits)) {
      await markFailed(supabaseAdmin, source_material_id, 'Claude response was not a JSON array')
      return new Response('Unexpected response shape', { status: 500, headers: corsHeaders })
    }

    // Empty array -- partial, needs review
    if (rawUnits.length === 0) {
      await supabaseAdmin.from('source_materials').update({
        processing_status: 'partial',
        extraction_confidence: null,
        needs_review: true,
        error_message: 'No knowledge units extracted',
      }).eq('id', source_material_id)
      return new Response(
        JSON.stringify({ success: true, count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate and sanitize each unit -- skip any that are missing required fields
    const validUnits: ValidatedUnit[] = []
    let skippedCount = 0

    for (const raw of rawUnits as RawUnit[]) {
      const conceptName = typeof raw.concept_name === 'string' ? raw.concept_name.trim() : ''
      const explanation = typeof raw.plain_english_explanation === 'string'
        ? raw.plain_english_explanation.trim()
        : ''
      const topic = typeof raw.topic === 'string' ? raw.topic.trim() : ''

      if (!conceptName || !explanation || !topic) {
        skippedCount++
        continue
      }

      const misconceptions = Array.isArray(raw.common_misconceptions)
        ? (raw.common_misconceptions as unknown[])
            .filter((m): m is string => typeof m === 'string')
        : []

      validUnits.push({
        student_id: user.id,
        course_id: material.course_id,
        source_material_id: material.id,
        concept_name: conceptName,
        plain_english_explanation: explanation,
        topic,
        subtopic: typeof raw.subtopic === 'string' ? raw.subtopic.trim() : null,
        difficulty_level: clampInt(raw.difficulty_level, 1, 5),
        prerequisite_concept_ids: [],
        common_misconceptions: misconceptions,
        testability_score: clampInt(raw.testability_score, 1, 5),
        extraction_confidence: clampFloat(raw.extraction_confidence, 0, 1),
        source_location: typeof raw.source_location === 'string' ? raw.source_location.trim() : null,
        created_by_agent: 'archivist',
      })
    }

    // Nothing usable after validation
    if (validUnits.length === 0) {
      await markFailed(
        supabaseAdmin,
        source_material_id,
        `All ${rawUnits.length} extracted units failed validation`
      )
      return new Response('No valid units', { status: 500, headers: corsHeaders })
    }

    const { error: insertError } = await supabaseAdmin.from('knowledge_units').insert(validUnits)

    if (insertError) {
      await markFailed(supabaseAdmin, source_material_id, `DB insert error: ${insertError.message}`)
      return new Response('Insert failed', { status: 500, headers: corsHeaders })
    }

    // Average confidence is safe -- validUnits.length > 0 at this point
    const avgConfidence =
      validUnits.reduce((sum, ku) => sum + (ku.extraction_confidence ?? 0.8), 0) / validUnits.length

    const processingStatus = skippedCount > 0 ? 'partial' : 'complete'

    await supabaseAdmin.from('source_materials').update({
      processing_status: processingStatus,
      extraction_confidence: avgConfidence,
      needs_review: avgConfidence < 0.7 || skippedCount > 0,
      error_message: skippedCount > 0
        ? `${skippedCount} unit(s) skipped due to missing required fields`
        : null,
    }).eq('id', source_material_id)

    return new Response(
      JSON.stringify({ success: true, count: validUnits.length, skipped: skippedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(`Unexpected error: ${String(err)}`, { status: 500, headers: corsHeaders })
  }
})
```

- [ ] **Step 2: Deploy the function**

```
supabase functions deploy archivist --project-ref YOUR_PROJECT_REF
```

Expected: `Deployed Functions archivist`

- [ ] **Step 3: Set the Anthropic API key secret**

```
supabase secrets set ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE --project-ref YOUR_PROJECT_REF
```

Your Anthropic API key is at console.anthropic.com -> API Keys.

Expected: `Finished supabase secrets set`

- [ ] **Step 4: Commit**

```
git add supabase/functions/ && git commit -m "feat: add hardened Archivist edge function"
```

---

### Task 7: UploadForm component (TDD)

**Files:**
- Create: `src/components/materials/UploadForm.tsx`
- Create: `src/__tests__/components/UploadForm.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/components/UploadForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { UploadForm } from '../../components/materials/UploadForm'

describe('UploadForm', () => {
  it('renders a file input and upload button', () => {
    render(<UploadForm onUpload={vi.fn()} uploading={false} error={null} />)
    expect(screen.getByLabelText(/file/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
  })

  it('disables the button while uploading', () => {
    render(<UploadForm onUpload={vi.fn()} uploading={true} error={null} />)
    expect(screen.getByRole('button', { name: /uploading/i })).toBeDisabled()
  })

  it('calls onUpload with the selected file', () => {
    const onUpload = vi.fn()
    render(<UploadForm onUpload={onUpload} uploading={false} error={null} />)

    const file = new File(['content'], 'notes.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText(/file/i), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /upload/i }))

    expect(onUpload).toHaveBeenCalledWith(file)
  })

  it('does not call onUpload when no file is selected', () => {
    const onUpload = vi.fn()
    render(<UploadForm onUpload={onUpload} uploading={false} error={null} />)
    fireEvent.click(screen.getByRole('button', { name: /upload/i }))
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('displays an error message when error prop is set', () => {
    render(<UploadForm onUpload={vi.fn()} uploading={false} error="Unsupported file type." />)
    expect(screen.getByText('Unsupported file type.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

```
npm test -- UploadForm
```

Expected: FAIL -- `Cannot find module '../../components/materials/UploadForm'`

- [ ] **Step 3: Implement UploadForm**

```typescript
// src/components/materials/UploadForm.tsx
import { useState, type FormEvent, type ChangeEvent } from 'react'

interface UploadFormProps {
  onUpload: (file: File) => void
  uploading: boolean
  error: string | null
}

export function UploadForm({ onUpload, uploading, error }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (file) onUpload(file)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="material-file" className="block text-sm font-medium text-gray-700 mb-1">
          File <span className="text-gray-400 font-normal">(.txt or .pdf)</span>
        </label>
        <input
          id="material-file"
          type="file"
          accept=".txt,.pdf"
          onChange={handleChange}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <p className="mt-1 text-xs text-gray-400">PDF support is experimental.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={uploading || !file}
        className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Run to confirm tests pass**

```
npm test -- UploadForm
```

Expected: PASS -- 5 tests passing.

- [ ] **Step 5: Commit**

```
git add src/components/materials/UploadForm.tsx src/__tests__/components/UploadForm.test.tsx && git commit -m "feat: add UploadForm component with error display and tests"
```

---

### Task 8: MaterialCard component (TDD)

**Files:**
- Create: `src/components/materials/MaterialCard.tsx`
- Create: `src/__tests__/components/MaterialCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/components/MaterialCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { MaterialCard } from '../../components/materials/MaterialCard'
import type { SourceMaterial } from '../../types/database'

const base: SourceMaterial = {
  id: 'mat-1',
  student_id: 'student-1',
  course_id: 'course-1',
  title: 'Lecture Notes Week 1',
  file_type: 'txt',
  file_url: 'student-1/course-1/notes.txt',
  processing_status: 'complete',
  extraction_confidence: 0.9,
  needs_review: false,
  error_message: null,
  created_at: '2026-05-08T00:00:00Z',
}

describe('MaterialCard', () => {
  it('renders the material title', () => {
    render(<MaterialCard material={base} onSelect={vi.fn()} selected={false} />)
    expect(screen.getByText('Lecture Notes Week 1')).toBeInTheDocument()
  })

  it('shows the processing status', () => {
    render(<MaterialCard material={base} onSelect={vi.fn()} selected={false} />)
    expect(screen.getByText('complete')).toBeInTheDocument()
  })

  it('shows failed status', () => {
    render(<MaterialCard material={{ ...base, processing_status: 'failed' }} onSelect={vi.fn()} selected={false} />)
    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  it('shows error message when failed with error_message', () => {
    render(
      <MaterialCard
        material={{ ...base, processing_status: 'failed', error_message: 'Claude API error' }}
        onSelect={vi.fn()}
        selected={false}
      />
    )
    expect(screen.getByText('Claude API error')).toBeInTheDocument()
  })

  it('calls onSelect with the material id when clicked', () => {
    const onSelect = vi.fn()
    render(<MaterialCard material={base} onSelect={onSelect} selected={false} />)
    fireEvent.click(screen.getByText('Lecture Notes Week 1'))
    expect(onSelect).toHaveBeenCalledWith('mat-1')
  })

  it('shows needs-review badge when needs_review is true', () => {
    render(<MaterialCard material={{ ...base, needs_review: true }} onSelect={vi.fn()} selected={false} />)
    expect(screen.getByText(/review/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

```
npm test -- MaterialCard
```

Expected: FAIL -- `Cannot find module '../../components/materials/MaterialCard'`

- [ ] **Step 3: Implement MaterialCard**

```typescript
// src/components/materials/MaterialCard.tsx
import type { SourceMaterial } from '../../types/database'

interface MaterialCardProps {
  material: SourceMaterial
  onSelect: (id: string) => void
  selected: boolean
}

const statusColors: Record<SourceMaterial['processing_status'], string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
}

export function MaterialCard({ material, onSelect, selected }: MaterialCardProps) {
  return (
    <button
      onClick={() => onSelect(material.id)}
      className={`w-full text-left rounded-xl border p-4 transition-colors ${
        selected
          ? 'border-indigo-400 bg-indigo-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">{material.title}</p>
        <span
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[material.processing_status]}`}
        >
          {material.processing_status}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-gray-400 uppercase">{material.file_type}</span>
        {material.needs_review && (
          <span className="text-xs text-amber-600 font-medium">needs review</span>
        )}
      </div>
      {material.error_message && material.processing_status === 'failed' && (
        <p className="mt-1 text-xs text-red-500">{material.error_message}</p>
      )}
    </button>
  )
}
```

- [ ] **Step 4: Run to confirm tests pass**

```
npm test -- MaterialCard
```

Expected: PASS -- 6 tests passing.

- [ ] **Step 5: Commit**

```
git add src/components/materials/MaterialCard.tsx src/__tests__/components/MaterialCard.test.tsx && git commit -m "feat: add MaterialCard with status, error display, and tests"
```

---

### Task 9: KnowledgeUnitList component

**Files:**
- Create: `src/components/materials/KnowledgeUnitList.tsx`

No unit tests -- pure display component with no logic. Covered by manual QA.

- [ ] **Step 1: Create the component**

```typescript
// src/components/materials/KnowledgeUnitList.tsx
import { useKnowledgeUnits } from '../../hooks/useKnowledgeUnits'

interface KnowledgeUnitListProps {
  sourceMaterialId: string
}

const difficultyLabel: Record<number, string> = {
  1: 'Fundamental',
  2: 'Basic',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
}

export function KnowledgeUnitList({ sourceMaterialId }: KnowledgeUnitListProps) {
  const { units, loading } = useKnowledgeUnits(sourceMaterialId)

  if (loading) {
    return <p className="text-sm text-gray-400 py-4">Loading knowledge units...</p>
  }

  if (units.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No knowledge units found for this material.</p>
  }

  return (
    <div className="space-y-3 mt-2">
      <p className="text-xs text-gray-500 font-medium">{units.length} knowledge units extracted</p>
      {units.map((unit) => (
        <div key={unit.id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-semibold text-gray-900">{unit.concept_name}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {unit.difficulty_level !== null && (
                <span className="text-xs text-gray-400">{difficultyLabel[unit.difficulty_level]}</span>
              )}
              {unit.testability_score !== null && unit.testability_score >= 4 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                  High yield
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">{unit.plain_english_explanation}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{unit.topic}{unit.subtopic ? ` / ${unit.subtopic}` : ''}</span>
            {unit.source_location && <span>{unit.source_location}</span>}
          </div>
          {unit.common_misconceptions.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-0.5">Common mistake:</p>
              <p className="text-xs text-gray-500">{unit.common_misconceptions[0]}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```
git add src/components/materials/KnowledgeUnitList.tsx && git commit -m "feat: add KnowledgeUnitList display component"
```

---

### Task 10: CoursePage

**Files:**
- Create: `src/pages/CoursePage.tsx`

- [ ] **Step 1: Create CoursePage**

```typescript
// src/pages/CoursePage.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardShell } from '../components/layout/DashboardShell'
import { UploadForm } from '../components/materials/UploadForm'
import { MaterialCard } from '../components/materials/MaterialCard'
import { KnowledgeUnitList } from '../components/materials/KnowledgeUnitList'
import { useSourceMaterials } from '../hooks/useSourceMaterials'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { Course } from '../types/database'

export function CoursePage() {
  const { id: courseId } = useParams<{ id: string }>()
  const { session } = useAuth()
  const studentId = session?.user.id

  const { materials, loading: materialsLoading, uploadAndProcess } = useSourceMaterials(
    courseId,
    studentId
  )

  const [course, setCourse] = useState<Course | null>(null)
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId || !studentId) return
    supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('student_id', studentId)
      .single()
      .then(({ data }) => { if (data) setCourse(data as Course) })
  }, [courseId, studentId])

  const handleUpload = async (file: File) => {
    if (!courseId || !studentId) return
    setUploading(true)
    setUploadError(null)
    const { error } = await uploadAndProcess({ file, courseId, studentId })
    setUploading(false)
    if (error) setUploadError(error.message)
  }

  const handleSelectMaterial = (id: string) => {
    setSelectedMaterialId((prev) => (prev === id ? null : id))
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-indigo-600 hover:underline">
          Back to dashboard
        </Link>
        {course && (
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
            <p className="text-sm text-gray-500">{course.subject}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Material</h2>
          <UploadForm onUpload={handleUpload} uploading={uploading} error={uploadError} />

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Materials</h3>
            {materialsLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : materials.length === 0 ? (
              <p className="text-sm text-gray-400">No materials yet. Upload a .txt file to start.</p>
            ) : (
              <div className="space-y-2">
                {materials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onSelect={handleSelectMaterial}
                    selected={selectedMaterialId === material.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Knowledge Units</h2>
          {selectedMaterialId ? (
            <KnowledgeUnitList sourceMaterialId={selectedMaterialId} />
          ) : (
            <p className="text-sm text-gray-400 mt-4">
              {materials.length > 0
                ? 'Select a material on the left to view its extracted knowledge units.'
                : 'Upload a material to begin extraction.'}
            </p>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
```

- [ ] **Step 2: Commit**

```
git add src/pages/CoursePage.tsx && git commit -m "feat: add CoursePage with upload, materials list, and knowledge units"
```

---

### Task 11: Dashboard + routing update

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Add CoursePage route to App.tsx**

Read `src/App.tsx` first.

Add the import after the DashboardPage import:

```typescript
import { CoursePage } from './pages/CoursePage'
```

Add the route inside `<Routes>`, after the `/dashboard` route:

```typescript
<Route path="/courses/:id" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
```

The full `<Routes>` block should read:

```typescript
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
  <Route path="/courses/:id" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
```

- [ ] **Step 2: Link course items in DashboardPage**

Read `src/pages/DashboardPage.tsx` first.

Add the Link import at the top:

```typescript
import { Link } from 'react-router-dom'
```

Replace the course list item (`<li key={course.id} ...>...</li>`) with:

```typescript
<li key={course.id}>
  <Link
    to={`/courses/${course.id}`}
    className="block bg-gray-50 rounded-lg px-3 py-2 hover:bg-indigo-50 transition-colors"
  >
    <p className="text-sm font-medium text-gray-900">{course.name}</p>
    <p className="text-xs text-gray-400">{course.subject}</p>
  </Link>
</li>
```

- [ ] **Step 3: Commit**

```
git add src/App.tsx src/pages/DashboardPage.tsx && git commit -m "feat: add /courses/:id route and link courses from dashboard"
```

---

### Task 12: Build verification and manual QA

- [ ] **Step 1: Run full test suite**

```
npm test
```

Expected: All tests pass, 0 failures. Count should be 15 or more (11 from Plan 1 + 4 useSourceMaterials + 3 useKnowledgeUnits + 5 UploadForm + 6 MaterialCard).

- [ ] **Step 2: Run build**

```
npm run build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 3: Commit any fixes**

```
git add . && git commit -m "fix: resolve build or test issues"
```

---

## Manual QA checklist

Start the dev server only after confirming with the user. Run `npm run dev`.

**Core loop -- TXT file first:**
- [ ] Sign in -> dashboard -> click a course -> CoursePage loads with the course name and subject
- [ ] Upload a tiny .txt file (3-5 sentences about any topic -- use a text editor to create it if needed)
- [ ] Material card appears immediately with status "pending"
- [ ] Status changes to "processing" then "complete" as the edge function runs (polling should update the UI without a manual refresh)
- [ ] Click the completed material card
- [ ] Knowledge units appear in the right panel with concept names, explanations, topic labels
- [ ] High-yield units (testability >= 4) show the "High yield" badge

**Status tracking:**
- [ ] Confirm the status chip on MaterialCard cycles: pending -> processing -> complete (watch without refreshing)
- [ ] Upload a second file -- confirm two materials appear and the status updates independently

**File type validation:**
- [ ] Attempt to select a .docx or .jpg file using the file picker -- the browser should filter it out (accept=".txt,.pdf")
- [ ] If you bypass the picker and call `uploadAndProcess` with an unsupported extension, the hook returns an error and no upload is sent to storage

**Failure handling:**
- [ ] To test a failed extraction: temporarily edit the edge function to throw an error before the Claude call (comment out the anthropic call and `throw new Error('test')`), deploy, upload a file, confirm status shows "failed" and error_message is visible on the MaterialCard. Revert and redeploy when done.

**RLS / isolation:**
- [ ] Sign out. Sign in as a different user.
- [ ] Confirm the dashboard shows only that user's courses
- [ ] Confirm the course detail page shows no materials from the first user
- [ ] Confirm knowledge_units in Supabase Table Editor have the correct student_id for each user

**Supabase dashboard verification:**
- [ ] Table Editor: source_materials row shows status=complete, extraction_confidence populated
- [ ] Table Editor: knowledge_units rows exist with matching student_id, course_id, source_material_id
- [ ] Storage: file is present in course-materials bucket at `{studentId}/{courseId}/{timestamp}-{filename}`

---

## Risks and assumptions

| Item | Detail |
|---|---|
| PDF is experimental | PDF base64 encoding in Deno may fail on files larger than ~5MB. Very complex layouts may extract poorly. Use .txt as the guaranteed path for Plan 2 testing. |
| Edge function cold start | First invocation after a period of inactivity may take 2-3 seconds before processing begins. This is normal. |
| Polling interval | Polling fires every 3 seconds while any material is pending/processing. It stops automatically when all materials reach a terminal state. |
| File path collisions | `Date.now()` prefix prevents collisions for the same student uploading the same filename in rapid succession. |
| Service role and RLS | The edge function uses `SUPABASE_SERVICE_ROLE_KEY` (injected automatically by Supabase -- do not add it to .env.local). Ownership is verified explicitly via user.id checks before any writes. |
| Supabase CLI on Windows | If the `supabase` command is not found after global install, prefix all CLI commands with `npx`. |
| Empty files | The edge function explicitly checks for empty TXT content and marks status=failed before calling Claude. |

---

## Deferred to later plans

| Item | Plan |
|---|---|
| Knowledge unit review / edit UI | Plan 3+ |
| prerequisite_concept_ids linking | Plan 3+ |
| needs_review student-facing workflow | Plan 3+ |
| Audio / video transcript ingestion | Later |
| Polling via Supabase Realtime (instead of setInterval) | Later |
| assessment_responses | Plan 5 (Professor onboarding) |
| supabase gen types (full generated types) | After all migrations stable |
| Memory Coach, Exam Strategist, Study Manager | Plans 3-6 |
