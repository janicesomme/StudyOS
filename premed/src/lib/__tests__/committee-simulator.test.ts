import { describe, it, expect } from 'vitest'
import {
  EssayReviewSchema,
  applyProseGuard,
  buildReviewPrompt,
  reviewEssay,
  truncateToWords,
  type EssayReview,
} from '../committee-simulator.js'

const VALID_REVIEW: EssayReview = {
  dimensionScores: [
    {
      dimension: 'theme_coherence',
      score: 2,
      evidenceQuotes: ['Ever since I was a young child, I have wanted to help people.'],
      challengeQuestion: 'What single moment, not a lifelong feeling, made you choose medicine specifically?',
    },
    {
      dimension: 'clinical_motivation_shown_not_told',
      score: 5,
      evidenceQuotes: ['I watched the resident recalibrate the ventilator twice before the numbers held.'],
      challengeQuestion: null,
    },
    {
      dimension: 'narrative_arc',
      score: 4,
      evidenceQuotes: ['By the end of that shift I no longer saw the chart, I saw the patient.'],
      challengeQuestion: null,
    },
    {
      dimension: 'specificity_evidence',
      score: 3,
      evidenceQuotes: ['I volunteered for over 100 hours at the clinic.'],
      challengeQuestion: 'What is one specific patient interaction you have not yet described?',
    },
    {
      dimension: 'reflection_depth',
      score: 3,
      evidenceQuotes: ['It was a rewarding experience that taught me a lot about myself.'],
      challengeQuestion: 'What specifically changed in how you think, not just how you feel?',
    },
  ],
  strengths: [
    'The ventilator scene is vivid and specific.',
    'The closing paragraph returns cleanly to the opening image.',
    'Clinical motivation is demonstrated, not just asserted, in the strongest paragraph.',
  ],
  priorityFixes: [
    'Replace the "ever since I was young" opening with a scene.',
    'Cut the generic "rewarding experience" line and replace it with specific reflection.',
    'Resolve the unexplained gap between sophomore and senior year activities.',
  ],
  verdict: 'A promising draft with one strong scene, undercut by a cliche opening and thin reflection.',
  consistencyFlags: ['Essay claims "over 100 hours" at the clinic; stored activities show only 40 hours logged.'],
}

describe('EssayReviewSchema', () => {
  it('accepts a well-formed review', () => {
    expect(() => EssayReviewSchema.parse(VALID_REVIEW)).not.toThrow()
  })

  it('rejects a weak dimension (score <= 3) with no challenge question', () => {
    const bad = {
      ...VALID_REVIEW,
      dimensionScores: VALID_REVIEW.dimensionScores.map(d => (d.dimension === 'theme_coherence' ? { ...d, challengeQuestion: null } : d)),
    }
    expect(() => EssayReviewSchema.parse(bad)).toThrow()
  })

  it('requires exactly 3 strengths and 3 priority fixes', () => {
    expect(() => EssayReviewSchema.parse({ ...VALID_REVIEW, strengths: ['only one'] })).toThrow()
    expect(() => EssayReviewSchema.parse({ ...VALID_REVIEW, priorityFixes: ['only one'] })).toThrow()
  })
})

describe('truncateToWords', () => {
  it('leaves short text untouched', () => {
    expect(truncateToWords('A short sentence.', 15)).toBe('A short sentence.')
  })

  it('truncates text over the word limit and marks it', () => {
    const long = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ')
    const result = truncateToWords(long, 15)
    expect(result.split(' ').length).toBeLessThanOrEqual(16) // 15 words + the marker token
    expect(result.endsWith('[...]')).toBe(true)
  })
})

describe('applyProseGuard', () => {
  it('truncates over-long generated commentary but leaves short fields untouched', () => {
    const longVerdict = Array.from({ length: 40 }, (_, i) => `w${i}`).join(' ')
    const guarded = applyProseGuard({ ...VALID_REVIEW, verdict: longVerdict })
    expect(guarded.verdict.split(' ').length).toBeLessThanOrEqual(16)
    expect(guarded.strengths[0]).toBe(VALID_REVIEW.strengths[0])
  })

  it('never truncates evidenceQuotes even if long — they must stay verbatim', () => {
    const longQuote = Array.from({ length: 40 }, (_, i) => `w${i}`).join(' ')
    const guarded = applyProseGuard({
      ...VALID_REVIEW,
      dimensionScores: VALID_REVIEW.dimensionScores.map((d, i) => (i === 0 ? { ...d, evidenceQuotes: [longQuote] } : d)),
    })
    expect(guarded.dimensionScores[0].evidenceQuotes[0]).toBe(longQuote)
  })

  it('truncates a long challengeQuestion', () => {
    const longQuestion = Array.from({ length: 30 }, (_, i) => `q${i}`).join(' ') + '?'
    const guarded = applyProseGuard({
      ...VALID_REVIEW,
      dimensionScores: VALID_REVIEW.dimensionScores.map((d, i) => (i === 0 ? { ...d, challengeQuestion: longQuestion } : d)),
    })
    expect(guarded.dimensionScores[0].challengeQuestion!.split(' ').length).toBeLessThanOrEqual(16)
  })
})

describe('buildReviewPrompt', () => {
  it('includes the critique-only hard rule', () => {
    const prompt = buildReviewPrompt({ essay: 'My essay text.' })
    expect(prompt).toMatch(/never rewrite/i)
    expect(prompt).toMatch(/never (draft|generate) (replacement )?(text|prose|sentences)/i)
  })

  it('includes stored activities for consistency checking when given', () => {
    const prompt = buildReviewPrompt({
      essay: 'My essay text.',
      activitySummaries: [{ category: 'clinical_volunteer', hoursCompleted: 40 }],
    })
    expect(prompt).toContain('clinical_volunteer')
    expect(prompt).toContain('40')
  })

  it('omits the activities block when no activities are given', () => {
    const prompt = buildReviewPrompt({ essay: 'My essay text.' })
    expect(prompt).not.toContain('Stored activities')
  })

  it('includes mission_fit scoring instructions only when a school is given', () => {
    const withSchool = buildReviewPrompt({ essay: 'My essay text.', school: 'Tulane', missionKeywords: ['rural', 'primary care'] })
    const withoutSchool = buildReviewPrompt({ essay: 'My essay text.' })
    expect(withSchool).toContain('Tulane')
    expect(withSchool).toContain('mission_fit')
    expect(withoutSchool).not.toContain('mission_fit')
  })
})

describe('reviewEssay', () => {
  it('calls the model with the critique tool forced and returns a parsed, guarded review', async () => {
    let capturedRequest: unknown
    const fakeAnthropic = {
      messages: {
        create: async (req: unknown) => {
          capturedRequest = req
          return {
            usage: { input_tokens: 1200, output_tokens: 300 },
            content: [{ type: 'tool_use', name: 'critique_essay', input: VALID_REVIEW }],
          }
        },
      },
    }

    const result = await reviewEssay(fakeAnthropic as never, 'claude-sonnet-5', { essay: 'My essay text.' })

    expect(result.usage).toEqual({ input_tokens: 1200, output_tokens: 300 })
    expect(result.review.verdict).toBe(VALID_REVIEW.verdict)
    expect((capturedRequest as { tool_choice: { name: string } }).tool_choice.name).toBe('critique_essay')
  })

  it('throws a clear error when the response has no tool_use block', async () => {
    const fakeAnthropic = {
      messages: { create: async () => ({ usage: { input_tokens: 10, output_tokens: 5 }, content: [{ type: 'text', text: 'oops' }] }) },
    }
    await expect(reviewEssay(fakeAnthropic as never, 'claude-sonnet-5', { essay: 'My essay text.' })).rejects.toThrow(/tool_use/)
  })
})
