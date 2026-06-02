/// <reference types="node" />
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { extractPages, parseQuestions } from './parse-exam-sheet.js'

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

    process.stdout.write(`  ${filename} ... `)
    const pages = await extractPages(pdfPath)
    const questions = parseQuestions(pages)
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
