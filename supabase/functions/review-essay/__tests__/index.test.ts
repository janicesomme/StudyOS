import { describe, it, expect } from 'vitest'
import { createFakeSupabase } from '../../../../premed/src/lib/__tests__/fake-supabase.js'
import { createProfile } from '../../../../premed/src/lib/profiles.js'
import { handleReviewEssay, type ReviewEssayDeps } from '../index.ts'

const TOKEN = 'valid-token'
const USER_ID = '11111111-1111-4111-8111-111111111111'

const CANNED_REVIEW = {
  dimensionScores: [
    { dimension: 'theme_coherence', score: 4, evidenceQuotes: ['a quote'], challengeQuestion: null },
  ],
  strengths: ['s1', 's2', 's3'],
  priorityFixes: ['f1', 'f2', 'f3'],
  verdict: 'Solid draft.',
  consistencyFlags: [],
  redFlags: [],
}

function fakeAnthropic(review: unknown = CANNED_REVIEW) {
  return {
    messages: {
      create: async () => ({
        usage: { input_tokens: 1000, output_tokens: 300 },
        content: [{ type: 'tool_use', name: 'critique_essay', input: review }],
      }),
    },
  }
}

async function setup() {
  const supabase = createFakeSupabase({}, { [TOKEN]: { id: USER_ID } })
  const profile = await createProfile(supabase as never, { user_id: USER_ID, gpa_cum: 3.6, mcat_total: 508 })
  return { supabase, profile }
}

function req(body: unknown, headers: Record<string, string> = { Authorization: `Bearer ${TOKEN}` }): Request {
  return new Request('http://localhost/review-essay', { method: 'POST', headers, body: JSON.stringify(body) })
}

function deps(supabase: unknown, anthropic: unknown, now: () => Date = () => new Date()): ReviewEssayDeps {
  return { supabaseAdmin: supabase as never, anthropic: anthropic as never, now }
}

describe('handleReviewEssay — auth', () => {
  it('rejects with no Authorization header', async () => {
    const { supabase } = await setup()
    const res = await handleReviewEssay(req({ essay: 'text' }, {}), deps(supabase, fakeAnthropic()))
    expect(res.status).toBe(401)
  })

  it('rejects an invalid/unknown token', async () => {
    const { supabase } = await setup()
    const res = await handleReviewEssay(req({ essay: 'text' }, { Authorization: 'Bearer garbage' }), deps(supabase, fakeAnthropic()))
    expect(res.status).toBe(401)
  })

  it('rejects when the authenticated user has no premed profile yet', async () => {
    const supabase = createFakeSupabase({}, { [TOKEN]: { id: '99999999-9999-4999-8999-999999999999' } })
    const res = await handleReviewEssay(req({ essay: 'text' }), deps(supabase, fakeAnthropic()))
    expect(res.status).toBe(404)
  })
})

describe('handleReviewEssay — profile_id derivation', () => {
  it('ignores a client-supplied profile_id and uses the JWT-derived one', async () => {
    const { supabase, profile } = await setup()
    const res = await handleReviewEssay(
      req({ essay: 'My essay text.', profile_id: '00000000-0000-4000-8000-000000000000' }),
      deps(supabase, fakeAnthropic())
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.essayReview.profile_id).toBe(profile.id)
  })
})

describe('handleReviewEssay — rate limit', () => {
  it('rejects with 429 once 5 reviews exist in the last 24h for this profile', async () => {
    const { supabase, profile } = await setup()
    const now = new Date('2026-07-04T12:00:00.000Z')
    const recentReviews = Array.from({ length: 5 }, (_, i) => ({
      id: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa${i}`,
      profile_id: profile.id,
      essay_sha256: 'a'.repeat(64),
      rubric_version: 'v1',
      scores: {},
      review: CANNED_REVIEW,
      model: 'claude-sonnet-5',
      created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1h ago
    }))
    ;(supabase as unknown as { _tables: Record<string, unknown[]> })._tables.pm_essay_reviews = recentReviews

    const res = await handleReviewEssay(req({ essay: 'My essay text.' }), deps(supabase, fakeAnthropic(), () => now))
    expect(res.status).toBe(429)
  })

  it('does not count reviews older than 24h', async () => {
    const { supabase, profile } = await setup()
    const now = new Date('2026-07-04T12:00:00.000Z')
    const staleReviews = Array.from({ length: 5 }, (_, i) => ({
      id: `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb${i}`,
      profile_id: profile.id,
      essay_sha256: 'a'.repeat(64),
      rubric_version: 'v1',
      scores: {},
      review: CANNED_REVIEW,
      model: 'claude-sonnet-5',
      created_at: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(), // 25h ago
    }))
    ;(supabase as unknown as { _tables: Record<string, unknown[]> })._tables.pm_essay_reviews = staleReviews

    const res = await handleReviewEssay(req({ essay: 'My essay text.' }), deps(supabase, fakeAnthropic(), () => now))
    expect(res.status).toBe(200)
  })
})

describe('handleReviewEssay — cost gate', () => {
  it('rejects an essay whose projected cost exceeds the hard budget cap, before calling the model', async () => {
    const { supabase } = await setup()
    let called = false
    const anthropic = {
      messages: { create: async () => { called = true; throw new Error('should not be called') } },
    }
    const hugeEssay = 'word '.repeat(1_500_000) // ~7.5M chars — well past the $5 cap at $3/$15 per MTok
    const res = await handleReviewEssay(req({ essay: hugeEssay }), deps(supabase, anthropic))
    expect(res.status).toBe(413)
    expect(called).toBe(false)
  })
})

describe('handleReviewEssay — success path', () => {
  it('returns { essayReview, usage } and applies the prose guard', async () => {
    const { supabase } = await setup()
    const longVerdict = Array.from({ length: 40 }, (_, i) => `w${i}`).join(' ')
    const res = await handleReviewEssay(req({ essay: 'My essay text.' }), deps(supabase, fakeAnthropic({ ...CANNED_REVIEW, verdict: longVerdict })))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.usage).toEqual({ input_tokens: 1000, output_tokens: 300 })
    expect(body.essayReview.review.verdict.split(' ').length).toBeLessThanOrEqual(16)
  })
})

describe('handleReviewEssay — model/schema failure', () => {
  it('returns 502 (not an uncaught throw) when the model response fails schema validation', async () => {
    const { supabase } = await setup()
    const malformed = { ...CANNED_REVIEW, redFlags: [{ key: 'professionalism_issue', note: 'x', evidenceQuote: null }] }
    const res = await handleReviewEssay(req({ essay: 'My essay text.' }), deps(supabase, fakeAnthropic(malformed)))
    expect(res.status).toBe(502)
  })
})
