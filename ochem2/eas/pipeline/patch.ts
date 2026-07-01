/// <reference types="node" />
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
GlobalWorkerOptions.workerSrc = pathToFileURL(
  require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
).href

const EAS_ROOT   = path.resolve(__dirname, '..')
const CORPUS_DIR = path.resolve(EAS_ROOT, 'corpus')

// ---------------------------------------------------------------------------
// Minimal text extraction (same as extract.ts)
// ---------------------------------------------------------------------------

type TItem = { str: string; x: number; y: number }

async function extractFullText(pdfPath: string, twoColumn = false): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const doc  = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise
  const pageTexts: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page    = await doc.getPage(i)
    const content = await page.getTextContent()
    const items: TItem[] = content.items
      .filter((it: any) => 'str' in it && it.str.trim() !== '')
      .map((it: any) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))

    const render = (its: TItem[]) => {
      const sorted = [...its].sort((a, b) =>
        Math.abs(a.y - b.y) > 3 ? b.y - a.y : a.x - b.x
      )
      let out = '', lastY: number | null = null
      for (const { str, y } of sorted) {
        if (lastY !== null && Math.abs(y - lastY) > 3) out += '\n'
        out += str
        lastY = y
      }
      return out.trim()
    }

    if (twoColumn) {
      const xs = [...new Set(items.map(i => Math.round(i.x)))].sort((a, b) => a - b)
      let splitX = 306, maxGap = 0
      for (let j = 1; j < xs.length; j++) {
        const gap = xs[j] - xs[j - 1]
        if (gap > maxGap && xs[j - 1] > 100 && xs[j] < 500) {
          maxGap = gap; splitX = (xs[j - 1] + xs[j]) / 2
        }
      }
      const left  = render(items.filter(i => i.x <  splitX))
      const right = render(items.filter(i => i.x >= splitX))
      pageTexts.push(left + (right ? '\n' + right : ''))
    } else {
      pageTexts.push(render(items))
    }
  }
  return pageTexts.join('\n')
}

// Fixed parser: no trailing lookahead — relies solely on \d{1,2} to bound the
// sub-number. This lets "16.77" match even when the next character is "1" (e.g.
// ¹H NMR superscript rendered adjacent to the problem number by pdfjs).
function parseBlocks(text: string, chapterNum: number): Map<string, string> {
  const pattern = new RegExp(
    `(?:^|\\n)[ \\t]*(${chapterNum}\\.(\\d{1,2}))`,
    'gm'
  )
  const matches = [...text.matchAll(pattern)]
  const result  = new Map<string, string>()
  for (let i = 0; i < matches.length; i++) {
    const fullNum   = matches[i][1]
    const start     = matches[i].index! + matches[i][0].indexOf(fullNum)
    const nextStart = i + 1 < matches.length
      ? matches[i + 1].index! + matches[i + 1][0].indexOf(matches[i + 1][1])
      : text.length
    if (!result.has(fullNum)) result.set(fullNum, text.slice(start, nextStart).trim())
  }
  return result
}

function normalizeMcMurryNumbers(text: string): string {
  return text.replace(
    /\b1\s+6\s+\.\s+(\d(?:\s+\d)*)\b/g,
    (_, d: string) => '16.' + d.replace(/\s+/g, '')
  )
}

// ---------------------------------------------------------------------------
// Patch targets
// ---------------------------------------------------------------------------

const DROP_KLEIN = new Set([
  '18.8','18.9','18.10','18.16','18.17','18.19','18.26','18.27','18.35','18.37',
])

const UNSOLVED_KLEIN = new Set([
  '18.12','18.25','18.32','18.33','18.42','18.46','18.50',
  '18.65','18.69','18.71','18.77','18.87',
])

const UNSOLVED_MCMURRY = new Set([
  '16.25','16.27','16.30','16.34','16.40','16.41','16.46',
  '16.49','16.50','16.54','16.55','16.56','16.60','16.68','16.69','16.74',
])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadJson(file: string): any[] {
  return JSON.parse(fs.readFileSync(path.join(CORPUS_DIR, file), 'utf8'))
}

function saveJson(file: string, data: any[]): void {
  fs.writeFileSync(path.join(CORPUS_DIR, file), JSON.stringify(data, null, 2), 'utf8')
}

const STRUCTURE_CUES = [
  'the following compound','the following reaction','the following structure',
  'the following molecule','the structure shown','shown below','shown above',
  'draw ','draw the','draw a','predict the product','major product',
  'complete the reaction','provide a structure','identify the product',
]
function detectMissingStructure(text: string): boolean {
  const lower = text.toLowerCase()
  return STRUCTURE_CUES.some(c => lower.includes(c))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {

  // ---- 1. Re-extract Smith 16.77 -----------------------------------------
  console.log('Re-extracting Smith 16.77...')
  const smithChText = await extractFullText(
    path.join(EAS_ROOT, 'source-chapters', 'eas-smith-ch16.pdf'), false
  )
  const smithSolText = await extractFullText(
    path.join(EAS_ROOT, 'source-solutions', 'eas-smith-ch16-solutions.pdf'), false
  )
  const smithQBlocks = parseBlocks(smithChText,  16)
  const smithSBlocks = parseBlocks(smithSolText, 16)

  const s77q = smithQBlocks.get('16.77') ?? ''
  const s77s = smithSBlocks.get('16.77') ?? ''
  console.log(`  16.77 question (${s77q.length} chars): ${s77q.slice(0, 120)}`)
  console.log(`  16.77 solution (${s77s.length} chars): ${s77s.slice(0, 120)}`)

  // ---- 2. Re-extract McMurry 16.62 ----------------------------------------
  console.log('\nRe-extracting McMurry 16.62...')
  const mcmurryChText  = await extractFullText(
    path.join(EAS_ROOT, 'source-chapters', 'eas-mcmurry-ch16.pdf'), false
  )
  const mcmurrySolText = normalizeMcMurryNumbers(await extractFullText(
    path.join(EAS_ROOT, 'source-solutions', 'eas-mcmurry-ch16-solutions.pdf'), false
  ))
  const mcmurryQBlocks = parseBlocks(mcmurryChText,  16)
  const mcmurrySBlocks = parseBlocks(mcmurrySolText, 16)

  const m62q = mcmurryQBlocks.get('16.62') ?? ''
  const m62s = mcmurrySBlocks.get('16.62') ?? ''
  console.log(`  16.62 question (${m62q.length} chars): ${m62q.slice(0, 120)}`)
  console.log(`  16.62 solution (${m62s.length} chars): ${m62s.slice(0, 120)}`)

  // ---- Patch Smith JSON ---------------------------------------------------
  console.log('\nPatching eas-smith.json...')
  let smith = loadJson('eas-smith.json')

  // Update or insert 16.77
  const idx77 = smith.findIndex((p: any) => p.problem_number === '16.77')
  const entry77 = {
    id: 'eas-smith-q77',
    source: 'Smith 5e',
    chapter: 16,
    problem_number: '16.77',
    question_text_raw: s77q,
    solution_text_raw: s77s,
    pairing_confidence: (!s77q ? 'low' : !s77s ? 'low' : s77q.replace(/^\d+\.\d+\s*/,'').trim().length < 40 ? 'medium' : 'high') as 'high'|'medium'|'low',
    ...((!s77q || !s77s) ? { pairing_note: !s77q ? 'No matching question found in chapter PDF' : 'No matching solution found in solutions PDF' } : {}),
    has_missing_structure: detectMissingStructure(s77q) || detectMissingStructure(s77s),
    solution_status: 'solved',
  }
  if (idx77 >= 0) smith[idx77] = entry77
  else smith.push(entry77)

  // Add solution_status to all Smith entries
  smith = smith.map((p: any) => ({ ...p, solution_status: p.solution_status ?? 'solved' }))
  // Sort by sub-number
  smith.sort((a: any, b: any) => parseInt(a.problem_number.split('.')[1]) - parseInt(b.problem_number.split('.')[1]))
  saveJson('eas-smith.json', smith)

  // ---- Patch Klein JSON ---------------------------------------------------
  console.log('Patching eas-klein.json...')
  let klein = loadJson('eas-klein.json')

  // Drop in-chapter entries
  klein = klein.filter((p: any) => !DROP_KLEIN.has(p.problem_number))

  // Add solution_status
  klein = klein.map((p: any) => ({
    ...p,
    solution_status: UNSOLVED_KLEIN.has(p.problem_number) ? 'unsolved' : 'solved',
  }))
  klein.sort((a: any, b: any) => parseInt(a.problem_number.split('.')[1]) - parseInt(b.problem_number.split('.')[1]))
  saveJson('eas-klein.json', klein)

  // ---- Patch McMurry JSON ------------------------------------------------
  console.log('Patching eas-mcmurry.json...')
  let mcmurry = loadJson('eas-mcmurry.json')

  // Update or insert 16.62
  const isUnsolved62 = !m62s
  const idx62 = mcmurry.findIndex((p: any) => p.problem_number === '16.62')
  const entry62 = {
    id: 'eas-mcmurry-q62',
    source: 'McMurry 8e',
    chapter: 16,
    problem_number: '16.62',
    question_text_raw: m62q,
    solution_text_raw: m62s,
    pairing_confidence: (!m62q ? 'low' : !m62s ? 'low' : m62q.replace(/^\d+\.\d+\s*/,'').trim().length < 40 ? 'medium' : 'high') as 'high'|'medium'|'low',
    ...( (!m62q || !m62s) ? { pairing_note: !m62q ? 'No matching question found in chapter PDF' : 'No matching solution found in solutions PDF' } : {} ),
    has_missing_structure: detectMissingStructure(m62q) || detectMissingStructure(m62s),
    solution_status: isUnsolved62 ? 'unsolved' : 'solved',
  }
  if (idx62 >= 0) mcmurry[idx62] = entry62
  else mcmurry.push(entry62)

  // Add solution_status to all McMurry entries
  mcmurry = mcmurry.map((p: any) => ({
    ...p,
    solution_status: p.solution_status ?? (UNSOLVED_MCMURRY.has(p.problem_number) ? 'unsolved' : 'solved'),
  }))
  mcmurry.sort((a: any, b: any) => parseInt(a.problem_number.split('.')[1]) - parseInt(b.problem_number.split('.')[1]))
  saveJson('eas-mcmurry.json', mcmurry)

  // ---- Final report -------------------------------------------------------
  console.log('\n=== FINAL COUNTS ===')
  for (const [label, file] of [['Smith','eas-smith.json'],['Klein','eas-klein.json'],['McMurry','eas-mcmurry.json']] as const) {
    const data = loadJson(file)
    const solved   = data.filter((p: any) => p.solution_status === 'solved').length
    const unsolved = data.filter((p: any) => p.solution_status === 'unsolved').length
    console.log(`  ${label}: ${data.length} total | ${solved} solved | ${unsolved} unsolved`)
  }

  console.log('\nPatch complete.')
}

main().catch(console.error)
