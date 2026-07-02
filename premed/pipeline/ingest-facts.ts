import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { readdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import * as XLSX from 'xlsx'
import { PmFactsGridSchema } from '../src/lib/schemas.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Types ────────────────────────────────────────────────────────────────────

export type ParsedFactsRow = {
  gpa_band: string
  mcat_band: string
  applicants: number | null
  applicants_suppressed: boolean
  acceptees: number | null
  acceptees_suppressed: boolean
}

export type ParseResult = {
  sheetName: string
  rows: ParsedFactsRow[]
  totalsRowExcluded: string | null
  totalsColumnExcluded: string | null
}

// ── CLI args ─────────────────────────────────────────────────────────────────

export function parseCliArgs(argv: string[]): { cycleYear: number } {
  const flag = argv.find(a => a.startsWith('--cycle-year='))
  if (!flag) {
    throw new Error('Missing required --cycle-year=<YYYY> flag.')
  }
  const value = flag.split('=')[1]
  const cycleYear = Number(value)
  if (!value || !Number.isInteger(cycleYear) || cycleYear < 2000 || cycleYear > 2100) {
    throw new Error(`--cycle-year must be a 4-digit year, got: "${value}"`)
  }
  return { cycleYear }
}

// ── Source file discovery ────────────────────────────────────────────────────

export function findSourceFile(dir: string): string {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    throw new Error(`Source directory does not exist: ${dir}`)
  }
  const xlsxFiles = entries.filter(f => f.toLowerCase().endsWith('.xlsx'))
  if (xlsxFiles.length === 0) {
    throw new Error(`No .xlsx file found in ${dir}. Drop exactly one AAMC FACTS workbook there.`)
  }
  if (xlsxFiles.length > 1) {
    throw new Error(
      `Expected exactly one .xlsx file in ${dir}, found ${xlsxFiles.length}: ${xlsxFiles.join(', ')}. ` +
        `Remove all but the one file you want to import.`
    )
  }
  return join(dir, xlsxFiles[0])
}

// ── Checksum ─────────────────────────────────────────────────────────────────

export function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

// ── Grid parsing ─────────────────────────────────────────────────────────────

const MCAT_BAND_RE = /^(\d{3}-\d{3}|Less than \d{3}|Greater than \d{3})$/i
const GPA_BAND_RE = /^(\d\.\d{2}-\d\.\d{2}|Less than \d\.\d{2}|Greater than \d\.\d{2})$/i
const TOTALS_LABEL_RE = /^all applicants$/i
const INTEGER_RE = /^\d+$/

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

/** Collapses embedded newlines/runs of whitespace from wrapped Excel cells (e.g. "Less \nthan 486"). */
function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function isRowBlank(row: unknown[]): boolean {
  return row.every(cell => cellText(cell) === '')
}

type Cell = { value: number | null; suppressed: boolean }

/**
 * AAMC blanks a cell to mean zero applicants, and marks a cell "-" when the true
 * count is 1-9 and suppressed for privacy. These are stored as null + a
 * *_suppressed flag rather than coerced to 0, so "zero" and "unknown 1-9" stay
 * distinguishable downstream.
 */
function parseCell(raw: string, sheetName: string, rowIdx: number, colIdx: number): Cell {
  if (raw === '') return { value: 0, suppressed: false }
  if (raw === '-') return { value: null, suppressed: true }
  if (INTEGER_RE.test(raw)) return { value: Number(raw), suppressed: false }
  throw new Error(
    `Sheet "${sheetName}" row ${rowIdx + 1}, column ${colIdx + 1}: expected an integer, "-" (suppressed, n<10), ` +
      `or blank (zero), got "${raw}".`
  )
}

/**
 * Parses an AAMC FACTS Table A-23-style GPA×MCAT grid out of a sheet's 2D array.
 * Real layout (verified against the 2023 and 2025 published workbooks): a header
 * row with MCAT band labels ("486-489", "Less than 486", "Greater than 517") plus
 * an "All Applicants" total column, followed by GPA-band groups of three rows each
 * — "Acceptees", "Applicants", "Acceptance rate %" (derived, not stored) — with the
 * GPA band label ("3.60-3.79", "Less than 2.00") in column A only on the first row
 * of the group, ending with an "All Applicants" totals-row group.
 * Structural mismatches (no header found, malformed non-blank cells, out-of-order
 * rows) hard-fail — this is deterministic official-data import, not noisy enrichment.
 */
export function parseFactsGrid(sheet: unknown[][], sheetName: string): ParseResult {
  const headerRowIndex = sheet.findIndex(row => {
    const bandCells = row.filter(c => MCAT_BAND_RE.test(normalize(cellText(c))))
    return bandCells.length >= 2
  })

  if (headerRowIndex === -1) {
    throw new Error(
      `Sheet "${sheetName}": could not find a header row with MCAT band labels (e.g. "486-489"). ` +
        `This AAMC FACTS file's layout does not match the expected Table A-23 grid shape.`
    )
  }

  const headerRow = sheet[headerRowIndex]
  const mcatColumns: { index: number; band: string }[] = []
  headerRow.forEach((cell, index) => {
    const text = normalize(cellText(cell))
    if (MCAT_BAND_RE.test(text)) mcatColumns.push({ index, band: text })
  })

  if (mcatColumns.length === 0) {
    throw new Error(`Sheet "${sheetName}": header row found but no MCAT band columns parsed.`)
  }

  let totalColumnIndex = -1
  if (headerRowIndex > 0) {
    sheet[headerRowIndex - 1].forEach((cell, index) => {
      if (TOTALS_LABEL_RE.test(normalize(cellText(cell)))) totalColumnIndex = index
    })
  }

  const rows: ParsedFactsRow[] = []
  let totalsRowLabel: string | null = null

  let pendingLabel: string | null = null
  let pendingIsTotals = false
  let pendingAcceptees: Map<number, Cell> | null = null

  for (let r = headerRowIndex + 1; r < sheet.length; r++) {
    const row = sheet[r]
    if (isRowBlank(row)) continue // blank spacer row — not a structural error

    const rawLabel = normalize(cellText(row[0]))
    const subLabel = normalize(cellText(row[1])).toLowerCase()

    if (subLabel === 'acceptance rate %') {
      pendingLabel = null
      pendingAcceptees = null
      continue // derived column — not stored
    }

    if (subLabel === 'acceptees') {
      const isTotalsRow = TOTALS_LABEL_RE.test(rawLabel)
      const isGpaBand = GPA_BAND_RE.test(rawLabel)
      if (!isTotalsRow && !isGpaBand) {
        throw new Error(
          `Sheet "${sheetName}" row ${r + 1}: expected a GPA band label (e.g. "3.60-3.79") or "All Applicants" ` +
            `in column A, got "${rawLabel}".`
        )
      }
      pendingLabel = rawLabel
      pendingIsTotals = isTotalsRow
      pendingAcceptees = new Map()
      for (const { index } of mcatColumns) {
        pendingAcceptees.set(index, parseCell(cellText(row[index]), sheetName, r, index))
      }
      if (totalColumnIndex >= 0) {
        pendingAcceptees.set(totalColumnIndex, parseCell(cellText(row[totalColumnIndex]), sheetName, r, totalColumnIndex))
      }
      continue
    }

    if (subLabel === 'applicants') {
      if (pendingLabel === null || pendingAcceptees === null) {
        throw new Error(`Sheet "${sheetName}" row ${r + 1}: "Applicants" row found without a preceding "Acceptees" row.`)
      }
      if (rawLabel !== '') {
        throw new Error(`Sheet "${sheetName}" row ${r + 1}: expected column A blank on the "Applicants" row, got "${rawLabel}".`)
      }

      if (pendingIsTotals) {
        totalsRowLabel = pendingLabel
      } else {
        for (const { index, band } of mcatColumns) {
          const acceptees = pendingAcceptees.get(index)!
          const applicants = parseCell(cellText(row[index]), sheetName, r, index)
          rows.push({
            gpa_band: pendingLabel,
            mcat_band: band,
            applicants: applicants.value,
            applicants_suppressed: applicants.suppressed,
            acceptees: acceptees.value,
            acceptees_suppressed: acceptees.suppressed,
          })
        }
      }
      pendingLabel = null
      pendingAcceptees = null
      continue
    }

    // any other column-B label (e.g. the "Total GPA" sub-header row) is structural, not data
  }

  return {
    sheetName,
    rows,
    totalsRowExcluded: totalsRowLabel,
    totalsColumnExcluded: totalColumnIndex >= 0 ? 'All Applicants' : null,
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { cycleYear } = parseCliArgs(process.argv.slice(2))

  const sourceDir = join(__dirname, '..', 'source-data', 'facts')
  const filePath = findSourceFile(sourceDir)
  const fileName = filePath.split(/[\\/]/).pop()!

  console.log(`Reading ${filePath} (cycle year ${cycleYear})...`)
  const buffer = readFileSync(filePath)
  const checksum = sha256(buffer)

  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: null,
  })

  const { rows, totalsRowExcluded, totalsColumnExcluded } = parseFactsGrid(sheet, sheetName)
  console.log(`Parsed ${rows.length} grid cells from sheet "${sheetName}".`)
  if (totalsRowExcluded) console.log(`  Excluded totals row: "${totalsRowExcluded}"`)
  if (totalsColumnExcluded) console.log(`  Excluded totals column: "${totalsColumnExcluded}"`)
  const suppressedApplicants = rows.filter(r => r.applicants_suppressed).length
  const suppressedAcceptees = rows.filter(r => r.acceptees_suppressed).length
  console.log(`  Suppressed cells (n<10): ${suppressedApplicants} applicants, ${suppressedAcceptees} acceptees`)

  const importedAt = new Date().toISOString()
  const validated = rows.map(row => {
    const candidate = {
      id: '00000000-0000-0000-0000-000000000000', // placeholder, DB assigns real id on insert
      cycle_year: cycleYear,
      gpa_band: row.gpa_band,
      mcat_band: row.mcat_band,
      applicants: row.applicants,
      applicants_suppressed: row.applicants_suppressed,
      acceptees: row.acceptees,
      acceptees_suppressed: row.acceptees_suppressed,
      source_file: fileName,
      source_sheet: sheetName,
      source_sha256: checksum,
      imported_at: importedAt,
    }
    const result = PmFactsGridSchema.safeParse(candidate)
    if (!result.success) {
      const msg = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new Error(
        `Row failed validation (gpa_band="${row.gpa_band}", mcat_band="${row.mcat_band}"): ${msg}`
      )
    }
    const { id, ...upsertRow } = result.data
    return upsertRow
  })

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  console.log('Upserting into pm_facts_grid...')
  const CHUNK = 100
  let upserted = 0
  for (let i = 0; i < validated.length; i += CHUNK) {
    const chunk = validated.slice(i, i + CHUNK)
    const { error } = await supabase
      .from('pm_facts_grid')
      .upsert(chunk, { onConflict: 'cycle_year,gpa_band,mcat_band' })
    if (error) throw new Error(`pm_facts_grid upsert failed (chunk ${i}): ${error.message}`)
    upserted += chunk.length
  }

  const { count, error: countError } = await supabase
    .from('pm_facts_grid')
    .select('*', { count: 'exact', head: true })
    .eq('cycle_year', cycleYear)
  if (countError) throw new Error(`Post-load count failed: ${countError.message}`)

  console.log('\n=== DONE ===')
  console.log(`File:              ${fileName}`)
  console.log(`Sheet:             ${sheetName}`)
  console.log(`SHA-256:           ${checksum}`)
  console.log(`Rows parsed:       ${rows.length}`)
  console.log(`Rows upserted:     ${upserted}`)
  console.log(`pm_facts_grid rows for cycle_year=${cycleYear}: ${count}`)
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  main().catch(err => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
