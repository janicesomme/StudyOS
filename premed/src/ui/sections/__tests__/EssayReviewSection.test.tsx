import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { EssayReview } from '../../../lib/committee-simulator.js'
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
      redFlags: [],
    },
    model: 'claude-sonnet-5',
    created_at: '2026-07-03T00:00:00.000Z',
    ...overrides,
  }
}

function makeSupabase(
  invokeResult: { data?: unknown; error?: unknown } = { data: {} },
  calibrationResult: { data?: unknown[]; error?: unknown } = { data: [] }
) {
  return {
    functions: { invoke: vi.fn().mockResolvedValue(invokeResult) },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue(calibrationResult) }),
  }
}

describe('EssayReviewSection', () => {
  it('shows a textarea and a Get Review button', () => {
    render(<EssayReviewSection reviews={[]} supabase={makeSupabase() as never} onReviewSaved={vi.fn()} />)
    expect(screen.getByPlaceholderText(/paste your personal statement/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get review/i })).toBeInTheDocument()
  })

  it('disables the submit button until essay text is entered', () => {
    render(<EssayReviewSection reviews={[]} supabase={makeSupabase() as never} onReviewSaved={vi.fn()} />)
    const button = screen.getByRole('button', { name: /get review/i })
    expect(button).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText(/paste your personal statement/i), { target: { value: 'My draft.' } })
    expect(button).not.toBeDisabled()
  })

  it('shows an empty state when there are no reviews yet', () => {
    render(<EssayReviewSection reviews={[]} supabase={makeSupabase() as never} onReviewSaved={vi.fn()} />)
    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument()
  })

  it('renders the most recent review by default: dimension score, quote, challenge question, and verdict', () => {
    render(<EssayReviewSection reviews={[makeReview()]} supabase={makeSupabase() as never} onReviewSaved={vi.fn()} />)
    expect(screen.getByText(/theme coherence/i)).toBeInTheDocument()
    expect(screen.getByText('2/5')).toBeInTheDocument()
    expect(screen.getByText(/Ever since I was a young child/)).toBeInTheDocument()
    expect(screen.getByText(/What single moment made you choose medicine/)).toBeInTheDocument()
    expect(screen.getByText(/A cliche-heavy draft/)).toBeInTheDocument()
  })

  it('shows consistency flags only when present', () => {
    const { rerender } = render(<EssayReviewSection reviews={[makeReview()]} supabase={makeSupabase() as never} onReviewSaved={vi.fn()} />)
    expect(screen.queryByText(/consistency flags/i)).not.toBeInTheDocument()

    const withFlag = makeReview({
      review: {
        ...makeReview().review,
        consistencyFlags: ['Essay claims 500 hours; stored activities show 40.'],
      },
    })
    rerender(<EssayReviewSection reviews={[withFlag]} supabase={makeSupabase() as never} onReviewSaved={vi.fn()} />)
    expect(screen.getByText(/consistency flags/i)).toBeInTheDocument()
    expect(screen.getByText(/Essay claims 500 hours/)).toBeInTheDocument()
  })

  it('shows red flags only when present, with the flag name, note, and quote', () => {
    const withRedFlag = makeReview({
      review: {
        ...makeReview().review,
        redFlags: [
          { key: 'cliche_opening_or_closing', note: 'Opens with the stock "ever since I was young" line.', evidenceQuote: 'Ever since I was a young child...' },
        ],
      },
    })
    render(<EssayReviewSection reviews={[withRedFlag]} supabase={makeSupabase() as never} onReviewSaved={vi.fn()} />)
    expect(screen.getByText(/red flags/i)).toBeInTheDocument()
    expect(screen.getByText(/Cliche opening or closing/i)).toBeInTheDocument()
    expect(screen.getByText(/Opens with the stock/)).toBeInTheDocument()
  })

  it('switches the displayed review when a different history entry is clicked', () => {
    const first = makeReview({ id: '11111111-1111-1111-8111-111111111111', created_at: '2026-07-01T00:00:00.000Z' })
    const second = makeReview({
      id: '33333333-3333-3333-8333-333333333333',
      created_at: '2026-07-03T00:00:00.000Z',
      review: { ...makeReview().review, verdict: 'A much stronger second draft.' },
    })
    render(<EssayReviewSection reviews={[second, first]} supabase={makeSupabase() as never} onReviewSaved={vi.fn()} />)
    expect(screen.getByText(/A much stronger second draft/)).toBeInTheDocument()

    fireEvent.click(screen.getByText(new Date(first.created_at).toLocaleDateString()))
    expect(screen.getByText(/A cliche-heavy draft/)).toBeInTheDocument()
  })

  describe('submitting a new review', () => {
    it('invokes review-essay with the essay and school, then awaits onReviewSaved and clears the draft', async () => {
      const saved = makeReview({ id: '44444444-4444-4444-8444-444444444444' })
      const supabase = makeSupabase({ data: { essayReview: saved, usage: { input_tokens: 1, output_tokens: 1 } } })
      const onReviewSaved = vi.fn().mockResolvedValue(undefined)
      render(<EssayReviewSection reviews={[]} supabase={supabase as never} onReviewSaved={onReviewSaved} />)

      fireEvent.change(screen.getByPlaceholderText(/paste your personal statement/i), { target: { value: 'My draft essay.' } })
      fireEvent.change(screen.getByPlaceholderText(/target school/i), { target: { value: 'Tulane' } })
      fireEvent.click(screen.getByRole('button', { name: /get review/i }))

      await waitFor(() => expect(onReviewSaved).toHaveBeenCalled())
      expect(supabase.functions.invoke).toHaveBeenCalledWith('review-essay', { body: { essay: 'My draft essay.', school: 'Tulane' } })
      expect((screen.getByPlaceholderText(/paste your personal statement/i) as HTMLTextAreaElement).value).toBe('')
    })

    it('surfaces an error from the edge function without crashing', async () => {
      const supabase = makeSupabase({ error: { message: 'boom', context: undefined } })
      render(<EssayReviewSection reviews={[]} supabase={supabase as never} onReviewSaved={vi.fn()} />)

      fireEvent.change(screen.getByPlaceholderText(/paste your personal statement/i), { target: { value: 'My draft essay.' } })
      fireEvent.click(screen.getByRole('button', { name: /get review/i }))

      await waitFor(() => expect(screen.getByText(/boom/)).toBeInTheDocument())
    })
  })

  describe('benchmark overlay', () => {
    it('shows the accepted-essay range caption and a band for each calibrated dimension', async () => {
      const calibrationRows = [{ scores: { theme_coherence: 3 } }, { scores: { theme_coherence: 5 } }, { scores: { theme_coherence: 4 } }]
      const supabase = makeSupabase(undefined, { data: calibrationRows })
      render(<EssayReviewSection reviews={[makeReview()]} supabase={supabase as never} onReviewSaved={vi.fn()} />)

      await waitFor(() => expect(screen.getByText(/accepted-essay range/i)).toBeInTheDocument())
      expect(screen.getByText(/n=3 published essays/i)).toBeInTheDocument()
      expect(screen.getByTestId('calibration-band-theme_coherence')).toBeInTheDocument()
    })

    it('omits the band for a dimension the current review has but calibration does not cover', async () => {
      const baseReview = makeReview().review as unknown as EssayReview
      const withMissionFit = makeReview({
        review: {
          ...baseReview,
          dimensionScores: [...baseReview.dimensionScores, { dimension: 'mission_fit', score: 4, evidenceQuotes: ['q'], challengeQuestion: null }],
        },
      })
      const supabase = makeSupabase(undefined, { data: [{ scores: { theme_coherence: 4 } }] })
      render(<EssayReviewSection reviews={[withMissionFit]} supabase={supabase as never} onReviewSaved={vi.fn()} />)

      await waitFor(() => expect(screen.getByTestId('calibration-band-theme_coherence')).toBeInTheDocument())
      expect(screen.queryByTestId('calibration-band-mission_fit')).not.toBeInTheDocument()
    })

    it('renders no overlay when the calibration table is empty', async () => {
      const supabase = makeSupabase(undefined, { data: [] })
      render(<EssayReviewSection reviews={[makeReview()]} supabase={supabase as never} onReviewSaved={vi.fn()} />)

      await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('pm_rubric_calibration'))
      expect(screen.queryByText(/accepted-essay range/i)).not.toBeInTheDocument()
    })

    it('logs a console error and renders no overlay when the calibration fetch fails, without crashing', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const supabase = makeSupabase(undefined, { error: { message: 'RLS denied' } })
      render(<EssayReviewSection reviews={[makeReview()]} supabase={supabase as never} onReviewSaved={vi.fn()} />)

      await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled())
      expect(screen.queryByText(/accepted-essay range/i)).not.toBeInTheDocument()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('render hierarchy', () => {
    it('renders verdict, then Your three moves, then dimension detail, then red flags/consistency flags, in that order', () => {
      const base = makeReview()
      const withFlags = makeReview({
        review: {
          ...base.review,
          consistencyFlags: ['A consistency flag.'],
          redFlags: [{ key: 'cliche_opening_or_closing', note: 'A red flag note.', evidenceQuote: 'quote' }],
        },
      })
      const { container } = render(<EssayReviewSection reviews={[withFlags]} supabase={makeSupabase() as never} onReviewSaved={vi.fn()} />)
      const text = container.textContent ?? ''

      const verdictPos = text.indexOf('A cliche-heavy draft')
      const movesPos = text.indexOf('Your three moves')
      const dimensionPos = text.indexOf('Theme Coherence')
      const flagsPos = text.indexOf('A red flag note.')

      expect(verdictPos).toBeGreaterThan(-1)
      expect(verdictPos).toBeLessThan(movesPos)
      expect(movesPos).toBeLessThan(dimensionPos)
      expect(dimensionPos).toBeLessThan(flagsPos)
    })
  })
})
