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
