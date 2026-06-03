# Module 3 — Exam Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn 53 matched past-exam PDF pairs into drillable three-tier cards (question -> hint -> answer) with a point-weighted frequency map, and two drill modes: topic worksheet and intact-exam.

**Architecture:** New `source_exams` table (one row per exam file). `exam_questions` gains `hint`, `answer_image_url`, `source_exam_id`, `exam_number`, `exam_year`, `question_order`, `point_value`, `sub_parts`, `has_structure`, `raw_text`. Pipeline: pdfjs-dist extracts question-sheet text -> Claude proposes topics (manual pause) -> canonical enum locked -> Claude generates hints -> PyMuPDF renders key pages -> Supabase storage + DB insert. UI: DrillPage gains three-tier state; new ExamPickerPage adds two drill-mode pickers.

**Tech Stack:** pdfjs-dist (text extraction in Node), PyMuPDF via Python subprocess (key page image rendering), @anthropic-ai/sdk, tsx scripts, Supabase, React/TS, Tailwind

---

### Task 1: Schema migration and TypeScript types

**Files:**
- Create: `supabase/migrations/20260602030000_module3_exam_intelligence.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260602030000_module3_exam_intelligence.sql

-- source_exams: one row per exam file (question sheet + key pair)
CREATE TABLE source_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,        -- e.g. 'JRF', 'CHM'
  year INT NOT NULL,                 -- e.g. 2017
  exam_number INT NOT NULL,          -- 1, 2, 3, 4
  original_filename TEXT NOT NULL,   -- e.g. '11JRF17ex1.pdf'
  question_count INT,                -- populated after parse
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, original_filename)
);

CREATE INDEX idx_source_exams_course ON source_exams (course_id);

ALTER TABLE source_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "se_select_own" ON source_exams FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "se_insert_own" ON source_exams FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "se_delete_own" ON source_exams FOR DELETE USING (auth.uid() = student_id);

-- Add Module 3 columns to exam_questions
ALTER TABLE exam_questions
  ADD COLUMN IF NOT EXISTS hint TEXT,
  ADD COLUMN IF NOT EXISTS answer_image_url TEXT,
  ADD COLUMN IF NOT EXISTS source_exam_id UUID REFERENCES source_exams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS exam_number INT,
  ADD COLUMN IF NOT EXISTS exam_year INT,
  ADD COLUMN IF NOT EXISTS question_order INT,
  ADD COLUMN IF NOT EXISTS point_value INT,
  ADD COLUMN IF NOT EXISTS sub_parts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_structure BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS raw_text TEXT;

CREATE INDEX IF NOT EXISTS idx_exam_questions_source_exam ON exam_questions (source_exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_number ON exam_questions (exam_number);
```

- [ ] **Step 2: Run the migration in the Supabase dashboard**

Paste the SQL into SQL editor and run. Verify: `source_exams` table appears; `exam_questions` now has `hint`, `answer_image_url`, `source_exam_id`, `exam_number`, `exam_year`, `question_order`, `point_value`, `sub_parts`, `has_structure`, `raw_text` columns.

- [ ] **Step 3: Update `src/types/database.ts`**

Add `source_exams` table and update `exam_questions` with the new columns. Full updated file:

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
        Row: { id: string; student_id: string; name: string; subject: string; institution: string | null; semester: string | null; exam_date: string | null; question_source: 'image_bank' | 'generated'; created_at: string }
        Insert: { id?: string; student_id: string; name: string; subject: string; institution?: string | null; semester?: string | null; exam_date?: string | null; question_source?: 'image_bank' | 'generated'; created_at?: string }
        Update: { name?: string; subject?: string; institution?: string | null; semester?: string | null; exam_date?: string | null; question_source?: 'image_bank' | 'generated' }
      }
      source_materials: {
        Row: {
          id: string; student_id: string; course_id: string; title: string
          file_type: 'pdf' | 'txt'; file_url: string
          processing_status: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'
          extraction_confidence: number | null; needs_review: boolean; error_message: string | null; created_at: string
        }
        Insert: {
          id?: string; student_id: string; course_id: string; title: string
          file_type: 'pdf' | 'txt'; file_url: string
          processing_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'
          extraction_confidence?: number | null; needs_review?: boolean; error_message?: string | null; created_at?: string
        }
        Update: { processing_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'; extraction_confidence?: number | null; needs_review?: boolean; error_message?: string | null }
      }
      knowledge_units: {
        Row: {
          id: string; student_id: string; course_id: string; source_material_id: string
          concept_name: string; plain_english_explanation: string; topic: string; subtopic: string | null
          difficulty_level: number | null; prerequisite_concept_ids: string[]; common_misconceptions: string[]
          testability_score: number | null; extraction_confidence: number | null; source_location: string | null
          created_by_agent: string; reviewed: boolean; created_at: string
        }
        Insert: {
          id?: string; student_id: string; course_id: string; source_material_id: string
          concept_name: string; plain_english_explanation: string; topic: string; subtopic?: string | null
          difficulty_level?: number | null; prerequisite_concept_ids?: string[]; common_misconceptions?: string[]
          testability_score?: number | null; extraction_confidence?: number | null; source_location?: string | null
          created_by_agent?: string; reviewed?: boolean; created_at?: string
        }
        Update: { reviewed?: boolean }
      }
      source_exams: {
        Row: {
          id: string; student_id: string; course_id: string
          course_code: string; year: number; exam_number: number
          original_filename: string; question_count: number | null; created_at: string
        }
        Insert: {
          id?: string; student_id: string; course_id: string
          course_code: string; year: number; exam_number: number
          original_filename: string; question_count?: number | null; created_at?: string
        }
        Update: { question_count?: number | null }
      }
      exam_questions: {
        Row: {
          id: string; student_id: string; course_id: string
          q_id: string; source_doc: string; source_page: string | null; question_type: string
          pack: string | null; pattern: string | null
          difficulty: 'E' | 'P+' | 'INT' | 'ADV'; suitable_use: string | null
          janice_shortcut: string | null; student_visible_trigger: string | null
          what_student_does: string | null; struggle_point: string | null
          why_easy_in_system: string | null; pre_lesson_needed: string | null
          topics: string[]; reagents_involved: string[]; vocab_needed: string[]
          related_knowledge_unit_ids: string[]
          image_url: string | null; ai_tagged: boolean; answer_key: string | null
          verified: boolean
          // Module 3 fields
          hint: string | null; answer_image_url: string | null
          source_exam_id: string | null; exam_number: number | null; exam_year: number | null
          question_order: number | null; point_value: number | null
          sub_parts: string[]; has_structure: boolean; raw_text: string | null
          created_at: string
        }
        Insert: {
          id?: string; student_id: string; course_id: string
          q_id: string; source_doc: string; source_page?: string | null; question_type: string
          pack?: string | null; pattern?: string | null
          difficulty: 'E' | 'P+' | 'INT' | 'ADV'; suitable_use?: string | null
          janice_shortcut?: string | null; student_visible_trigger?: string | null
          what_student_does?: string | null; struggle_point?: string | null
          why_easy_in_system?: string | null; pre_lesson_needed?: string | null
          topics?: string[]; reagents_involved?: string[]; vocab_needed?: string[]
          related_knowledge_unit_ids?: string[]
          image_url?: string | null; ai_tagged?: boolean; answer_key?: string | null
          verified?: boolean
          hint?: string | null; answer_image_url?: string | null
          source_exam_id?: string | null; exam_number?: number | null; exam_year?: number | null
          question_order?: number | null; point_value?: number | null
          sub_parts?: string[]; has_structure?: boolean; raw_text?: string | null
          created_at?: string
        }
        Update: {
          question_type?: string; verified?: boolean; ai_tagged?: boolean
          answer_key?: string | null; hint?: string | null; answer_image_url?: string | null
          question_order?: number | null
        }
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
export type SourceExam = Database['public']['Tables']['source_exams']['Row']
export type SourceExamInsert = Database['public']['Tables']['source_exams']['Insert']
export type ExamQuestion = Database['public']['Tables']['exam_questions']['Row']
export type ExamQuestionInsert = Database['public']['Tables']['exam_questions']['Insert']
```

- [ ] **Step 4: Build check**

```powershell
npm run build
```

Expected: clean build, 0 errors.

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/20260602030000_module3_exam_intelligence.sql src/types/database.ts
git commit -m "feat(module3): source_exams table + exam_questions Module 3 columns"
```

---

### Task 2: Question-sheet parser

**Files:**
- Create: `scripts/parse-exam-sheet.ts`

Parses ONE text-based question-sheet PDF using pdfjs-dist. Identifies question boundaries, sub-parts, point values, and flags pages with structures. Run on a single file first to verify extraction before bulk processing.

Filename pattern: `11[CODE][YY]ex[N].pdf` -> course_code, year, exam_number.

- [ ] **Step 1: Create `scripts/parse-exam-sheet.ts`**

```typescript
/// <reference types="node" />
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Disable worker thread — runs synchronously in Node
GlobalWorkerOptions.workerSrc = ''

export interface ParsedSubPart {
  label: string    // 'a', 'b', 'c'
  text: string
  points: number | null
}

export interface ParsedQuestion {
  number: number
  raw_text: string
  sub_parts: ParsedSubPart[]
  point_value: number | null     // total points for this question
  has_structure: boolean         // true if likely contains a drawn structure
  page_number: number            // 1-based page where question starts
}

export interface ParsedExam {
  course_code: string
  year: number
  exam_number: number
  original_filename: string
  questions: ParsedQuestion[]
}

// Parse filename: 11JRF17ex1.pdf -> { course_code: 'JRF', year: 2017, exam_number: 1 }
export function parseFilename(filename: string): { course_code: string; year: number; exam_number: number } | null {
  const base = path.basename(filename, '.pdf').replace(/k$/, '')
  const m = base.match(/^11([A-Za-z]+)(\d{2})ex(\d)$/i)
  if (!m) return null
  return {
    course_code: m[1].toUpperCase(),
    year: 2000 + parseInt(m[2]),
    exam_number: parseInt(m[3]),
  }
}

// Extract text from all pages. Returns array of page text strings (1 per page).
export async function extractPages(pdfPath: string): Promise<string[]> {
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const doc = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    pages.push(text)
  }
  return pages
}

// Parse a single page's point value: "(18 pts total)" or "(2 pts)" or "18 points"
function parsePoints(text: string): number | null {
  const m = text.match(/\((\d+)\s*pts?\s*(?:total|each)?\)/i)
    || text.match(/(\d+)\s+points?/i)
  return m ? parseInt(m[1]) : null
}

// Detect if page text likely refers to a drawn structure
function hasStructure(text: string): boolean {
  return /\b(draw|structure|shown|below|above|following|figure)\b/i.test(text)
}

// Split full document text into per-question blocks.
// Questions are delimited by patterns like "1.", "1)", "Question 1", "Q1" at line start.
export function parseQuestions(pages: string[], filename: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  // Build a flat text with page markers so we can recover page_number
  const pageMarkers: { pageIndex: number; charOffset: number }[] = []
  let fullText = ''
  for (let i = 0; i < pages.length; i++) {
    pageMarkers.push({ pageIndex: i, charOffset: fullText.length })
    fullText += pages[i] + ' '
  }

  function pageForOffset(offset: number): number {
    let page = 1
    for (const m of pageMarkers) {
      if (m.charOffset <= offset) page = m.pageIndex + 1
      else break
    }
    return page
  }

  // Match question number delimiters: "1.", "1)", "1 ." at word boundary
  // We look for digits 1-30 followed by . or ) possibly with surrounding whitespace
  const Q_DELIM = /(?:^|\s)(\d{1,2})[.)]\s+(?=[A-Z(])/g
  const matches: { num: number; index: number }[] = []
  let m: RegExpExecArray | null
  while ((m = Q_DELIM.exec(fullText)) !== null) {
    const num = parseInt(m[1])
    if (num >= 1 && num <= 30) {
      matches.push({ num, index: m.index + (m[0].startsWith(' ') ? 1 : 0) })
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index
    const end = i + 1 < matches.length ? matches[i + 1].index : fullText.length
    const block = fullText.slice(start, end).trim()

    const totalPts = parsePoints(block)
    const pageNum = pageForOffset(start)
    const structFlag = hasStructure(block)

    // Extract sub-parts: look for "(a)", "(b)", "a.", "a)" patterns
    const subParts: ParsedSubPart[] = []
    const SUB_DELIM = /\(([a-e])\)\s+|(?:^|\s)([a-e])[.)]\s+/g
    const subMatches: { label: string; index: number }[] = []
    let sm: RegExpExecArray | null
    while ((sm = SUB_DELIM.exec(block)) !== null) {
      subMatches.push({ label: (sm[1] || sm[2]).toLowerCase(), index: sm.index })
    }
    for (let j = 0; j < subMatches.length; j++) {
      const sStart = subMatches[j].index
      const sEnd = j + 1 < subMatches.length ? subMatches[j + 1].index : block.length
      const subText = block.slice(sStart, sEnd).trim()
      subParts.push({
        label: subMatches[j].label,
        text: subText,
        points: parsePoints(subText),
      })
    }

    questions.push({
      number: matches[i].num,
      raw_text: block,
      sub_parts: subParts,
      point_value: totalPts,
      has_structure: structFlag,
      page_number: pageNum,
    })
  }

  return questions
}

// ── CLI entry point ───────────────────────────────────────────────────────────
async function run() {
  const pdfPath = process.argv[2]
  if (!pdfPath) {
    console.error('Usage: npm run parse-exam-sheet -- "path/to/11JRF17ex1.pdf"')
    process.exit(1)
  }

  const meta = parseFilename(pdfPath)
  if (!meta) {
    console.error('Filename does not match pattern 11[CODE][YY]ex[N].pdf')
    process.exit(1)
  }

  console.log(`\nParsing: ${path.basename(pdfPath)}`)
  console.log(`  Detected: code=${meta.course_code} year=${meta.year} exam=${meta.exam_number}`)

  const pages = await extractPages(pdfPath)
  console.log(`  Pages: ${pages.length}`)
  console.log('\n--- RAW PAGE TEXT (first 2 pages) ---')
  pages.slice(0, 2).forEach((p, i) => console.log(`\n[Page ${i + 1}]\n${p}`))

  const questions = parseQuestions(pages, path.basename(pdfPath))
  console.log(`\n--- PARSED QUESTIONS (${questions.length} found) ---`)
  for (const q of questions) {
    console.log(`\nQ${q.number} (page ${q.page_number}, ${q.point_value ?? '?'} pts, ${q.has_structure ? 'HAS STRUCTURE' : 'no structure'})`)
    if (q.sub_parts.length > 0) {
      console.log(`  Sub-parts: ${q.sub_parts.map(s => s.label).join(', ')}`)
    }
    console.log(`  Text preview: ${q.raw_text.slice(0, 120)}...`)
  }

  console.log('\nDone.')
}

run().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
```

- [ ] **Step 2: Add npm script to `package.json`**

```json
"parse-exam-sheet": "tsx scripts/parse-exam-sheet.ts"
```

- [ ] **Step 3: Run on one file to verify extraction**

```powershell
npm run parse-exam-sheet -- "docs/past exams and answer keys/NEW TESTS 10-20/11JRF17ex1.pdf"
```

Expected output: raw page text showing question text is extractable, followed by parsed question list with point values. If pdfjs-dist throws a worker error, change the import to `import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'`.

Review the output and confirm:
- Question boundaries are detected correctly
- Point values are extracted (e.g. "(18 pts total)", "(2 pts)")
- Sub-parts (a/b/c) are detected where present
- `has_structure` is flagged on questions with drawn content

If the regex Q_DELIM misses questions or creates false splits, adjust the pattern based on the actual text before proceeding. The raw page text printed in this step is the ground truth.

- [ ] **Step 4: Commit**

```powershell
git add scripts/parse-exam-sheet.ts package.json
git commit -m "feat(module3): question-sheet parser with pdfjs-dist text extraction"
```

---

### Task 3: Topic proposal script

**Files:**
- Create: `scripts/propose-topics.ts`

Runs the parser across ALL question sheets in NEW TESTS 10-20, sends each question's text to Claude to propose a free-form topic, and prints a deduplicated list for manual review. Does NOT insert to the database. Produces `topic_proposals.json` alongside the script output for reference.

**MANUAL STOP after this task.** Janice reviews the output, collapses it into a canonical topic enum, and confirms before Task 5 proceeds.

- [ ] **Step 1: Create `scripts/propose-topics.ts`**

```typescript
/// <reference types="node" />
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { parseFilename, extractPages, parseQuestions } from './parse-exam-sheet.js'

GlobalWorkerOptions.workerSrc = ''

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('='); if (eq === -1) continue
    const k = t.slice(0, eq).trim(); const v = t.slice(eq + 1).trim()
    if (!(k in process.env)) process.env[k] = v
  }
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const EXAM_DIR = path.join(__dirname, '..', 'docs', 'past exams and answer keys', 'NEW TESTS 10-20')

async function proposeTopic(questionText: string): Promise<string> {
  const resp = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 32,
    messages: [{
      role: 'user',
      content: `This is an organic chemistry exam question. Reply with a 1-3 word topic label (all caps, e.g. RESONANCE, ACIDITY, CONFORMATIONS, MO_BONDING, NOMENCLATURE, NUCLEOPHILICITY). No punctuation, no explanation.\n\nQuestion: ${questionText.slice(0, 500)}`,
    }],
  })
  return resp.content[0]?.type === 'text' ? resp.content[0].text.trim().toUpperCase() : 'UNKNOWN'
}

async function run() {
  const files = fs.readdirSync(EXAM_DIR)
    .filter(f => /^11[A-Za-z]+\d{2}ex\d\.pdf$/i.test(f) && !f.toLowerCase().endsWith('k.pdf'))
    .sort()

  console.log(`Found ${files.length} question sheets.\n`)

  const topicMap = new Map<string, number>()   // topic -> count
  const rows: { file: string; qNum: number; topic: string; preview: string }[] = []

  for (const filename of files) {
    const pdfPath = path.join(EXAM_DIR, filename)
    const meta = parseFilename(filename)
    if (!meta) { console.warn(`  Skipping unrecognised filename: ${filename}`); continue }

    process.stdout.write(`  ${filename} ... `)
    const pages = await extractPages(pdfPath)
    const questions = parseQuestions(pages, filename)
    process.stdout.write(`${questions.length} questions\n`)

    for (const q of questions) {
      const topic = await proposeTopic(q.raw_text)
      topicMap.set(topic, (topicMap.get(topic) ?? 0) + 1)
      rows.push({ file: filename, qNum: q.number, topic, preview: q.raw_text.slice(0, 80) })
    }
  }

  // Print deduplicated list, sorted by frequency
  console.log('\n=== PROPOSED TOPICS (deduplicated, by frequency) ===')
  const sorted = [...topicMap.entries()].sort((a, b) => b[1] - a[1])
  for (const [topic, count] of sorted) {
    console.log(`  ${topic.padEnd(30)} ${count} questions`)
  }
  console.log(`\nTotal: ${rows.length} questions across ${files.length} exams.`)

  // Save raw proposals for reference
  const outPath = path.join(__dirname, '..', 'topic_proposals.json')
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2))
  console.log(`\nFull proposals saved to: topic_proposals.json`)
  console.log('\n*** STOP: Review the list above and define the canonical topic enum before running Task 5. ***')
}

run().catch(err => { console.error(String(err)); process.exit(1) })
```

- [ ] **Step 2: Add npm script to `package.json`**

```json
"propose-topics": "tsx --env-file=.env.local scripts/propose-topics.ts"
```

- [ ] **Step 3: Run the script**

```powershell
npm run propose-topics
```

Expected: prints ~20-30 proposed topic strings with frequencies across all 53 exams, saves `topic_proposals.json`.

- [ ] **Step 4: Commit**

```powershell
git add scripts/propose-topics.ts package.json
git commit -m "feat(module3): topic proposal script — run before Task 5"
```

**=== MANUAL STOP ===**
Review the printed topic list. Collapse synonyms and variants into canonical uppercase names (e.g. `ACIDBASE` + `ACID_BASE` + `ACIDITY` -> `ACIDITY`). Confirm the final enum with Janice. You will pass this confirmed list as the `TOPIC_ENUM` constant in Task 5.

---

### Task 4: Key-page image renderer helper

**Files:**
- Create: `scripts/render-key-pages.py`
- Create: `scripts/render-key-pages.ts` (TypeScript wrapper)

The answer keys are scanned handwritten PDFs. PyMuPDF (already installed: `pip3 install pymupdf`, v1.27.2) renders pages as PNG. The TypeScript ingest script in Task 5 calls the Python helper per key file.

- [ ] **Step 1: Create `scripts/render-key-pages.py`**

```python
# Renders all pages of a PDF as PNG files into an output directory.
# Usage: python scripts/render-key-pages.py <pdf_path> <output_dir>
# Output: <output_dir>/page_0001.png, page_0002.png, ...

import sys
import os
import fitz  # PyMuPDF

def render(pdf_path: str, out_dir: str) -> list[str]:
    os.makedirs(out_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    paths = []
    for i, page in enumerate(doc):
        mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for legibility
        pix = page.get_pixmap(matrix=mat)
        out_path = os.path.join(out_dir, f"page_{str(i + 1).zfill(4)}.png")
        pix.save(out_path)
        paths.append(out_path)
    return paths

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python render-key-pages.py <pdf_path> <output_dir>")
        sys.exit(1)
    rendered = render(sys.argv[1], sys.argv[2])
    for p in rendered:
        print(p)
```

- [ ] **Step 2: Test the Python script on the key file**

```powershell
python scripts/render-key-pages.py "docs/past exams and answer keys/NEW TESTS 10-20/11JRF17ex1k.pdf" "tmp/key-render-test"
```

Expected: prints a list of PNG paths; `tmp/key-render-test/` contains page_0001.png etc. Open one to verify legibility.

- [ ] **Step 3: Create TypeScript wrapper `scripts/render-key-pages.ts`**

This wrapper is imported by the ingest script (Task 5). It calls the Python script and returns the list of PNG paths.

```typescript
/// <reference types="node" />
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PYTHON_SCRIPT = path.join(__dirname, 'render-key-pages.py')

export function renderKeyPages(pdfPath: string, outputDir: string): string[] {
  const result = spawnSync('python', [PYTHON_SCRIPT, pdfPath, outputDir], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(`render-key-pages.py failed: ${result.stderr}`)
  }
  return result.stdout.trim().split('\n').filter(Boolean)
}
```

- [ ] **Step 4: Commit**

```powershell
git add scripts/render-key-pages.py scripts/render-key-pages.ts
git commit -m "feat(module3): PyMuPDF key-page renderer + TypeScript wrapper"
```

---

### Task 5: Full ingest pipeline

**Files:**
- Create: `scripts/ingest-exam-pairs.ts`

**Pre-condition:** Task 3 (topic proposal) is complete, canonical TOPIC_ENUM is confirmed by Janice. Substitute the confirmed enum into the `TOPIC_ENUM` constant below before running.

Pairs all 53 question+key PDFs, then for each pair:
1. Parses question sheet -> questions with sub-parts and point values
2. Infers topic for each question using Claude + confirmed enum
3. Generates a hint per question using Claude (question text only)
4. Renders key pages to temp PNGs, uploads to `exam-question-images` bucket
5. Inserts one `source_exams` row and N `exam_questions` rows

- [ ] **Step 1: Create `scripts/ingest-exam-pairs.ts`**

```typescript
/// <reference types="node" />
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { parseFilename, extractPages, parseQuestions, type ParsedQuestion } from './parse-exam-sheet.js'
import { renderKeyPages } from './render-key-pages.js'

GlobalWorkerOptions.workerSrc = ''

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('='); if (eq === -1) continue
    const k = t.slice(0, eq).trim(); const v = t.slice(eq + 1).trim()
    if (!(k in process.env)) process.env[k] = v
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!
const STUDENT_ID = process.env.STUDENT_ID!
const COURSE_ID = process.env.COURSE_ID!

for (const [k, v] of Object.entries({ SUPABASE_URL, SERVICE_KEY, ANTHROPIC_KEY, STUDENT_ID, COURSE_ID })) {
  if (!v) { console.error(`Missing env: ${k}`); process.exit(1) }
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })
const BUCKET = 'exam-question-images'
const EXAM_DIR = path.join(__dirname, '..', 'docs', 'past exams and answer keys', 'NEW TESTS 10-20')

// ── CANONICAL TOPIC ENUM ─────────────────────────────────────────────────────
// *** REPLACE THIS LIST with the confirmed topics from the Topic Proposal step ***
const TOPIC_ENUM: string[] = [
  'ACIDITY',
  'RESONANCE',
  'CONFORMATIONS',
  'MO_BONDING',
  'NOMENCLATURE',
  'STEREOCHEMISTRY',
  'NUCLEOPHILICITY',
  'LEWIS_STRUCTURES',
  'FORMAL_CHARGE',
  'INTERMOLECULAR_FORCES',
  'ELECTRONEGATIVITY',
  'OTHER',
]

// ── Pair question sheets with key files ──────────────────────────────────────
function pairExams(dir: string): { question: string; key: string }[] {
  const files = fs.readdirSync(dir)
  const questions = files.filter(f => /^11[A-Za-z]+\d{2}ex\d\.pdf$/i.test(f) && !f.toLowerCase().endsWith('k.pdf'))
  const pairs: { question: string; key: string }[] = []
  const orphans: string[] = []

  for (const qFile of questions) {
    const base = path.basename(qFile, '.pdf')
    const keyFile = `${base}k.pdf`
    if (files.includes(keyFile)) {
      pairs.push({
        question: path.join(dir, qFile),
        key: path.join(dir, keyFile),
      })
    } else {
      orphans.push(qFile)
    }
  }

  if (orphans.length > 0) {
    console.warn(`WARNING: ${orphans.length} unpaired question files:`, orphans)
  }
  return pairs
}

// ── Tag topic using canonical enum ───────────────────────────────────────────
async function tagTopic(questionText: string): Promise<string> {
  const resp = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 32,
    messages: [{
      role: 'user',
      content: `Organic chemistry exam question. Pick the SINGLE best topic from this list: ${TOPIC_ENUM.join(', ')}. Reply with ONLY the topic label, nothing else.\n\nQuestion: ${questionText.slice(0, 500)}`,
    }],
  })
  const raw = resp.content[0]?.type === 'text' ? resp.content[0].text.trim().toUpperCase() : 'OTHER'
  return TOPIC_ENUM.includes(raw) ? raw : 'OTHER'
}

// ── Generate hint (question-only, no answer key) ──────────────────────────────
async function generateHint(questionText: string, pointValue: number | null, examNumber: number): Promise<string> {
  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 120,
    messages: [{
      role: 'user',
      content: `You are an organic chemistry study coach writing exam hints for students.

QUESTION: ${questionText.slice(0, 800)}
POINT VALUE: ${pointValue ?? 'unknown'} pts
EXAM: Midterm ${examNumber}

Write ONE sentence that:
- Names the first move the student should make (method-first)
- Does NOT reveal the answer or final result
- Translates any jargon inline in parentheses on first use (e.g. "resonance structures (electron arrangements that differ only in where electrons are drawn)")
- Is direct and concise — no preamble, no "Hint:"

Reply with ONLY the hint sentence.`,
    }],
  })
  return resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : ''
}

// ── Upload a PNG file to Supabase storage ─────────────────────────────────────
async function uploadPng(localPath: string, storagePath: string): Promise<string> {
  const buffer = fs.readFileSync(localPath)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: 'image/png', upsert: true })
  if (error) throw new Error(`Upload failed ${storagePath}: ${error.message}`)
  return storagePath
}

// ── Process one exam pair ─────────────────────────────────────────────────────
async function processExamPair(questionPdf: string, keyPdf: string): Promise<void> {
  const filename = path.basename(questionPdf)
  const meta = parseFilename(filename)!
  console.log(`\n[${filename}] code=${meta.course_code} year=${meta.year} exam=${meta.exam_number}`)

  // 1. Parse question sheet
  const pages = await extractPages(questionPdf)
  const questions = parseQuestions(pages, filename)
  console.log(`  Parsed ${questions.length} questions`)
  if (questions.length === 0) {
    console.warn('  No questions parsed — skipping. Check raw text output with parse-exam-sheet.')
    return
  }

  // 2. Insert source_exams row (upsert by unique filename+course)
  // @ts-expect-error supabase-js v2 insert types incompatible with TypeScript 6
  const { data: examRow, error: examErr } = await supabase
    .from('source_exams')
    .upsert({
      student_id: STUDENT_ID,
      course_id: COURSE_ID,
      course_code: meta.course_code,
      year: meta.year,
      exam_number: meta.exam_number,
      original_filename: filename,
      question_count: questions.length,
    }, { onConflict: 'course_id,original_filename' })
    .select('id')
    .single()
  if (examErr) throw new Error(`source_exams insert failed: ${examErr.message}`)
  const sourceExamId: string = (examRow as { id: string }).id

  // 3. Render key pages to temp dir
  const tmpDir = path.join(os.tmpdir(), `studyos-key-${meta.course_code}${meta.year}ex${meta.exam_number}`)
  console.log(`  Rendering key pages...`)
  const keyPagePaths = renderKeyPages(keyPdf, tmpDir)
  console.log(`  ${keyPagePaths.length} key pages rendered`)

  // 4. Upload key pages to storage
  const keyStoragePaths: string[] = []
  for (let i = 0; i < keyPagePaths.length; i++) {
    const storagePath = `${STUDENT_ID}/${COURSE_ID}/keys/${meta.course_code}${meta.year}ex${meta.exam_number}/page_${String(i + 1).padStart(4, '0')}.png`
    await uploadPng(keyPagePaths[i], storagePath)
    keyStoragePaths.push(storagePath)
  }
  console.log(`  Uploaded ${keyStoragePaths.length} key page images`)

  // 5. For each question: tag topic, generate hint, map to key page(s), build row
  // Page mapping: question.page_number (1-based) -> key page index
  // The key and question sheets have the same page count for the same exam number.
  // We store the key page(s) that correspond to the question's starting page.
  const rows: object[] = []
  for (const q of questions) {
    process.stdout.write(`    Q${q.number}: tagging...`)
    const topic = await tagTopic(q.raw_text)
    process.stdout.write(` ${topic}, hinting...`)
    const hint = await generateHint(q.raw_text, q.point_value, meta.exam_number)

    // Answer image: key page corresponding to question's page (1-based page_number -> key page index)
    const keyPageIdx = Math.min(q.page_number - 1, keyStoragePaths.length - 1)
    const answerImageUrl = keyStoragePaths[keyPageIdx] ?? null

    rows.push({
      student_id: STUDENT_ID,
      course_id: COURSE_ID,
      q_id: `${meta.course_code}${meta.year}EX${meta.exam_number}Q${q.number}`,
      source_doc: filename,
      source_page: String(q.page_number),
      question_type: topic,
      pack: null,
      pattern: null,
      difficulty: 'E',
      suitable_use: null,
      janice_shortcut: null,
      student_visible_trigger: null,
      what_student_does: null,
      struggle_point: null,
      why_easy_in_system: null,
      pre_lesson_needed: null,
      topics: [topic],
      reagents_involved: [],
      vocab_needed: [],
      related_knowledge_unit_ids: [],
      image_url: null,
      ai_tagged: true,
      answer_key: null,
      verified: false,
      hint,
      answer_image_url: answerImageUrl,
      source_exam_id: sourceExamId,
      exam_number: meta.exam_number,
      exam_year: meta.year,
      question_order: q.number,
      point_value: q.point_value,
      sub_parts: q.sub_parts.map(s => s.label),
      has_structure: q.has_structure,
      raw_text: q.raw_text,
    })
    process.stdout.write(' done\n')
  }

  // @ts-expect-error supabase-js v2 insert types incompatible with TypeScript 6
  const { error: insertErr } = await supabase.from('exam_questions').insert(rows)
  if (insertErr) throw new Error(`exam_questions insert failed: ${insertErr.message}`)

  // Clean up temp key page files
  for (const p of keyPagePaths) fs.rmSync(p, { force: true })
  try { fs.rmdirSync(tmpDir) } catch { /* ignore if not empty */ }

  console.log(`  Inserted ${rows.length} questions for ${filename}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const pairs = pairExams(EXAM_DIR)
  console.log(`Found ${pairs.length} exam pairs.`)

  // Dry-run mode: process first pair only if --dry-run flag passed
  const dryRun = process.argv.includes('--dry-run')
  const toProcess = dryRun ? pairs.slice(0, 1) : pairs
  if (dryRun) console.log('DRY RUN: processing first pair only.')

  let totalQuestions = 0
  for (const { question, key } of toProcess) {
    try {
      await processExamPair(question, key)
    } catch (err) {
      console.error(`  FAILED: ${path.basename(question)}: ${String(err)}`)
    }
  }

  console.log('\nDone.')
}

run().catch(err => { console.error(String(err)); process.exit(1) })
```

- [ ] **Step 2: Add npm script to `package.json`**

```json
"ingest-exam-pairs": "tsx --env-file=.env.local scripts/ingest-exam-pairs.ts"
```

- [ ] **Step 3: Dry run on one pair**

```powershell
npm run ingest-exam-pairs -- --dry-run
```

Expected: processes one exam pair, prints questions tagged and hinted, inserts to DB. Check Supabase dashboard: one `source_exams` row, N `exam_questions` rows with `hint` and `answer_image_url` populated, `verified=false`.

- [ ] **Step 4: Full run on all 53 pairs**

```powershell
npm run ingest-exam-pairs
```

Expected: processes all 53 pairs, prints per-question progress. Any failed pairs are logged with their error but do not stop the pipeline.

- [ ] **Step 5: Commit**

```powershell
git add scripts/ingest-exam-pairs.ts package.json
git commit -m "feat(module3): full exam pair ingest pipeline — hints + key images + DB insert"
```

---

### Task 6: Frequency map script

**Files:**
- Create: `scripts/build-frequency-map.ts`

Queries `exam_questions` + `source_exams` from Supabase and prints a point-weighted frequency table: per-topic totals broken down by exam_number.

- [ ] **Step 1: Create `scripts/build-frequency-map.ts`**

```typescript
/// <reference types="node" />
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('='); if (eq === -1) continue
    const k = t.slice(0, eq).trim(); const v = t.slice(eq + 1).trim()
    if (!(k in process.env)) process.env[k] = v
  }
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const COURSE_ID = process.env.COURSE_ID!

interface Row { question_type: string; exam_number: number | null; point_value: number | null; source_exam_id: string | null }

async function run() {
  const { data, error } = await supabase
    .from('exam_questions')
    .select('question_type, exam_number, point_value, source_exam_id')
    .eq('course_id', COURSE_ID)
    .not('source_exam_id', 'is', null)

  if (error) { console.error(error.message); process.exit(1) }

  const rows = (data ?? []) as Row[]

  // topic -> exam_number -> { total_pts, exam_count, question_count }
  type Cell = { total_pts: number; exam_ids: Set<string>; q_count: number }
  const table = new Map<string, Map<number, Cell>>()

  for (const row of rows) {
    const topic = row.question_type || 'UNKNOWN'
    const exam = row.exam_number ?? 0
    const pts = row.point_value ?? 0
    const examId = row.source_exam_id ?? ''

    if (!table.has(topic)) table.set(topic, new Map())
    const byExam = table.get(topic)!
    if (!byExam.has(exam)) byExam.set(exam, { total_pts: 0, exam_ids: new Set(), q_count: 0 })
    const cell = byExam.get(exam)!
    cell.total_pts += pts
    cell.exam_ids.add(examId)
    cell.q_count++
  }

  // Compute per-topic grand totals for sorting
  const topicTotals = new Map<string, number>()
  for (const [topic, byExam] of table) {
    let total = 0
    for (const cell of byExam.values()) total += cell.total_pts
    topicTotals.set(topic, total)
  }

  const sortedTopics = [...table.keys()].sort((a, b) => (topicTotals.get(b) ?? 0) - (topicTotals.get(a) ?? 0))
  const examNumbers = [...new Set(rows.map(r => r.exam_number ?? 0))].sort((a, b) => a - b)

  // Print table
  const COLS = examNumbers.map(n => n === 0 ? 'Unknown' : `Ex${n}`)
  const colW = 18
  const labelW = 28

  console.log('\n=== EXAM FREQUENCY MAP (point-weighted) ===\n')
  const header = 'Topic'.padEnd(labelW) + COLS.map(c => c.padStart(colW)).join('') + '  TOTAL'
  console.log(header)
  console.log('-'.repeat(header.length))

  for (const topic of sortedTopics) {
    const byExam = table.get(topic)!
    const cells = examNumbers.map(n => {
      const cell = byExam.get(n)
      if (!cell) return ''.padStart(colW)
      return `${cell.total_pts}pts/${cell.exam_ids.size}ex`.padStart(colW)
    })
    const total = topicTotals.get(topic) ?? 0
    console.log(topic.padEnd(labelW) + cells.join('') + `  ${total}pts`)
  }

  // Unique exam count
  const totalExams = new Set(rows.map(r => r.source_exam_id)).size
  console.log(`\nTotal exams in library: ${totalExams}`)
  console.log(`Total questions: ${rows.length}`)
}

run().catch(err => { console.error(String(err)); process.exit(1) })
```

- [ ] **Step 2: Add npm script to `package.json`**

```json
"frequency-map": "tsx --env-file=.env.local scripts/build-frequency-map.ts"
```

- [ ] **Step 3: Run the frequency map**

```powershell
npm run frequency-map
```

Expected: table printed with topics as rows, Ex1/Ex2/Ex3/Ex4 as columns, cells showing `Npts/Mex`, and a TOTAL column. This is the exam-relevance triage output.

- [ ] **Step 4: Commit**

```powershell
git add scripts/build-frequency-map.ts package.json
git commit -m "feat(module3): point-weighted frequency map script"
```

---

### Task 7: Three-tier drill card and exam picker UI

**Files:**
- Modify: `src/pages/DrillPage.tsx`
- Create: `src/pages/ExamPickerPage.tsx`
- Modify: `src/hooks/useExamQuestions.ts`
- Modify: `src/App.tsx`

The existing DrillPage is a two-tier card (QUESTION -> ANSWER). Module 3 adds a HINT tier between them. A new ExamPickerPage offers two entry points: topic worksheet (filter by topic + exam_number) and intact-exam mode (filter by source_exam_id, ordered by question_order).

- [ ] **Step 1: Extend `useExamQuestions.ts` to support two new query modes**

The hook currently fetches all questions for a course. Add two optional params: `sourceExamId` (intact-exam mode) and `examNumber` (used with topic filter for worksheets). When `sourceExamId` is provided, order by `question_order`. Existing callers pass neither and get the current behaviour.

Replace the `useExamQuestions.ts` content:

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ClaudeQuestion } from '../lib/customQuestions'
import type { ExamQuestion, ExamQuestionInsert } from '../types/database'

interface Options {
  sourceExamId?: string   // intact-exam mode: return one exam in original order
  examNumber?: number     // worksheet mode: combined with topic filter from URL
}

export function useExamQuestions(
  courseId: string | undefined,
  studentId: string | undefined,
  options: Options = {}
) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId || !studentId) return
    setLoading(true)

    let query = supabase
      .from('exam_questions')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', studentId)

    if (options.sourceExamId) {
      query = query.eq('source_exam_id', options.sourceExamId).order('question_order', { ascending: true })
    } else if (options.examNumber) {
      query = query.eq('exam_number', options.examNumber).order('created_at', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: true })
    }

    query.then(({ data, error: err }) => {
      setLoading(false)
      if (err) setError(err.message)
      else setQuestions((data as ExamQuestion[]) ?? [])
    })
  }, [courseId, studentId, options.sourceExamId, options.examNumber])

  async function insertQuestions(
    raw: ClaudeQuestion[]
  ): Promise<{ count: number; error: string | null }> {
    if (!courseId || !studentId) return { count: 0, error: 'Missing course or student ID' }
    const rows: ExamQuestionInsert[] = raw.map((q) => ({
      student_id: studentId,
      course_id: courseId,
      q_id: q.q_id,
      source_doc: q.source_doc,
      source_page: q.source_page,
      question_type: q.question_type,
      pack: q.pack,
      pattern: q.pattern,
      difficulty: q.difficulty,
      suitable_use: q.suitable_use,
      janice_shortcut: q.janice_shortcut,
      student_visible_trigger: q.student_visible_trigger,
      what_student_does: q.what_student_does,
      struggle_point: q.struggle_point,
      why_easy_in_system: q.why_easy_in_system,
      pre_lesson_needed: q.pre_lesson_needed,
      topics: q.topics,
      reagents_involved: q.reagents_involved,
      vocab_needed: q.vocab_needed,
      related_knowledge_unit_ids: [],
      verified: false,
    }))
    // @ts-expect-error supabase-js v2 insert types incompatible with TypeScript 6
    const { error: err } = await supabase.from('exam_questions').insert(rows)
    if (err) return { count: 0, error: err.message }
    const { data } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })
    setQuestions((data as ExamQuestion[]) ?? [])
    return { count: rows.length, error: null }
  }

  return { questions, loading, error, insertQuestions }
}
```

- [ ] **Step 2: Update `DrillPage.tsx` to support three-tier cards**

Key changes:
- `tier` state: `'question' | 'hint' | 'answer'` (replaces `flipped: boolean`)
- For questions with a `hint`, show HINT tier after QUESTION (button: "Show hint")
- For questions without a hint, go directly to ANSWER
- ANSWER tier: if `answer_image_url` is set, show it as an image (same pattern as `image_url`)
- Pass `sourceExamId` and `examNumber` options from URL search params to `useExamQuestions`

Replace `src/pages/DrillPage.tsx`:

```typescript
import { useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { DashboardShell } from '../components/layout/DashboardShell'
import { QuestionImageCard } from '../components/questions/QuestionImageCard'
import { useAuth } from '../hooks/useAuth'
import { useExamQuestions } from '../hooks/useExamQuestions'
import type { ExamQuestion } from '../types/database'

type Tier = 'question' | 'hint' | 'answer'

export function DrillPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { session } = useAuth()
  const studentId = session?.user.id

  const sourceExamId = searchParams.get('source_exam_id') ?? undefined
  const examNumberParam = searchParams.get('exam_number')
  const examNumber = examNumberParam ? parseInt(examNumberParam) : undefined
  const topicFilter = searchParams.get('topics')
  const topicSet = topicFilter
    ? new Set(topicFilter.split(',').map(t => t.trim().toUpperCase()))
    : null

  const { questions: allQuestions, loading, error } = useExamQuestions(courseId, studentId, {
    sourceExamId,
    examNumber,
  })

  const questions: ExamQuestion[] = topicSet
    ? allQuestions.filter(q => topicSet.has(q.question_type.toUpperCase()))
    : allQuestions

  const [index, setIndex] = useState(0)
  const [tier, setTier] = useState<Tier>('question')
  const [done, setDone] = useState(false)

  if (loading) return <DashboardShell><p className="text-sm text-gray-400">Loading...</p></DashboardShell>
  if (error) return <DashboardShell><p className="text-sm text-red-600">{error}</p></DashboardShell>

  if (questions.length === 0) {
    return (
      <DashboardShell>
        <div className="text-center py-24">
          <p className="text-gray-500 mb-4">No questions found for this selection.</p>
          <Link to={`/courses/${courseId}`} className="text-indigo-600 hover:underline text-sm">
            Back to course
          </Link>
        </div>
      </DashboardShell>
    )
  }

  if (done) {
    return (
      <DashboardShell>
        <div className="text-center py-24">
          <p className="text-xl font-semibold text-gray-900 mb-2">Session complete</p>
          <p className="text-gray-500 text-sm mb-6">{questions.length} questions reviewed.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setIndex(0); setTier('question'); setDone(false) }}
              className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Drill again
            </button>
            <Link
              to={`/courses/${courseId}`}
              className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Back to course
            </Link>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const q = questions[index]
  const isLast = index === questions.length - 1
  const isImageQuestion = Boolean(q.image_url)
  const hasHint = Boolean(q.hint)

  const handleNext = () => {
    if (isLast) { setDone(true); return }
    setIndex(i => i + 1)
    setTier('question')
  }

  const advanceTier = () => {
    if (tier === 'question') {
      setTier(hasHint ? 'hint' : 'answer')
    } else if (tier === 'hint') {
      setTier('answer')
    }
  }

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <Link to={`/courses/${courseId}/exam-picker`} className="text-sm text-indigo-600 hover:underline">
          Back to picker
        </Link>
        <p className="text-sm text-gray-400">{index + 1} / {questions.length}</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2 mb-4 flex-wrap">
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">
            {q.difficulty}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {q.question_type}
          </span>
          {q.exam_number && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              Exam {q.exam_number}
            </span>
          )}
          {q.point_value && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {q.point_value} pts
            </span>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-4 min-h-64">
          {tier === 'question' && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Question</p>
              {isImageQuestion && q.image_url ? (
                <QuestionImageCard imagePath={q.image_url} className="w-full" />
              ) : (
                <p className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed">{q.raw_text ?? q.question_type}</p>
              )}
            </div>
          )}

          {tier === 'hint' && (
            <div>
              <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-4">Hint</p>
              <div className="bg-indigo-50 rounded-lg p-5">
                <p className="text-base text-indigo-900 leading-relaxed">{q.hint}</p>
              </div>
            </div>
          )}

          {tier === 'answer' && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Answer</p>
              {q.answer_image_url ? (
                <QuestionImageCard imagePath={q.answer_image_url} className="w-full" />
              ) : q.answer_key ? (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-indigo-900">{q.answer_key}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Answer image not yet attached.</p>
              )}
              {q.janice_shortcut && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Shortcut</p>
                  <p className="text-sm font-medium text-gray-900">{q.janice_shortcut}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          {tier !== 'answer' ? (
            <button
              onClick={advanceTier}
              className="bg-indigo-600 text-white text-sm font-medium px-8 py-2 rounded-lg hover:bg-indigo-700"
            >
              {tier === 'question' ? (hasHint ? 'Show hint' : 'Show answer') : 'Show answer'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-indigo-600 text-white text-sm font-medium px-8 py-2 rounded-lg hover:bg-indigo-700"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
```

- [ ] **Step 3: Create `src/pages/ExamPickerPage.tsx`**

This page loads `source_exams` for the course and lets the student pick a drill mode. Topic worksheet mode: pick exam_number -> drill filtered by that exam. Intact-exam mode: pick a specific exam -> drill all its questions in order.

```typescript
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../components/layout/DashboardShell'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { SourceExam } from '../types/database'

export function ExamPickerPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const { session } = useAuth()
  const studentId = session?.user.id
  const navigate = useNavigate()

  const [exams, setExams] = useState<SourceExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'topic' | 'exam'>('topic')

  // For topic worksheet mode
  const [selectedExamNumber, setSelectedExamNumber] = useState<number | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [availableTopics, setAvailableTopics] = useState<string[]>([])

  useEffect(() => {
    if (!courseId || !studentId) return
    Promise.all([
      supabase.from('source_exams').select('*').eq('course_id', courseId).eq('student_id', studentId).order('year').order('exam_number'),
      supabase.from('exam_questions').select('question_type').eq('course_id', courseId).eq('student_id', studentId).not('source_exam_id', 'is', null),
    ]).then(([examRes, topicRes]) => {
      setLoading(false)
      if (examRes.error) { setError(examRes.error.message); return }
      setExams((examRes.data ?? []) as SourceExam[])
      if (!topicRes.error && topicRes.data) {
        const topics = [...new Set((topicRes.data as { question_type: string }[]).map(r => r.question_type))].sort()
        setAvailableTopics(topics)
      }
    })
  }, [courseId, studentId])

  const examNumbers = [...new Set(exams.map(e => e.exam_number))].sort((a, b) => a - b)

  const handleTopicDrill = () => {
    if (!selectedExamNumber || !selectedTopic) return
    navigate(`/courses/${courseId}/drill?exam_number=${selectedExamNumber}&topics=${selectedTopic}`)
  }

  const handleFullExamDrill = (examId: string) => {
    navigate(`/courses/${courseId}/drill?source_exam_id=${examId}`)
  }

  if (loading) return <DashboardShell><p className="text-sm text-gray-400">Loading...</p></DashboardShell>
  if (error) return <DashboardShell><p className="text-sm text-red-600">{error}</p></DashboardShell>

  if (exams.length === 0) {
    return (
      <DashboardShell>
        <div className="text-center py-24">
          <p className="text-gray-500 mb-4">No past exams loaded yet. Run the exam pair ingest script first.</p>
          <Link to={`/courses/${courseId}`} className="text-indigo-600 hover:underline text-sm">Back to course</Link>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <Link to={`/courses/${courseId}`} className="text-sm text-indigo-600 hover:underline">Back to course</Link>
        <h1 className="text-lg font-semibold text-gray-900">Drill</h1>
        <div className="w-24" />
      </div>

      <div className="max-w-xl mx-auto space-y-8">
        {/* Mode toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {(['topic', 'exam'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'topic' ? 'Topic worksheet' : 'Full exam'}
            </button>
          ))}
        </div>

        {mode === 'topic' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Drill questions from a single exam focused on one topic. Builds pattern recognition before testing under pressure.</p>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Exam</label>
              <div className="flex gap-2">
                {examNumbers.map(n => (
                  <button
                    key={n}
                    onClick={() => setSelectedExamNumber(n)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      selectedExamNumber === n
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Exam {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Topic</label>
              <select
                value={selectedTopic}
                onChange={e => setSelectedTopic(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Pick a topic...</option>
                {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button
              onClick={handleTopicDrill}
              disabled={!selectedExamNumber || !selectedTopic}
              className="w-full bg-indigo-600 text-white text-sm font-medium py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start worksheet
            </button>
          </div>
        )}

        {mode === 'exam' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Drill a complete past exam in original order. Builds the meta-skill of recognising which move a mixed question needs.</p>
            {exams.map(exam => (
              <button
                key={exam.id}
                onClick={() => handleFullExamDrill(exam.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {exam.course_code} {exam.year} — Exam {exam.exam_number}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{exam.question_count ?? '?'} questions</p>
                </div>
                <span className="text-gray-400">-&gt;</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
```

- [ ] **Step 4: Add routes to `src/App.tsx`**

Add two new imports and two new `<Route>` entries inside the authenticated route block. The existing `/courses/:id/drill` route stays; add `/courses/:id/exam-picker`.

Find the existing drill route and add the exam-picker route beside it:

```typescript
// Add to imports at top of App.tsx:
import { ExamPickerPage } from './pages/ExamPickerPage'

// Add Route inside authenticated block (alongside existing drill route):
<Route path="/courses/:id/exam-picker" element={<ExamPickerPage />} />
```

- [ ] **Step 5: Wire the ExamPickerPage into CoursePage**

In `src/pages/CoursePage.tsx`, find where the existing "Drill" link is and update it to point to `/courses/${id}/exam-picker` instead of `/courses/${id}/drill`.

```typescript
// Replace the existing Drill link (find it in CoursePage.tsx and change the to= prop):
<Link to={`/courses/${courseId}/exam-picker`} ...>Drill</Link>
```

- [ ] **Step 6: Build check**

```powershell
npm run build
```

Expected: clean build, 0 TypeScript errors.

- [ ] **Step 7: Run tests**

```powershell
npm test
```

Expected: 29 tests pass. If any test references the old `flipped` state or `DrillPage` internals, update them.

- [ ] **Step 8: Commit**

```powershell
git add src/pages/DrillPage.tsx src/pages/ExamPickerPage.tsx src/hooks/useExamQuestions.ts src/App.tsx src/pages/CoursePage.tsx
git commit -m "feat(module3): three-tier drill card + exam picker UI (topic worksheet + full exam mode)"
```

---

## Self-review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| source_exams table (one row per exam file) | Task 1 |
| exam_questions gains hint, answer_image_url, exam metadata | Task 1 |
| Pair 53 question+key files, report orphans | Task 5 (pairExams fn) |
| Text extraction from question sheets (not vision) | Task 2 |
| Point values extracted directly | Task 2 (parsePoints) |
| has_structure flag for drawn structures | Task 2 |
| Topic: two-step (propose then lock enum) | Task 3 + manual stop before Task 5 |
| Hint generated from question only, no key needed | Task 5 (generateHint) |
| Key page attached as image (whole page, by page match) | Task 4 + Task 5 |
| verified:false on all generated content | Task 5 (all rows) |
| Frequency map: point-weighted, by topic x exam_number | Task 6 |
| Three-tier drill card (QUESTION -> HINT -> ANSWER) | Task 7 |
| VIEW 1: topic worksheet (topic + exam_number filter) | Task 7 (ExamPickerPage topic mode + DrillPage) |
| VIEW 2: intact-exam (source_exam_id, original order) | Task 7 (ExamPickerPage exam mode + useExamQuestions) |
| Same rows, two groupings, no data duplication | Task 7 (URL params, one table) |
| Chapter translator exam-relevance triage | NOT IN THIS PLAN — see note below |

**Gap note:** The spec section "Feed it back into the chapter translator" (triage view in ChapterTranslatorPage) is left for a follow-up plan. It requires the frequency map data to be queryable and wired into the existing translator flow, which is a separate concern best addressed after the ingest pipeline proves stable.

**Placeholder scan:** None found. All code blocks contain real implementations.

**Type consistency check:** `SourceExam` exported from `database.ts` Task 1 is used in `ExamPickerPage.tsx` Task 7. `ExamQuestion.hint`, `.answer_image_url`, `.raw_text`, `.exam_number`, `.point_value` added in Task 1 are used in `DrillPage.tsx` Task 7. `useExamQuestions` `options` object introduced in Task 7 Step 1 is called correctly in `DrillPage.tsx` Step 2. All consistent.
