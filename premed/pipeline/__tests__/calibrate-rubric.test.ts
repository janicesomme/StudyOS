import { describe, it, expect } from 'vitest'
import type { EssayReview } from '../../src/lib/committee-simulator.js'
import { splitEssayBlocks, buildCalibrationRow, formatBlockSummary, parseCalibrateRubricArgs } from '../calibrate-rubric.js'

const DECOY_ESSAY_TEXT = 'I started writing in 8th grade when a friend showed me her poetry.'

const FAKE_REVIEW: EssayReview = {
  dimensionScores: [
    { dimension: 'theme_coherence', score: 4, evidenceQuotes: [DECOY_ESSAY_TEXT], challengeQuestion: null },
    { dimension: 'narrative_arc', score: 2, evidenceQuotes: ['another verbatim quote from the essay'], challengeQuestion: 'What changed for you specifically?' },
  ],
  strengths: ['A vivid opening scene.', 'b2', 'b3'],
  priorityFixes: ['Cut the cliche closing line.', 'f2', 'f3'],
  verdict: 'A promising draft undercut by a thin middle section.',
  consistencyFlags: ['Essay claims 500 hours; stored activities show 40.'],
  redFlags: [{ key: 'cliche_opening_or_closing', note: 'Opens with a stock line.', evidenceQuote: DECOY_ESSAY_TEXT }],
}

function makeBlock(essayParagraphs: string[], reviewParagraphs: string[]): string {
  return `
    <p><strong>ESSAY</strong></p>
    ${essayParagraphs.map(p => `<p>${p}</p>`).join('\n')}
    <p>
      <div class="shortcodes-wrapper shortcodes-wrapper-left shortcodes-wrapper-medium ">
        <div class="shortcodes-object">
          <blockquote>${essayParagraphs[0]}</blockquote>
        </div>
      </div>
    </p>
    <p>___</p>
    <p><strong>REVIEW</strong></p>
    ${reviewParagraphs.map(p => `<p>${p}</p>`).join('\n')}
    <p><em>Disclaimer: essays are reproduced as originally submitted.</em></p>
  `
}

describe('splitEssayBlocks', () => {
  it('extracts only the essay-span paragraphs (ESSAY through REVIEW), excluding commentary and disclaimer', () => {
    const html = `<html><body>${makeBlock(
      ['I started writing in 8th grade.', 'In college I discovered medical narratives.'],
      ['In her essay, Morgan pitches herself as a future physician.']
    )}</body></html>`

    const blocks = splitEssayBlocks(html, 1)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].text).toContain('I started writing in 8th grade.')
    expect(blocks[0].text).toContain('In college I discovered medical narratives.')
    expect(blocks[0].text).not.toContain('Morgan pitches herself')
    expect(blocks[0].text).not.toContain('Disclaimer')
  })

  it('excludes shortcodes-wrapper pull-quote text and the ___ divider', () => {
    const html = `<html><body>${makeBlock(['Only one real essay paragraph here for this test.'], ['commentary'])}</body></html>`
    const blocks = splitEssayBlocks(html, 1)
    // the pull-quote duplicates essayParagraphs[0] verbatim — text should contain it exactly once (from the real paragraph), not twice
    const occurrences = blocks[0].text.split('Only one real essay paragraph here for this test.').length - 1
    expect(occurrences).toBe(1)
    expect(blocks[0].text).not.toContain('___')
  })

  it('splits multiple blocks in document order', () => {
    const html = `<html><body>${makeBlock(['First essay text.'], ['r1'])}${makeBlock(['Second essay text.'], ['r2'])}</body></html>`
    const blocks = splitEssayBlocks(html, 2)
    expect(blocks[0].text).toContain('First essay text.')
    expect(blocks[1].text).toContain('Second essay text.')
  })

  it('reports an accurate word count per block', () => {
    const html = `<html><body>${makeBlock(['one two three four five'], ['commentary'])}</body></html>`
    const blocks = splitEssayBlocks(html, 1)
    expect(blocks[0].wordCount).toBe(5)
  })

  it('throws when the found block count does not match the expected count', () => {
    const html = `<html><body>${makeBlock(['Only one block here.'], ['commentary'])}</body></html>`
    expect(() => splitEssayBlocks(html, 10)).toThrow(/expected 10.*found 1|found 1.*expected 10/i)
  })
})

describe('buildCalibrationRow', () => {
  it('extracts only dimension scores plus source/version/model metadata — no essay-derived text', () => {
    const row = buildCalibrationRow(FAKE_REVIEW, 'crimson-2019-essay-01', 'https://example.com/essays', 'v1', 'claude-sonnet-5')

    expect(row).toEqual({
      source_label: 'crimson-2019-essay-01',
      source_url: 'https://example.com/essays',
      rubric_version: 'v1',
      scores: { theme_coherence: 4, narrative_arc: 2 },
      model: 'claude-sonnet-5',
    })
  })

  it('never contains any evidenceQuote, commentary, or verdict text anywhere in its output', () => {
    const row = buildCalibrationRow(FAKE_REVIEW, 'crimson-2019-essay-01', 'https://example.com/essays', 'v1', 'claude-sonnet-5')
    const serialized = JSON.stringify(row)
    expect(serialized).not.toContain(DECOY_ESSAY_TEXT)
    expect(serialized).not.toContain(FAKE_REVIEW.verdict)
    expect(serialized).not.toContain(FAKE_REVIEW.strengths[0])
    expect(serialized).not.toContain(FAKE_REVIEW.priorityFixes[0])
    expect(serialized).not.toContain(FAKE_REVIEW.consistencyFlags[0])
  })
})

describe('formatBlockSummary', () => {
  it('formats a label and word count, and contains no essay-derived text', () => {
    const line = formatBlockSummary('crimson-2019-essay-01', 472)
    expect(line).toBe('crimson-2019-essay-01: 472 words')
    expect(line).not.toContain(DECOY_ESSAY_TEXT)
  })
})

describe('parseCalibrateRubricArgs', () => {
  it('defaults go and force to false when not passed', () => {
    expect(parseCalibrateRubricArgs([])).toEqual({ go: false, force: false })
  })

  it('parses --go and --force flags', () => {
    expect(parseCalibrateRubricArgs(['--go', '--force'])).toEqual({ go: true, force: true })
  })
})
