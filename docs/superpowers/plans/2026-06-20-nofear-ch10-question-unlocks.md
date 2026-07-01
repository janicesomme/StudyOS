# No-Fear Ochem Ch10 Question Unlock System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Question Unlock System for Chapter 10 Alkenes that shows students which Gorzynski end-of-chapter questions they are ready to attempt after completing each No-Fear Ochem module.

**Architecture:** Static TS data file (generated once from XLSX via a build script) feeds a self-contained React panel that reads/writes localStorage for module completion and per-question progress. No Supabase table changes needed. The page lives at `/courses/:id/question-unlocks` and is linked from CoursePage.

**Tech Stack:** React 19, React Router v7, TypeScript 6, Tailwind CSS v4, Vitest + @testing-library/react, localStorage for persistence, `xlsx` devDependency for conversion script only.

## Global Constraints

- Never display copied textbook question text, diagrams, answer choices, or solutions — only display question ID, question type, knowledge needed, required moves, unlock status, and progress controls.
- No emoji anywhere in file content (causes encoding issues on Windows cp1252).
- All Tailwind classes must use Tailwind v4 utility syntax (no config file needed — classes just work).
- localStorage keys must be prefixed `studyos:ch10:` to avoid namespace collisions.
- The Excel file at `docs/no-fear-ochem/gorzynski_ch10_question_knowledge_map_v1.xlsx` is the single source of truth; the generated `src/data/ch10-question-map.ts` is committed to the repo.
- `xlsx` is a devDependency used ONLY in the conversion script — never imported in src/.
- Progress persistence uses localStorage (the app has no Supabase progress tables yet).
- Follow the existing test pattern: `src/__tests__/hooks/` for hooks, `src/__tests__/components/` for components, jest-dom matchers (`toBeInTheDocument`).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/types/nofear.ts` | All TypeScript types, module definitions, label maps |
| Create | `scripts/convert-question-map.ts` | One-time XLSX → TS data converter |
| Create | `src/data/ch10-question-map.ts` | Generated static data — 112 Ch10 questions (committed) |
| Modify | `package.json` | Add `convert-question-map` npm script |
| Create | `src/hooks/useQuestionUnlockProgress.ts` | localStorage hook: progress map + completed modules |
| Create | `src/__tests__/hooks/useQuestionUnlockProgress.test.ts` | Hook tests |
| Create | `src/components/nofear/QuestionUnlockCard.tsx` | Single question card (ID, type, knowledge, moves, unlock badge, progress selector) |
| Create | `src/__tests__/components/QuestionUnlockCard.test.tsx` | Card tests |
| Create | `src/components/nofear/QuestionUnlockPanel.tsx` | Full panel: module selector, summary bar, three grouped question lists |
| Create | `src/pages/QuestionUnlocksPage.tsx` | Page wrapper using DashboardShell |
| Modify | `src/App.tsx` | Add `/courses/:id/question-unlocks` route |
| Modify | `src/pages/CoursePage.tsx` | Add "Question Unlocks" link in course nav |

---

## Task 1: TypeScript Types

**Files:**
- Create: `src/types/nofear.ts`

**Interfaces:**
- Produces: `UnlockStatus`, `ProgressStatus`, `Ch10Question`, `ModuleDef`, `ProgressMap`, `CH10_MODULES`, `PROGRESS_LABELS`, `UNLOCK_LABELS` — all consumed by Tasks 3–6.

- [ ] **Step 1: Create `src/types/nofear.ts`**

```typescript
export type UnlockStatus = 'complete' | 'partial' | 'not_yet'

export type ProgressStatus =
  | 'not_started'
  | 'tried'
  | 'got_first_move'
  | 'solved'
  | 'needs_review'
  | 'mastered'

export interface Ch10Question {
  questionId: string
  smithPage: number | null
  problemArea: string
  questionType: string
  knowledgeNeeded: string
  requiredMoves: string
  module0Unlock: UnlockStatus
  module1Unlock: UnlockStatus
  laterModuleNeeded: string
  accuracyRisk: string
  notes: string
}

export interface ModuleDef {
  id: string
  name: string
  unlockField: 'module0Unlock' | 'module1Unlock'
}

export const CH10_MODULES: ModuleDef[] = [
  { id: 'module0', name: '25K Alkene Big Picture', unlockField: 'module0Unlock' },
  { id: 'module1', name: 'Formula, Naming, Cis/Trans, and E/Z', unlockField: 'module1Unlock' },
]

export type ProgressMap = Record<string, ProgressStatus>

export const PROGRESS_LABELS: Record<ProgressStatus, string> = {
  not_started: 'Not started',
  tried: 'Tried',
  got_first_move: 'Got first move',
  solved: 'Solved',
  needs_review: 'Needs review',
  mastered: 'Mastered',
}

export const UNLOCK_LABELS: Record<UnlockStatus, string> = {
  complete: 'Ready to answer completely',
  partial: 'Can make the first correct move',
  not_yet: 'Not yet',
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors from `src/types/nofear.ts`

- [ ] **Step 3: Commit**

```bash
git add src/types/nofear.ts
git commit -m "feat(nofear): add Ch10 question unlock TypeScript types"
```

---

## Task 2: Conversion Script + Static Data File

**Files:**
- Modify: `package.json` (add script)
- Create: `scripts/convert-question-map.ts`
- Create: `src/data/ch10-question-map.ts` (generated output — committed)

**Interfaces:**
- Consumes: `src/types/nofear.ts` → `Ch10Question` type (used only in the generated file's import, not in the script itself)
- Produces: `CH10_QUESTIONS: Ch10Question[]` exported from `src/data/ch10-question-map.ts`

**Context:** The xlsx devDependency was already installed during exploration. The Excel file has 112 rows with columns: `Question_ID`, `Smith_Page`, `Problem_Area`, `Question_Type`, `Knowledge_Needed`, `Required_Moves`, `25K_Coverage` (values: 'Complete' | 'Partial' | 'Not Yet'), `10K_Coverage` (same values), `Later_Module_Needed`, `Accuracy_Risk`, `Notes`. The 25K column maps to module0 (25K Alkene Big Picture); the 10K column maps to module1 (Formula, Naming, Cis/Trans, E/Z) and is cumulative (includes what 25K already unlocked).

- [ ] **Step 1: Add npm script to `package.json`**

In the `"scripts"` block, add after the existing entries:
```json
"convert-question-map": "tsx scripts/convert-question-map.ts"
```

- [ ] **Step 2: Create `scripts/convert-question-map.ts`**

```typescript
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { read, utils } from 'xlsx'

type RawRow = { [key: string]: string | number }

function normalizeCoverage(raw: string | number): 'complete' | 'partial' | 'not_yet' {
  const s = String(raw)
  if (s === 'Complete') return 'complete'
  if (s === 'Partial') return 'partial'
  return 'not_yet'
}

const buf = readFileSync('docs/no-fear-ochem/gorzynski_ch10_question_knowledge_map_v1.xlsx')
const wb = read(buf)
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = utils.sheet_to_json<RawRow>(ws, { defval: '' })

const questions = rows.map(r => ({
  questionId: String(r['Question_ID']),
  smithPage: typeof r['Smith_Page'] === 'number' ? (r['Smith_Page'] as number) : null,
  problemArea: String(r['Problem_Area']),
  questionType: String(r['Question_Type']),
  knowledgeNeeded: String(r['Knowledge_Needed']),
  requiredMoves: String(r['Required_Moves']),
  module0Unlock: normalizeCoverage(r['25K_Coverage']),
  module1Unlock: normalizeCoverage(r['10K_Coverage']),
  laterModuleNeeded: String(r['Later_Module_Needed']),
  accuracyRisk: String(r['Accuracy_Risk']),
  notes: String(r['Notes']),
}))

const output = [
  `// Auto-generated — do not edit by hand.`,
  `// Source: docs/no-fear-ochem/gorzynski_ch10_question_knowledge_map_v1.xlsx`,
  `// To regenerate: npm run convert-question-map`,
  `import type { Ch10Question } from '../types/nofear'`,
  ``,
  `export const CH10_QUESTIONS: Ch10Question[] = ${JSON.stringify(questions, null, 2)}`,
].join('\n')

mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/ch10-question-map.ts', output)
console.log(`Wrote ${questions.length} questions to src/data/ch10-question-map.ts`)
```

- [ ] **Step 3: Run the conversion script**

Run: `npm run convert-question-map`
Expected output: `Wrote 112 questions to src/data/ch10-question-map.ts`

- [ ] **Step 4: Verify the generated file compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/convert-question-map.ts src/data/ch10-question-map.ts
git commit -m "feat(nofear): add XLSX conversion script and generated Ch10 question data"
```

> **How to add a new chapter:** When a new chapter spreadsheet is ready (e.g., Ch11), copy `scripts/convert-question-map.ts` to `scripts/convert-question-map-ch11.ts`, update the source path and output path at the top, add a new npm script, run it, and commit the generated data file. Add new module definitions to `CH10_MODULES` (or create `CH11_MODULES` in a new types file following the same pattern).

---

## Task 3: Progress Hook + Tests

**Files:**
- Create: `src/hooks/useQuestionUnlockProgress.ts`
- Create: `src/__tests__/hooks/useQuestionUnlockProgress.test.ts`

**Interfaces:**
- Consumes: `ProgressMap`, `ProgressStatus` from `src/types/nofear.ts`
- Produces: `useQuestionUnlockProgress()` returning `{ progressMap: ProgressMap, completedModules: string[], updateProgress(questionId, status): void, toggleModule(moduleId): void }`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/hooks/useQuestionUnlockProgress.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useQuestionUnlockProgress } from '../../hooks/useQuestionUnlockProgress'

beforeEach(() => {
  localStorage.clear()
})

describe('useQuestionUnlockProgress', () => {
  it('starts with empty progress map and no completed modules', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    expect(result.current.progressMap).toEqual({})
    expect(result.current.completedModules).toEqual([])
  })

  it('updateProgress stores a status for a question', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.updateProgress('10.46a', 'solved') })
    expect(result.current.progressMap['10.46a']).toBe('solved')
  })

  it('updateProgress overwrites an existing status', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.updateProgress('10.46a', 'tried') })
    act(() => { result.current.updateProgress('10.46a', 'mastered') })
    expect(result.current.progressMap['10.46a']).toBe('mastered')
  })

  it('toggleModule adds a module when not present', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.toggleModule('module0') })
    expect(result.current.completedModules).toContain('module0')
  })

  it('toggleModule removes a module when already present', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.toggleModule('module0') })
    act(() => { result.current.toggleModule('module0') })
    expect(result.current.completedModules).not.toContain('module0')
  })

  it('persists progress map to localStorage', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.updateProgress('10.46b', 'mastered') })
    const stored = JSON.parse(localStorage.getItem('studyos:ch10:question-progress')!)
    expect(stored['10.46b']).toBe('mastered')
  })

  it('persists completed modules to localStorage', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.toggleModule('module1') })
    const stored = JSON.parse(localStorage.getItem('studyos:ch10:completed-modules')!)
    expect(stored).toContain('module1')
  })

  it('loads persisted progress map on mount', () => {
    localStorage.setItem(
      'studyos:ch10:question-progress',
      JSON.stringify({ '10.46a': 'tried' })
    )
    const { result } = renderHook(() => useQuestionUnlockProgress())
    expect(result.current.progressMap['10.46a']).toBe('tried')
  })

  it('loads persisted completed modules on mount', () => {
    localStorage.setItem(
      'studyos:ch10:completed-modules',
      JSON.stringify(['module0', 'module1'])
    )
    const { result } = renderHook(() => useQuestionUnlockProgress())
    expect(result.current.completedModules).toEqual(['module0', 'module1'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/hooks/useQuestionUnlockProgress.test.ts`
Expected: FAIL — "Cannot find module '../../hooks/useQuestionUnlockProgress'"

- [ ] **Step 3: Implement `src/hooks/useQuestionUnlockProgress.ts`**

```typescript
import { useState, useCallback, useEffect } from 'react'
import type { ProgressMap, ProgressStatus } from '../types/nofear'

const PROGRESS_KEY = 'studyos:ch10:question-progress'
const MODULES_KEY = 'studyos:ch10:completed-modules'

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function useQuestionUnlockProgress() {
  const [progressMap, setProgressMap] = useState<ProgressMap>(() =>
    readStorage<ProgressMap>(PROGRESS_KEY, {})
  )
  const [completedModules, setCompletedModules] = useState<string[]>(() =>
    readStorage<string[]>(MODULES_KEY, [])
  )

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap))
  }, [progressMap])

  useEffect(() => {
    localStorage.setItem(MODULES_KEY, JSON.stringify(completedModules))
  }, [completedModules])

  const updateProgress = useCallback((questionId: string, status: ProgressStatus) => {
    setProgressMap(prev => ({ ...prev, [questionId]: status }))
  }, [])

  const toggleModule = useCallback((moduleId: string) => {
    setCompletedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }, [])

  return { progressMap, completedModules, updateProgress, toggleModule }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/hooks/useQuestionUnlockProgress.test.ts`
Expected: PASS — all 9 tests green

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useQuestionUnlockProgress.ts src/__tests__/hooks/useQuestionUnlockProgress.test.ts
git commit -m "feat(nofear): add question unlock progress hook with localStorage persistence"
```

---

## Task 4: QuestionUnlockCard Component + Tests

**Files:**
- Create: `src/components/nofear/QuestionUnlockCard.tsx`
- Create: `src/__tests__/components/QuestionUnlockCard.test.tsx`

**Interfaces:**
- Consumes: `Ch10Question`, `ProgressStatus`, `UnlockStatus`, `PROGRESS_LABELS`, `UNLOCK_LABELS` from `src/types/nofear.ts`
- Produces: `<QuestionUnlockCard question unlockStatus progressStatus onProgressChange />` — renders one question row with all required fields and a progress selector dropdown.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/QuestionUnlockCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QuestionUnlockCard } from '../../components/nofear/QuestionUnlockCard'
import type { Ch10Question } from '../../types/nofear'

const SAMPLE_QUESTION: Ch10Question = {
  questionId: '10.46a',
  smithPage: 440,
  problemArea: 'Reactions of Alkenes',
  questionType: 'Product prediction: HBr',
  knowledgeNeeded: 'Markovnikov rule; HBr addition to alkenes',
  requiredMoves: 'Identify alkene; apply Markovnikov; draw product',
  module0Unlock: 'complete',
  module1Unlock: 'complete',
  laterModuleNeeded: '',
  accuracyRisk: 'Low',
  notes: '',
}

describe('QuestionUnlockCard', () => {
  it('renders the question ID', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.getByText('10.46a')).toBeInTheDocument()
  })

  it('renders the question type', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.getByText('Product prediction: HBr')).toBeInTheDocument()
  })

  it('renders the knowledge needed text', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Markovnikov rule/)).toBeInTheDocument()
  })

  it('renders required moves as a numbered list', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Identify alkene/)).toBeInTheDocument()
    expect(screen.getByText(/apply Markovnikov/)).toBeInTheDocument()
    expect(screen.getByText(/draw product/)).toBeInTheDocument()
  })

  it('shows the textbook prompt when unlock status is complete', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(
      screen.getByText(/Open your Smith\/Gorzynski textbook/)
    ).toBeInTheDocument()
  })

  it('shows the textbook prompt when unlock status is partial', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="partial"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(
      screen.getByText(/Open your Smith\/Gorzynski textbook/)
    ).toBeInTheDocument()
  })

  it('does not show the textbook prompt when unlock status is not_yet', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="not_yet"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.queryByText(/Open your Smith\/Gorzynski textbook/)).not.toBeInTheDocument()
  })

  it('renders the progress selector dropdown', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('calls onProgressChange with new status when dropdown changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={onChange}
      />
    )
    await user.selectOptions(screen.getByRole('combobox'), 'mastered')
    expect(onChange).toHaveBeenCalledWith('mastered')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/components/QuestionUnlockCard.test.tsx`
Expected: FAIL — "Cannot find module '../../components/nofear/QuestionUnlockCard'"

- [ ] **Step 3: Create `src/components/nofear/QuestionUnlockCard.tsx`**

```tsx
import type { Ch10Question, ProgressStatus, UnlockStatus } from '../../types/nofear'
import { PROGRESS_LABELS, UNLOCK_LABELS } from '../../types/nofear'

const UNLOCK_BADGE: Record<UnlockStatus, string> = {
  complete: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  not_yet: 'bg-gray-100 text-gray-500',
}

const PROGRESS_OPTIONS: ProgressStatus[] = [
  'not_started',
  'tried',
  'got_first_move',
  'solved',
  'needs_review',
  'mastered',
]

interface Props {
  question: Ch10Question
  unlockStatus: UnlockStatus
  progressStatus: ProgressStatus
  onProgressChange: (status: ProgressStatus) => void
}

export function QuestionUnlockCard({
  question,
  unlockStatus,
  progressStatus,
  onProgressChange,
}: Props) {
  const moves = question.requiredMoves
    .split(';')
    .map(m => m.trim())
    .filter(Boolean)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-gray-900">{question.questionId}</span>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
            {question.questionType}
          </span>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${UNLOCK_BADGE[unlockStatus]}`}
        >
          {UNLOCK_LABELS[unlockStatus]}
        </span>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Knowledge needed
        </p>
        <p className="text-sm text-gray-700">{question.knowledgeNeeded}</p>
      </div>

      {moves.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Required moves
          </p>
          <ol className="space-y-0.5">
            {moves.map((move, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-gray-400 shrink-0">{i + 1}.</span>
                <span>{move}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {unlockStatus !== 'not_yet' && (
        <p className="text-xs text-indigo-600 italic">
          Open your Smith/Gorzynski textbook to this question. You are ready to try it now.
        </p>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <label
          htmlFor={`progress-${question.questionId}`}
          className="text-xs text-gray-500 shrink-0"
        >
          My progress:
        </label>
        <select
          id={`progress-${question.questionId}`}
          value={progressStatus}
          onChange={e => onProgressChange(e.target.value as ProgressStatus)}
          className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 bg-white"
        >
          {PROGRESS_OPTIONS.map(opt => (
            <option key={opt} value={opt}>
              {PROGRESS_LABELS[opt]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/components/QuestionUnlockCard.test.tsx`
Expected: PASS — all 9 tests green

- [ ] **Step 5: Commit**

```bash
git add src/components/nofear/QuestionUnlockCard.tsx src/__tests__/components/QuestionUnlockCard.test.tsx
git commit -m "feat(nofear): add QuestionUnlockCard component"
```

---

## Task 5: QuestionUnlockPanel

**Files:**
- Create: `src/components/nofear/QuestionUnlockPanel.tsx`

**Interfaces:**
- Consumes: `CH10_QUESTIONS` from `src/data/ch10-question-map.ts`; `CH10_MODULES`, `UNLOCK_LABELS`, `UnlockStatus`, `ProgressStatus` from `src/types/nofear.ts`; `useQuestionUnlockProgress` from `src/hooks/useQuestionUnlockProgress.ts`; `QuestionUnlockCard` from `./QuestionUnlockCard`
- Produces: `<QuestionUnlockPanel />` — self-contained, takes no props

**Logic:** `getActiveUnlock(question, completedModules)` iterates `CH10_MODULES` in order and returns the last completed module's unlock value for that question. If no modules completed, returns `'not_yet'`. A student who has completed module1 (10K) gets cumulative coverage, since the 10K column in the spreadsheet already represents total unlock state after both modules.

- [ ] **Step 1: Create `src/components/nofear/QuestionUnlockPanel.tsx`**

```tsx
import { CH10_QUESTIONS } from '../../data/ch10-question-map'
import { CH10_MODULES, UNLOCK_LABELS } from '../../types/nofear'
import type { UnlockStatus, ProgressStatus } from '../../types/nofear'
import { useQuestionUnlockProgress } from '../../hooks/useQuestionUnlockProgress'
import { QuestionUnlockCard } from './QuestionUnlockCard'

function getActiveUnlock(
  q: typeof CH10_QUESTIONS[number],
  completedModules: string[]
): UnlockStatus {
  let status: UnlockStatus = 'not_yet'
  for (const mod of CH10_MODULES) {
    if (completedModules.includes(mod.id)) {
      status = q[mod.unlockField]
    }
  }
  return status
}

const ATTEMPTED_STATUSES: ProgressStatus[] = [
  'tried',
  'got_first_move',
  'solved',
  'needs_review',
  'mastered',
]

export function QuestionUnlockPanel() {
  const { progressMap, completedModules, updateProgress, toggleModule } =
    useQuestionUnlockProgress()

  const questions = CH10_QUESTIONS.map(q => ({
    ...q,
    unlockStatus: getActiveUnlock(q, completedModules),
    progressStatus: (progressMap[q.questionId] ?? 'not_started') as ProgressStatus,
  }))

  const complete = questions.filter(q => q.unlockStatus === 'complete')
  const partial = questions.filter(q => q.unlockStatus === 'partial')
  const notYet = questions.filter(q => q.unlockStatus === 'not_yet')
  const attempted = questions.filter(q => ATTEMPTED_STATUSES.includes(q.progressStatus))
  const mastered = questions.filter(q => q.progressStatus === 'mastered')

  const groups: Array<{
    status: UnlockStatus
    items: typeof questions
    headingColor: string
    borderColor: string
  }> = [
    { status: 'complete', items: complete, headingColor: 'text-green-800', borderColor: 'border-green-200' },
    { status: 'partial', items: partial, headingColor: 'text-yellow-800', borderColor: 'border-yellow-200' },
    { status: 'not_yet', items: notYet, headingColor: 'text-gray-600', borderColor: 'border-gray-200' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Chapter 10 Alkenes: Question Unlocks
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          After each No-Fear module, the app unlocks the exact textbook questions you are now ready to attempt.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Modules I have completed</p>
        <div className="space-y-2">
          {CH10_MODULES.map(mod => (
            <label key={mod.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={completedModules.includes(mod.id)}
                onChange={() => toggleModule(mod.id)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700">{mod.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Fully unlocked', count: complete.length, color: 'text-green-700' },
          { label: 'First move only', count: partial.length, color: 'text-yellow-700' },
          { label: 'Not yet', count: notYet.length, color: 'text-gray-500' },
          { label: 'Attempted', count: attempted.length, color: 'text-indigo-700' },
          { label: 'Mastered', count: mastered.length, color: 'text-purple-700' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {groups.map(({ status, items, headingColor, borderColor }) => (
        <section key={status}>
          <h3 className={`text-base font-semibold mb-3 ${headingColor}`}>
            {UNLOCK_LABELS[status]}{' '}
            <span className="font-normal text-sm">({items.length})</span>
          </h3>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 italic">None at this unlock level yet.</p>
          ) : (
            <div className={`space-y-3 border-l-4 ${borderColor} pl-4`}>
              {items.map(q => (
                <QuestionUnlockCard
                  key={q.questionId}
                  question={q}
                  unlockStatus={q.unlockStatus}
                  progressStatus={q.progressStatus}
                  onProgressChange={newStatus => updateProgress(q.questionId, newStatus)}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/nofear/QuestionUnlockPanel.tsx
git commit -m "feat(nofear): add QuestionUnlockPanel with module selector, summary, and grouped question cards"
```

---

## Task 6: Page + Routing Wiring

**Files:**
- Create: `src/pages/QuestionUnlocksPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/CoursePage.tsx`

**Interfaces:**
- Consumes: `QuestionUnlockPanel` from `src/components/nofear/QuestionUnlockPanel`; `DashboardShell` from `src/components/layout/DashboardShell`; `useParams` and `Link` from `react-router-dom`

- [ ] **Step 1: Create `src/pages/QuestionUnlocksPage.tsx`**

```tsx
import { Link, useParams } from 'react-router-dom'
import { DashboardShell } from '../components/layout/DashboardShell'
import { QuestionUnlockPanel } from '../components/nofear/QuestionUnlockPanel'

export function QuestionUnlocksPage() {
  const { id: courseId } = useParams<{ id: string }>()

  return (
    <DashboardShell>
      <div className="mb-6">
        <Link
          to={`/courses/${courseId}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          Back to course
        </Link>
      </div>
      <QuestionUnlockPanel />
    </DashboardShell>
  )
}
```

- [ ] **Step 2: Add route to `src/App.tsx`**

Add import after the existing page imports (before the closing import block):
```typescript
import { QuestionUnlocksPage } from './pages/QuestionUnlocksPage'
```

Add route inside `<Routes>`, after the existing `/courses/:id/review-images` route:
```tsx
<Route
  path="/courses/:id/question-unlocks"
  element={<ProtectedRoute><QuestionUnlocksPage /></ProtectedRoute>}
/>
```

- [ ] **Step 3: Add link in `src/pages/CoursePage.tsx`**

Find the existing nav link block (lines 62–79, the `<div className="mt-2 flex gap-4">` block) and add a link after "Review Images":
```tsx
<Link
  to={`/courses/${courseId}/question-unlocks`}
  className="text-sm text-indigo-600 hover:underline"
>
  Question Unlocks
</Link>
```

- [ ] **Step 4: Full compile check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: all existing tests pass plus the 18 new tests (9 hook + 9 card)

- [ ] **Step 6: Commit**

```bash
git add src/pages/QuestionUnlocksPage.tsx src/App.tsx src/pages/CoursePage.tsx
git commit -m "feat(nofear): wire QuestionUnlocksPage route and CoursePage link"
```

---

## Post-Implementation Verification

After all 6 tasks are complete, run the full dev check:

```bash
npm run build
```

Expected: build succeeds, no TypeScript errors, no import errors.

To verify the feature in the browser:
1. Start dev server (ask user before starting — per CLAUDE.md)
2. Navigate to a course
3. Click "Question Unlocks" link
4. Confirm: module checkboxes render, summary shows all 112 in "Not yet", no textbook question text appears
5. Check module 0 — confirm questions move into "Ready to answer completely" (10 questions) and "Can make the first correct move" (45 questions)
6. Also check module 1 — confirm additional questions unlock
7. Change a question's progress dropdown and reload — confirm progress persists via localStorage

---

## Spec Coverage Check

| Spec requirement | Task |
|-----------------|------|
| Read/convert XLSX to static data file | Task 2 |
| Normalized data model | Task 1 |
| Conversion script under scripts/ | Task 2 |
| UI groups by "ready completely / first move / not yet" | Task 5 |
| Module-based filtering (Module 0, Module 1) | Task 3 (hook) + Task 5 (panel) |
| Running progress summary (5 counters) | Task 5 |
| Per-question progress controls (6 states) | Task 4 (card) |
| Persist progress via localStorage | Task 3 |
| Question card shows ID, type, knowledge, moves, unlock, progress | Task 4 |
| No textbook question text displayed | Task 4 (not rendered) |
| "Open your textbook" prompt | Task 4 (conditional) |
| "After each module, unlocks" tagline | Task 5 |
| README / how-to-update comment | Task 2 (inline in script + plan note) |
| Build/lint/test report | Task 6 |
