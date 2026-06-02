/// <reference types="node" />
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Point to the worker file co-located with the legacy build of pdfjs-dist.
// The path is resolved relative to pdf.mjs itself, so './pdf.worker.mjs' works.
GlobalWorkerOptions.workerSrc = './pdf.worker.mjs'

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

// -- CLI entry point ----------------------------------------------------------
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
