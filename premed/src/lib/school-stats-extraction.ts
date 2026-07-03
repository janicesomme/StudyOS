import { JSDOM } from 'jsdom'
import { z } from 'zod'

// Mirrors pm_school_stats' numeric columns (minus id/school_id/source, which
// the pipeline attaches separately). Every field nullable — the model is
// instructed to output null for anything the page doesn't state, never a
// guess. Zod enforces the same domain ranges as the DB's CHECK constraints.
export const ExtractedSchoolStatsSchema = z.object({
  median_gpa: z.number().min(0).max(4.0).nullable(),
  median_mcat: z.number().int().min(472).max(528).nullable(),
  pct_instate: z.number().min(0).max(100).nullable(),
  pct_gap_year: z.number().min(0).max(100).nullable(),
  median_clinical_hours: z.number().int().min(0).nullable(),
  median_research_hours: z.number().int().min(0).nullable(),
  pct_with_publications: z.number().min(0).max(100).nullable(),
  cycle_year: z.number().int().nullable(),
})
export type ExtractedSchoolStats = z.infer<typeof ExtractedSchoolStatsSchema>

/** True when every field is null — signals the model found nothing usable on the page, queue for a Sonnet retry. */
export function isLowQualityExtraction(row: ExtractedSchoolStats): boolean {
  return Object.values(row).every(v => v === null)
}

const MAX_PAGE_TEXT_CHARS = 10000

/** Strips script/style/nav/footer and collapses whitespace, keeping only the readable body text a model needs to extract stats from. */
export function htmlToText(html: string, baseUrl?: string): string {
  const dom = new JSDOM(html, baseUrl ? { url: baseUrl } : undefined)
  const doc = dom.window.document
  for (const el of doc.querySelectorAll('script, style, nav, footer, header, noscript')) el.remove()
  const text = doc.body?.textContent ?? ''
  return text.replace(/\s+/g, ' ').trim()
}

/** Bounds the per-page cost — admissions stats live in the first few thousand characters of these pages, not the whole document. */
export function truncateForExtraction(text: string): string {
  return text.length > MAX_PAGE_TEXT_CHARS ? text.slice(0, MAX_PAGE_TEXT_CHARS) : text
}

/** Rough chars/4 heuristic — good enough for a pre-flight cost estimate, not billing-accurate. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function buildExtractionPrompt(schoolName: string, pageText: string): string {
  return `Extract medical school admissions statistics for "${schoolName}" from the page text below.

Only extract a value if the page explicitly states it. If a stat is not mentioned on this page, output null for it — never estimate, infer, or carry over a number from general knowledge. cycle_year is the entering-class year the stats describe (e.g. "Class of 2029" -> 2029), or null if not stated.

PAGE TEXT:
${pageText}`
}
