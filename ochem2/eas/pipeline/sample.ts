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

const EAS_ROOT = path.resolve(__dirname, '..')

const BOOKS = [
  {
    name: 'Smith',
    chapterPdf: path.join(EAS_ROOT, 'source-chapters', 'eas-smith-ch16.pdf'),
    // Problem numbers in Smith: 16.1, 16.2, ...
    problemPattern: /\b16\.\d+\b/,
    sectionMarkers: ['Problems', 'PROBLEMS'],
  },
  {
    name: 'Klein',
    chapterPdf: path.join(EAS_ROOT, 'source-chapters', 'eas-klein-ch18.pdf'),
    problemPattern: /\b18\.\d+\b/,
    sectionMarkers: ['Problems', 'PROBLEMS', 'End-of-Chapter Problems'],
  },
  {
    name: 'McMurry',
    chapterPdf: path.join(EAS_ROOT, 'source-chapters', 'eas-mcmurry-ch16.pdf'),
    problemPattern: /\b16\.\d+\b/,
    sectionMarkers: ['Problems', 'Exercises', 'EXERCISES', 'Additional Problems'],
  },
]

// Extract page text preserving line structure via y-position sorting.
async function extractPageText(pdfPath: string): Promise<{ page: number; text: string }[]> {
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const doc = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise
  const results: { page: number; text: string }[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()

    // Sort items by y descending (PDF y=0 is bottom), then x ascending
    const items = content.items
      .filter((item): item is typeof item & { str: string; transform: number[] } => 'str' in item)
      .sort((a, b) => {
        const ay = a.transform[5], by = b.transform[5]
        const ax = a.transform[4], bx = b.transform[4]
        if (Math.abs(ay - by) > 3) return by - ay
        return ax - bx
      })

    let text = ''
    let lastY: number | null = null
    for (const item of items) {
      const y = item.transform[5]
      if (lastY !== null && Math.abs(y - lastY) > 3) text += '\n'
      text += item.str
      lastY = y
    }

    results.push({ page: i, text: text.trim() })
  }

  return results
}

// Find the page index where end-of-chapter problems begin.
function findProblemsStart(pages: { page: number; text: string }[], markers: string[]): number {
  for (let i = 0; i < pages.length; i++) {
    const lines = pages[i].text.split('\n').map(l => l.trim())
    for (const line of lines) {
      if (markers.some(m => line === m || line.startsWith(m))) return i
    }
  }
  // Fallback: last 30% of the PDF is likely the problem set
  return Math.floor(pages.length * 0.7)
}

// Extract up to N distinct problem numbers with their surrounding text (~300 chars each).
function sampleProblems(
  pages: { page: number; text: string }[],
  startIdx: number,
  pattern: RegExp,
  n: number
): { number: string; page: number; snippet: string }[] {
  const samples: { number: string; page: number; snippet: string }[] = []
  const seen = new Set<string>()

  for (let i = startIdx; i < pages.length && samples.length < n; i++) {
    const text = pages[i].text
    let match: RegExpExecArray | null
    const re = new RegExp(pattern.source, 'g')
    while ((match = re.exec(text)) !== null && samples.length < n) {
      const num = match[0]
      if (seen.has(num)) continue
      seen.add(num)
      const start = Math.max(0, match.index - 20)
      const end = Math.min(text.length, match.index + 400)
      samples.push({ number: num, page: i + 1, snippet: text.slice(start, end) })
    }
  }

  return samples
}

async function main() {
  for (const book of BOOKS) {
    console.log('\n' + '='.repeat(72))
    console.log(`BOOK: ${book.name}`)
    console.log(`PDF : ${path.basename(book.chapterPdf)}`)
    console.log('='.repeat(72))

    const pages = await extractPageText(book.chapterPdf)
    console.log(`Total pages extracted: ${pages.length}`)

    const startIdx = findProblemsStart(pages, book.sectionMarkers)
    console.log(`Problems section detected starting at PDF page ${pages[startIdx].page}`)
    console.log(`(Section marker search: ${book.sectionMarkers.join(', ')})`)

    const samples = sampleProblems(pages, startIdx, book.problemPattern, 5)
    console.log(`\nFirst ${samples.length} problem(s) found:\n`)

    for (const s of samples) {
      console.log(`  --- Problem ${s.number} (PDF page ${s.page}) ---`)
      console.log(s.snippet.replace(/\n/g, '\n  '))
      console.log()
    }

    // Also show raw page text for the first page of the problems section
    console.log(`  --- RAW TEXT: problems section page 1 (PDF page ${pages[startIdx].page}) ---`)
    console.log(pages[startIdx].text.slice(0, 1200))
  }
}

main().catch(console.error)
