import { describe, it, expect } from 'vitest'
import { createFakeSupabase } from './fake-supabase.js'
import { saveEssayReview, listEssayReviews, hashEssay } from '../essay-reviews.js'
import type { EssayReview } from '../committee-simulator.js'

const SAMPLE_REVIEW: EssayReview = {
  dimensionScores: [{ dimension: 'theme_coherence', score: 4, evidenceQuotes: ['a quote'], challengeQuestion: null }],
  strengths: ['s1', 's2', 's3'],
  priorityFixes: ['f1', 'f2', 'f3'],
  verdict: 'Solid draft.',
  consistencyFlags: [],
}

describe('hashEssay', () => {
  it('is deterministic and 64 hex chars (sha256)', async () => {
    const h1 = await hashEssay('my essay text')
    const h2 = await hashEssay('my essay text')
    expect(h1).toBe(h2)
    expect(h1).toMatch(/^[0-9a-f]{64}$/)
  })

  it('differs for different essay text', async () => {
    expect(await hashEssay('essay one')).not.toBe(await hashEssay('essay two'))
  })
})

describe('saveEssayReview', () => {
  it('inserts a row with hashed essay, scores summary, and full review jsonb', async () => {
    const supabase = createFakeSupabase()
    const saved = await saveEssayReview(supabase as never, {
      profile_id: '11111111-1111-1111-8111-111111111111',
      essay: 'my essay text',
      rubric_version: 'v1',
      review: SAMPLE_REVIEW,
      model: 'claude-sonnet-5',
    })

    expect(saved.profile_id).toBe('11111111-1111-1111-8111-111111111111')
    expect(saved.essay_sha256).toBe(await hashEssay('my essay text'))
    expect(saved.rubric_version).toBe('v1')
    expect(saved.model).toBe('claude-sonnet-5')
    expect(saved.scores.theme_coherence).toBe(4)
    expect((saved.review as unknown as EssayReview).verdict).toBe('Solid draft.')
  })
})

describe('listEssayReviews', () => {
  it('returns reviews for a profile, most recent first', async () => {
    const supabase = createFakeSupabase()
    const profileId = '22222222-2222-2222-8222-222222222222'
    await saveEssayReview(supabase as never, { profile_id: profileId, essay: 'essay A', rubric_version: 'v1', review: SAMPLE_REVIEW, model: 'claude-sonnet-5' })
    await saveEssayReview(supabase as never, { profile_id: profileId, essay: 'essay B', rubric_version: 'v1', review: SAMPLE_REVIEW, model: 'claude-sonnet-5' })

    const reviews = await listEssayReviews(supabase as never, profileId)
    expect(reviews).toHaveLength(2)
    expect(reviews.every(r => r.profile_id === profileId)).toBe(true)
  })

  it('returns an empty array for a profile with no reviews', async () => {
    const supabase = createFakeSupabase()
    const reviews = await listEssayReviews(supabase as never, '33333333-3333-3333-8333-333333333333')
    expect(reviews).toEqual([])
  })
})
