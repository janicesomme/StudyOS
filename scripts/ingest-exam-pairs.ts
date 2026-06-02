/// <reference types="node" />
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { extractPages, parseFilename, parseQuestions } from './parse-exam-sheet.js'
import { renderKeyPages } from './render-key-pages.js'

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
// Replace this list with the canonical enum confirmed from the topic proposal step.
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
  try {
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
  } catch {
    return 'OTHER'
  }
}

// ── Generate hint (question-only, no answer key) ──────────────────────────────
async function generateHint(questionText: string, pointValue: number | null, examNumber: number): Promise<string> {
  try {
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
- Is direct and concise -- no preamble, no "Hint:"

Reply with ONLY the hint sentence.`,
      }],
    })
    return resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : ''
  } catch {
    return ''
  }
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
  const questions = parseQuestions(pages)
  console.log(`  Parsed ${questions.length} questions`)
  if (questions.length === 0) {
    console.warn('  No questions parsed -- skipping. Check raw text with npm run parse-exam-sheet.')
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

  try {
    // 5. For each question: tag topic, generate hint, map to key page(s), build row
    const rows: object[] = []
    for (const q of questions) {
      process.stdout.write(`    Q${q.number}: tagging...`)
      const topic = await tagTopic(q.raw_text)
      process.stdout.write(` ${topic}, hinting...`)
      const hint = await generateHint(q.raw_text, q.point_value, meta.exam_number)

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
    console.log(`  Inserted ${rows.length} questions for ${filename}`)
  } finally {
    // Always clean up temp key page files regardless of success or failure
    for (const p of keyPagePaths) {
      try { fs.rmSync(p, { force: true }) } catch { /* ignore */ }
    }
    try { fs.rmdirSync(tmpDir) } catch { /* ignore if not empty */ }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const pairs = pairExams(EXAM_DIR)
  console.log(`Found ${pairs.length} exam pairs.`)

  const dryRun = process.argv.includes('--dry-run')
  const toProcess = dryRun ? pairs.slice(0, 1) : pairs
  if (dryRun) console.log('DRY RUN: processing first pair only.')

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
