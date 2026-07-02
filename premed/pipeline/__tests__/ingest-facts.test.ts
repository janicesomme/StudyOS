import { describe, it, expect } from 'vitest'
import { parseCliArgs, parseFactsGrid, sha256 } from '../ingest-facts.js'
import {
  happyPathGrid,
  openEndedBandGrid,
  suppressedCellGrid,
  blankRowInGrid,
  missingHeaderGrid,
  malformedCellGrid,
  applicantsWithoutAccepteesGrid,
} from '../__fixtures__/facts-grid-fixtures.js'

describe('parseCliArgs', () => {
  it('parses a valid --cycle-year flag', () => {
    expect(parseCliArgs(['--cycle-year=2026'])).toEqual({ cycleYear: 2026 })
  })

  it('throws when the flag is missing', () => {
    expect(() => parseCliArgs([])).toThrow(/Missing required --cycle-year/)
  })

  it('throws when the value is not a 4-digit year', () => {
    expect(() => parseCliArgs(['--cycle-year=abc'])).toThrow(/must be a 4-digit year/)
    expect(() => parseCliArgs(['--cycle-year=99'])).toThrow(/must be a 4-digit year/)
  })
})

describe('sha256', () => {
  it('is deterministic for identical bytes', () => {
    const a = sha256(Buffer.from('hello'))
    const b = sha256(Buffer.from('hello'))
    expect(a).toBe(b)
    expect(a).toHaveLength(64)
  })

  it('differs for different bytes', () => {
    expect(sha256(Buffer.from('hello'))).not.toBe(sha256(Buffer.from('goodbye')))
  })
})

describe('parseFactsGrid — happy path', () => {
  it('parses GPA-band groups (Acceptees/Applicants rows) and excludes the totals row/column', () => {
    const result = parseFactsGrid(happyPathGrid, 'Sheet1')

    expect(result.sheetName).toBe('Sheet1')
    expect(result.totalsRowExcluded).toBe('All Applicants')
    expect(result.totalsColumnExcluded).toBe('All Applicants')

    // 2 GPA bands x 2 MCAT bands = 4 cells; totals row/column excluded
    expect(result.rows).toHaveLength(4)

    expect(result.rows).toContainEqual({
      gpa_band: '3.60-3.79',
      mcat_band: '510-513',
      applicants: 45,
      applicants_suppressed: false,
      acceptees: 20,
      acceptees_suppressed: false,
    })
    expect(result.rows).toContainEqual({
      gpa_band: '3.40-3.59',
      mcat_band: '514-517',
      applicants: 10,
      applicants_suppressed: false,
      acceptees: 4,
      acceptees_suppressed: false,
    })
  })

  it('does not emit the "Acceptance rate %" row as data', () => {
    const result = parseFactsGrid(happyPathGrid, 'Sheet1')
    for (const row of result.rows) {
      expect(row).not.toHaveProperty('acceptance_rate')
    }
  })
})

describe('parseFactsGrid — open-ended band labels', () => {
  it('parses "Less than X" / "Greater than X" GPA and MCAT bands, normalizing wrapped whitespace', () => {
    const result = parseFactsGrid(openEndedBandGrid, 'Sheet1')

    expect(result.rows).toHaveLength(4)
    expect(result.rows).toContainEqual({
      gpa_band: 'Greater than 3.79',
      mcat_band: 'Less than 486',
      applicants: 320,
      applicants_suppressed: false,
      acceptees: 9,
      acceptees_suppressed: false,
    })
    expect(result.rows).toContainEqual({
      gpa_band: 'Less than 2.00',
      mcat_band: 'Greater than 517',
      applicants: 88,
      applicants_suppressed: false,
      acceptees: 2,
      acceptees_suppressed: false,
    })
  })
})

describe('parseFactsGrid — suppressed cells', () => {
  it('stores AAMC-suppressed cells ("-") as null + suppressed=true, and blank cells as 0', () => {
    const result = parseFactsGrid(suppressedCellGrid, 'Sheet1')

    expect(result.rows).toHaveLength(2)
    expect(result.rows).toContainEqual({
      gpa_band: '2.00-2.19',
      mcat_band: '510-513',
      applicants: 14,
      applicants_suppressed: false,
      acceptees: null,
      acceptees_suppressed: true,
    })
    expect(result.rows).toContainEqual({
      gpa_band: '2.00-2.19',
      mcat_band: '514-517',
      applicants: 0,
      applicants_suppressed: false,
      acceptees: 0,
      acceptees_suppressed: false,
    })
  })
})

describe('parseFactsGrid — blank row inside the grid', () => {
  it('skips blank spacer rows without failing', () => {
    const result = parseFactsGrid(blankRowInGrid, 'Sheet1')
    expect(result.rows).toHaveLength(4)
  })
})

describe('parseFactsGrid — malformed input hard-fails', () => {
  it('throws a clear error when no header row is found', () => {
    expect(() => parseFactsGrid(missingHeaderGrid, 'Sheet1')).toThrow(/could not find a header row/)
  })

  it('throws a clear error when a data cell is not an integer, "-", or blank', () => {
    expect(() => parseFactsGrid(malformedCellGrid, 'Sheet1')).toThrow(/expected an integer/)
  })

  it('throws a clear error when an "Applicants" row has no preceding "Acceptees" row', () => {
    expect(() => parseFactsGrid(applicantsWithoutAccepteesGrid, 'Sheet1')).toThrow(
      /"Applicants" row found without a preceding "Acceptees" row/
    )
  })
})
