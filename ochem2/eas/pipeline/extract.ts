/// <reference types="node" />
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { Problem } from './schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
GlobalWorkerOptions.workerSrc = pathToFileURL(
  require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
).href

const EAS_ROOT = path.resolve(__dirname, '..')
const CORPUS_DIR = path.resolve(EAS_ROOT, 'corpus')

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

type TItem = { str: string; x: number; y: number }

async function getPageItems(pdfPath: string): Promise<TItem[][]> {
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const doc = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise
  const pages: TItem[][] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    pages.push(
      content.items
        .filter((it: any): it is any => 'str' in it && it.str.trim() !== '')
        .map((it: any) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))
    )
  }
  return pages
}

function renderSingleColumn(items: TItem[]): string {
  const sorted = [...items].sort((a, b) =>
    Math.abs(a.y - b.y) > 3 ? b.y - a.y : a.x - b.x
  )
  let out = ''
  let lastY: number | null = null
  for (const { str, y } of sorted) {
    if (lastY !== null && Math.abs(y - lastY) > 3) out += '\n'
    out += str
    lastY = y
  }
  return out.trim()
}

// Klein chapter PDF uses a two-column layout. Detect column boundary via the
// largest horizontal gap in the text-item x distribution, then render each
// column independently (top-to-bottom) and concatenate left + right.
function renderTwoColumn(items: TItem[]): string {
  if (items.length === 0) return ''

  const xs = [...new Set(items.map(i => Math.round(i.x)))].sort((a, b) => a - b)
  let splitX = 306 // default: midpoint of standard 612-pt letter page
  let maxGap = 0
  for (let i = 1; i < xs.length; i++) {
    const gap = xs[i] - xs[i - 1]
    if (gap > maxGap && xs[i - 1] > 100 && xs[i] < 500) {
      maxGap = gap
      splitX = (xs[i - 1] + xs[i]) / 2
    }
  }

  const left  = items.filter(i => i.x <  splitX)
  const right = items.filter(i => i.x >= splitX)
  return renderSingleColumn(left) + (right.length ? '\n' + renderSingleColumn(right) : '')
}

async function extractFullText(pdfPath: string, twoColumn = false): Promise<string> {
  const pages = await getPageItems(pdfPath)
  return pages
    .map(items => twoColumn ? renderTwoColumn(items) : renderSingleColumn(items))
    .join('\n')
}

// ---------------------------------------------------------------------------
// McMurry-specific normalisation
// McMurry solutions renders problem numbers with spaces between every character:
// "1 6 . 4", "1 6 . 1 0", "1 6 . 2 2" — collapse these to "16.4", "16.10", "16.22".
// ---------------------------------------------------------------------------

function normalizeMcMurryNumbers(text: string): string {
  return text.replace(
    /\b1\s+6\s+\.\s+(\d(?:\s+\d)*)\b/g,
    (_, digits: string) => '16.' + digits.replace(/\s+/g, '')
  )
}

// ---------------------------------------------------------------------------
// Problem / solution block parsing
// ---------------------------------------------------------------------------

function findSectionOffset(text: string, markers: string[]): number {
  for (const m of markers) {
    const idx = text.indexOf(m)
    if (idx !== -1) return idx
  }
  return 0
}

// Split text into blocks keyed by "CH.NN".
// Rules:
//   - Number must appear at the start of a line (^|\n plus optional whitespace)
//   - Sub-number is 1–2 digits only (prevents absorbing trailing letters or
//     page numbers: "18.2i" → "18.2", "16.771" → no match)
//   - Must be followed by a non-digit (rejects "16.124" where "12" is followed by "4")
//   - First occurrence wins (avoids duplication from chapter-review summaries)
function parseBlocks(text: string, chapterNum: number): Map<string, string> {
  const pattern = new RegExp(
    `(?:^|\\n)[ \\t]*(${chapterNum}\\.(\\d{1,2}))(?=[^\\d])`,
    'gm'
  )

  const matches = [...text.matchAll(pattern)]
  const result  = new Map<string, string>()

  for (let i = 0; i < matches.length; i++) {
    const fullNum   = matches[i][1]   // e.g. "16.37"
    const start     = matches[i].index! + matches[i][0].indexOf(fullNum)
    const nextStart = i + 1 < matches.length
      ? matches[i + 1].index! + matches[i + 1][0].indexOf(matches[i + 1][1])
      : text.length

    if (!result.has(fullNum)) {
      result.set(fullNum, text.slice(start, nextStart).trim())
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Missing-structure detection
// ---------------------------------------------------------------------------

const STRUCTURE_CUES = [
  'the following compound',
  'the following reaction',
  'the following structure',
  'the following molecule',
  'the structure shown',
  'shown below',
  'shown above',
  'draw ',
  'draw the',
  'draw a',
  'predict the product',
  'major product',
  'complete the reaction',
  'provide a structure',
  'identify the product',
]

function detectMissingStructure(text: string): boolean {
  const lower = text.toLowerCase()
  return STRUCTURE_CUES.some(cue => lower.includes(cue))
}

// ---------------------------------------------------------------------------
// Book configs
// ---------------------------------------------------------------------------

interface BookConfig {
  name: string
  source: string
  chapter: number
  chapterPdf: string
  solutionsPdf: string
  twoColumnChapter: boolean
  questionMarkers: string[]
  solutionMarkers: string[]
  // Solutions with sub-number < this are in-chapter practice problems, not
  // end-of-chapter; skip them to keep the corpus clean.
  firstEocSubNumber: number
  normalizeSolutions: ((text: string) => string) | null
  idPrefix: string
  outputFile: string
}

const BOOKS: BookConfig[] = [
  {
    name: 'Smith',
    source: 'Smith 5e',
    chapter: 16,
    chapterPdf:   path.join(EAS_ROOT, 'source-chapters',  'eas-smith-ch16.pdf'),
    solutionsPdf: path.join(EAS_ROOT, 'source-solutions', 'eas-smith-ch16-solutions.pdf'),
    twoColumnChapter: false,
    questionMarkers: ['PROBLEMS', 'Problems Using Three-Dimensional Models'],
    solutionMarkers: [],
    // Smith in-chapter practice problems are numbered 16.1–16.36;
    // end-of-chapter "Problems" section begins at 16.37.
    firstEocSubNumber: 37,
    normalizeSolutions: null,
    idPrefix: 'eas-smith',
    outputFile: 'eas-smith.json',
  },
  {
    name: 'Klein',
    source: 'Klein 3e',
    chapter: 18,
    chapterPdf:   path.join(EAS_ROOT, 'source-chapters',  'eas-klein-ch18.pdf'),
    solutionsPdf: path.join(EAS_ROOT, 'source-solutions', 'eas-klein-ch18-solutions.pdf'),
    twoColumnChapter: true,
    questionMarkers: ['Problems', 'PROBLEMS'],
    solutionMarkers: [],
    firstEocSubNumber: 1,
    normalizeSolutions: null,
    idPrefix: 'eas-klein',
    outputFile: 'eas-klein.json',
  },
  {
    name: 'McMurry',
    source: 'McMurry 8e',
    chapter: 16,
    chapterPdf:   path.join(EAS_ROOT, 'source-chapters',  'eas-mcmurry-ch16.pdf'),
    solutionsPdf: path.join(EAS_ROOT, 'source-solutions', 'eas-mcmurry-ch16-solutions.pdf'),
    twoColumnChapter: false,
    questionMarkers: ['Exercises', 'EXERCISES', 'Additional Problems'],
    solutionMarkers: [],
    // McMurry in-chapter practice problems run from 16.1–16.24;
    // end-of-chapter "Exercises" section begins at 16.25.
    firstEocSubNumber: 25,
    normalizeSolutions: normalizeMcMurryNumbers,
    idPrefix: 'eas-mcmurry',
    outputFile: 'eas-mcmurry.json',
  },
]

// ---------------------------------------------------------------------------
// Pairing
// ---------------------------------------------------------------------------

function sortKey(fullNum: string): number {
  const sub = fullNum.split('.')[1]
  return parseInt(sub, 10)
}

async function processBook(config: BookConfig): Promise<Problem[]> {
  console.log(`\nProcessing ${config.name}...`)

  // Questions
  console.log('  Extracting chapter text...')
  const chapterText = await extractFullText(config.chapterPdf, config.twoColumnChapter)
  const qOffset     = findSectionOffset(chapterText, config.questionMarkers)
  const questions   = parseBlocks(chapterText.slice(qOffset), config.chapter)
  console.log(`  Questions found: ${questions.size}`)

  // Solutions
  console.log('  Extracting solutions text...')
  let solutionsText = await extractFullText(config.solutionsPdf, false)
  if (config.normalizeSolutions) solutionsText = config.normalizeSolutions(solutionsText)
  const sOffset     = config.solutionMarkers.length
    ? findSectionOffset(solutionsText, config.solutionMarkers)
    : 0
  const solutions   = parseBlocks(solutionsText.slice(sOffset), config.chapter)

  // Drop known in-chapter practice problem solutions (not end-of-chapter)
  for (const key of solutions.keys()) {
    const subNum = parseInt(key.split('.')[1], 10)
    if (subNum < config.firstEocSubNumber) solutions.delete(key)
  }
  console.log(`  Solutions found: ${solutions.size} (after filtering in-chapter practice)`)

  // Build union of all problem numbers found in either set
  const allNums = [...new Set([...questions.keys(), ...solutions.keys()])]
    .sort((a, b) => sortKey(a) - sortKey(b))

  const problems: Problem[] = allNums.map(fullNum => {
    const hasQ  = questions.has(fullNum)
    const hasS  = solutions.has(fullNum)
    const qText = questions.get(fullNum) ?? ''
    const sText = solutions.get(fullNum) ?? ''

    const notes: string[] = []
    let confidence: 'high' | 'medium' | 'low'

    if (!hasQ) {
      confidence = 'low'
      notes.push('No matching question found in chapter PDF')
    } else if (!hasS) {
      confidence = 'low'
      notes.push('No matching solution found in solutions PDF')
    } else {
      const qBody = qText.replace(/^\d+\.\d+\s*/, '').trim()
      if (qBody.length < 40) {
        confidence = 'medium'
        notes.push('Question text very short — likely structure-only with no text scaffold')
      } else {
        confidence = 'high'
      }
    }

    const missingStructure = detectMissingStructure(qText) || detectMissingStructure(sText)
    if (missingStructure) {
      notes.push('Structural diagram(s) in original not captured by text extraction')
    }

    const subNum = fullNum.split('.')[1]

    return {
      id: `${config.idPrefix}-q${subNum}`,
      source: config.source,
      chapter: config.chapter,
      problem_number: fullNum,
      question_text_raw: qText,
      solution_text_raw: sText,
      pairing_confidence: confidence,
      ...(notes.length > 0 ? { pairing_note: notes.join('. ') } : {}),
      has_missing_structure: missingStructure,
    }
  })

  return problems
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(CORPUS_DIR, { recursive: true })

  for (const config of BOOKS) {
    const problems = await processBook(config)

    const outPath = path.join(CORPUS_DIR, config.outputFile)
    fs.writeFileSync(outPath, JSON.stringify(problems, null, 2), 'utf-8')

    const total  = problems.length
    const qFound = problems.filter(p => p.question_text_raw !== '').length
    const sFound = problems.filter(p => p.solution_text_raw !== '').length
    const high   = problems.filter(p => p.pairing_confidence === 'high').length
    const medium = problems.filter(p => p.pairing_confidence === 'medium').length
    const low    = problems.filter(p => p.pairing_confidence === 'low').length
    const struct = problems.filter(p => p.has_missing_structure).length

    console.log(`\n  === ${config.name} ===`)
    console.log(`  Total pairs:       ${total}`)
    console.log(`  Questions found:   ${qFound}`)
    console.log(`  Solutions found:   ${sFound}`)
    console.log(`  High confidence:   ${high}`)
    console.log(`  Medium:            ${medium}`)
    console.log(`  Low:               ${low}`)
    console.log(`  Has structure gap: ${struct}`)

    const flagged = problems.filter(p => p.pairing_confidence !== 'high')
    if (flagged.length > 0) {
      console.log(`\n  MEDIUM / LOW PAIRS:`)
      for (const p of flagged) {
        console.log(`    ${p.problem_number} [${p.pairing_confidence}] — ${p.pairing_note ?? ''}`)
      }
    }

    console.log(`\n  Output: ${outPath}`)
  }

  console.log('\nAll done.')
}

main().catch(console.error)
