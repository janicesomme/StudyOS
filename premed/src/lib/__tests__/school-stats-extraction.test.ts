import { describe, it, expect } from 'vitest'
import {
  ExtractedSchoolStatsSchema,
  buildExtractionPrompt,
  estimateTokens,
  htmlToText,
  isLowQualityExtraction,
  truncateForExtraction,
} from '../school-stats-extraction.js'

const FIXTURE_HTML = `
<!doctype html>
<html>
<head><style>.hero { color: red; }</style></head>
<body>
  <nav>Home | About | Admissions</nav>
  <header>Site Header</header>
  <script>console.log('tracking pixel')</script>
  <main>
    <h1>Class of 2029 Profile</h1>
    <p>Median GPA: 3.75</p>
    <p>Median MCAT: 514</p>
    <p>82% of matriculants are in-state residents.</p>
  </main>
  <footer>Copyright 2026</footer>
</body>
</html>
`

describe('ExtractedSchoolStatsSchema', () => {
  it('accepts a fully-populated row within domain ranges', () => {
    const row = {
      median_gpa: 3.75,
      median_mcat: 514,
      pct_instate: 82,
      pct_gap_year: 45.5,
      median_clinical_hours: 500,
      median_research_hours: 800,
      pct_with_publications: 30,
      cycle_year: 2029,
    }
    expect(ExtractedSchoolStatsSchema.parse(row)).toEqual(row)
  })

  it('accepts an all-null row (page had nothing extractable)', () => {
    const row = {
      median_gpa: null,
      median_mcat: null,
      pct_instate: null,
      pct_gap_year: null,
      median_clinical_hours: null,
      median_research_hours: null,
      pct_with_publications: null,
      cycle_year: null,
    }
    expect(() => ExtractedSchoolStatsSchema.parse(row)).not.toThrow()
  })

  it('rejects a GPA outside the 0-4.0 domain (matches the DB CHECK constraint)', () => {
    expect(() =>
      ExtractedSchoolStatsSchema.parse({
        median_gpa: 5.2,
        median_mcat: null,
        pct_instate: null,
        pct_gap_year: null,
        median_clinical_hours: null,
        median_research_hours: null,
        pct_with_publications: null,
        cycle_year: null,
      })
    ).toThrow()
  })

  it('rejects an MCAT outside the 472-528 domain', () => {
    expect(() =>
      ExtractedSchoolStatsSchema.parse({
        median_gpa: null,
        median_mcat: 999,
        pct_instate: null,
        pct_gap_year: null,
        median_clinical_hours: null,
        median_research_hours: null,
        pct_with_publications: null,
        cycle_year: null,
      })
    ).toThrow()
  })

  it('rejects a negative hours value', () => {
    expect(() =>
      ExtractedSchoolStatsSchema.parse({
        median_gpa: null,
        median_mcat: null,
        pct_instate: null,
        pct_gap_year: null,
        median_clinical_hours: -10,
        median_research_hours: null,
        pct_with_publications: null,
        cycle_year: null,
      })
    ).toThrow()
  })
})

describe('isLowQualityExtraction', () => {
  it('is true when every field is null', () => {
    expect(
      isLowQualityExtraction({
        median_gpa: null,
        median_mcat: null,
        pct_instate: null,
        pct_gap_year: null,
        median_clinical_hours: null,
        median_research_hours: null,
        pct_with_publications: null,
        cycle_year: null,
      })
    ).toBe(true)
  })

  it('is false when even one field is populated', () => {
    expect(
      isLowQualityExtraction({
        median_gpa: 3.7,
        median_mcat: null,
        pct_instate: null,
        pct_gap_year: null,
        median_clinical_hours: null,
        median_research_hours: null,
        pct_with_publications: null,
        cycle_year: null,
      })
    ).toBe(false)
  })
})

describe('htmlToText', () => {
  it('strips script/style/nav/header/footer and keeps readable body content', () => {
    const text = htmlToText(FIXTURE_HTML)
    expect(text).toContain('Median GPA: 3.75')
    expect(text).toContain('Median MCAT: 514')
    expect(text).toContain('82% of matriculants are in-state residents')
    expect(text).not.toContain('tracking pixel')
    expect(text).not.toContain('color: red')
    expect(text).not.toContain('Home | About | Admissions')
    expect(text).not.toContain('Copyright 2026')
  })

  it('collapses whitespace to single spaces', () => {
    const text = htmlToText('<body>  hello   \n\n  world  </body>')
    expect(text).toBe('hello world')
  })
})

describe('truncateForExtraction', () => {
  it('leaves short text untouched', () => {
    expect(truncateForExtraction('short')).toBe('short')
  })

  it('truncates very long text to bound extraction cost', () => {
    const long = 'x'.repeat(20000)
    const truncated = truncateForExtraction(long)
    expect(truncated.length).toBeLessThan(long.length)
    expect(truncated.length).toBeGreaterThan(0)
  })
})

describe('estimateTokens', () => {
  it('is roughly text.length / 4', () => {
    expect(estimateTokens('a'.repeat(400))).toBe(100)
  })

  it('is 0 for empty text', () => {
    expect(estimateTokens('')).toBe(0)
  })
})

describe('buildExtractionPrompt', () => {
  it('includes the school name and page text', () => {
    const prompt = buildExtractionPrompt('Test Medical School', 'Median GPA: 3.8')
    expect(prompt).toContain('Test Medical School')
    expect(prompt).toContain('Median GPA: 3.8')
    expect(prompt.toLowerCase()).toContain('null')
  })
})
