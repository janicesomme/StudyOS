import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { PmEssayReview } from '../../../lib/schemas.js'
import { EssayReviewSection } from '../EssayReviewSection.js'

function makeReview(overrides: Partial<PmEssayReview> = {}): PmEssayReview {
  return {
    id: overrides.id ?? '11111111-1111-1111-8111-111111111111',
    profile_id: '22222222-2222-2222-8222-222222222222',
    essay_sha256: 'a'.repeat(64),
    rubric_version: 'v1',
    scores: { theme_coherence: 2 },
    review: {
      dimensionScores: [
        {
          dimension: 'theme_coherence',
          score: 2,
          evidenceQuotes: ['Ever since I was a young child, I have wanted to help people.'],
          challengeQuestion: 'What single moment made you choose medicine specifically?',
        },
      ],
      strengths: ['s1', 's2', 's3'],
      priorityFixes: ['f1', 'f2', 'f3'],
      verdict: 'A cliche-heavy draft needing a stronger throughline.',
      consistencyFlags: [],
    },
    model: 'claude-sonnet-5',
    created_at: '2026-07-03T00:00:00.000Z',
    ...overrides,
  }
}

describe('EssayReviewSection', () => {
  it('always shows the CLI instructions for generating a new review', () => {
    render(<EssayReviewSection reviews={[]} />)
    expect(screen.getByText(/npm run review-essay/)).toBeInTheDocument()
  })

  it('shows an empty state when there are no reviews yet', () => {
    render(<EssayReviewSection reviews={[]} />)
    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument()
  })

  it('renders the most recent review by default: dimension score, quote, challenge question, and verdict', () => {
    render(<EssayReviewSection reviews={[makeReview()]} />)
    expect(screen.getByText(/theme coherence/i)).toBeInTheDocument()
    expect(screen.getByText('2/5')).toBeInTheDocument()
    expect(screen.getByText(/Ever since I was a young child/)).toBeInTheDocument()
    expect(screen.getByText(/What single moment made you choose medicine/)).toBeInTheDocument()
    expect(screen.getByText(/A cliche-heavy draft/)).toBeInTheDocument()
  })

  it('shows consistency flags only when present', () => {
    const { rerender } = render(<EssayReviewSection reviews={[makeReview()]} />)
    expect(screen.queryByText(/consistency flags/i)).not.toBeInTheDocument()

    const withFlag = makeReview({
      review: {
        ...makeReview().review,
        consistencyFlags: ['Essay claims 500 hours; stored activities show 40.'],
      },
    })
    rerender(<EssayReviewSection reviews={[withFlag]} />)
    expect(screen.getByText(/consistency flags/i)).toBeInTheDocument()
    expect(screen.getByText(/Essay claims 500 hours/)).toBeInTheDocument()
  })

  it('switches the displayed review when a different history entry is clicked', () => {
    const first = makeReview({ id: '11111111-1111-1111-8111-111111111111', created_at: '2026-07-01T00:00:00.000Z' })
    const second = makeReview({
      id: '33333333-3333-3333-8333-333333333333',
      created_at: '2026-07-03T00:00:00.000Z',
      review: { ...makeReview().review, verdict: 'A much stronger second draft.' },
    })
    render(<EssayReviewSection reviews={[second, first]} />)
    expect(screen.getByText(/A much stronger second draft/)).toBeInTheDocument()

    fireEvent.click(screen.getByText(new Date(first.created_at).toLocaleDateString()))
    expect(screen.getByText(/A cliche-heavy draft/)).toBeInTheDocument()
  })
})
