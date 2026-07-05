import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@0.96.0'
import { estimateReviewTokens, reviewEssay } from '../../../premed/src/lib/committee-simulator.ts'
import { saveEssayReview } from '../../../premed/src/lib/essay-reviews.ts'
import { aggregateActivities, getProfile, listActivities } from '../../../premed/src/lib/profiles.ts'
import { RUBRIC_VERSION } from '../../../premed/src/lib/rubrics.ts'
import { findSchool } from '../../../premed/src/lib/school-comparison.ts'

// Browser-native counterpart to premed/pipeline/review-essay.ts — same shared
// rubric/prompt/schema/prose-guard logic (premed/src/lib/committee-simulator.ts),
// same cost-gate protocol, called from the dashboard instead of the CLI.
// See docs/handoffs/2026-07-04-premed-session-9.md.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SONNET = 'claude-sonnet-5'
const PRICING = { input: 3.0, output: 15.0 } // $/MTok — matches premed/pipeline/review-essay.ts
const HARD_BUDGET_CAP = 5.0
const ESTIMATED_OUTPUT_TOKENS = 900
const RATE_LIMIT_MAX_PER_DAY = 5
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function estimatedCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * PRICING.input + outputTokens * PRICING.output) / 1_000_000
}

export type ReviewEssayDeps = {
  supabaseAdmin: ReturnType<typeof createClient>
  anthropic: Anthropic
  now: () => Date
}

/**
 * Exported and dependency-injected (rather than a monolithic Deno.serve
 * closure like archivist/chapter-translator) specifically so it can be unit
 * tested with fake deps — this session's scope requires tests, which the two
 * prior functions never had.
 */
export async function handleReviewEssay(req: Request, deps: ReviewEssayDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Auth — identical pattern to archivist/chapter-translator.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json(401, { error: 'Unauthorized' })

    const {
      data: { user },
      error: authError,
    } = await deps.supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return json(401, { error: 'Unauthorized' })

    // 2. profile_id is always server-derived from the JWT, never trusted from
    // the request body — pm_profiles.id !== auth.users.id, so this mirrors
    // the RLS join every other premed table already uses.
    // deno-lint-ignore no-explicit-any
    const profile = await getProfile(deps.supabaseAdmin as any, user.id)
    if (!profile) return json(404, { error: 'No profile found for this account' })
    const profileId = profile.id

    const body = (await req.json().catch(() => null)) as { essay?: unknown; school?: unknown } | null
    const essay = typeof body?.essay === 'string' ? body.essay.trim() : ''
    const schoolQuery = typeof body?.school === 'string' && body.school.trim() ? body.school.trim() : null
    if (!essay) return json(400, { error: 'Missing essay text' })

    // 3. Rate limit — cheapest check, no external data needed beyond a count.
    const cutoff = new Date(deps.now().getTime() - RATE_LIMIT_WINDOW_MS).toISOString()
    const { count, error: countError } = await deps.supabaseAdmin
      .from('pm_essay_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .gt('created_at', cutoff)
    if (countError) return json(500, { error: `Failed to check rate limit: ${countError.message}` })
    if ((count ?? 0) >= RATE_LIMIT_MAX_PER_DAY) {
      console.error(`review-essay: rate limit exceeded for profile_id=${profileId}`)
      return json(429, { error: `Rate limit exceeded: max ${RATE_LIMIT_MAX_PER_DAY} reviews per 24 hours` })
    }

    // 4. Resolve activities + school — needed to build the real prompt.
    // deno-lint-ignore no-explicit-any
    const activities = await listActivities(deps.supabaseAdmin as any, profileId)
    const activitySummaries = aggregateActivities(activities)
    // deno-lint-ignore no-explicit-any
    const school = schoolQuery ? await findSchool(deps.supabaseAdmin as any, schoolQuery) : null

    const promptInput = {
      essay,
      activitySummaries,
      school: school?.name,
      missionKeywords: school?.mission_keywords ?? undefined,
    }

    // 5. Cost gate — before calling Anthropic, not after.
    const estInputTokens = estimateReviewTokens(promptInput)
    const estCost = estimatedCost(estInputTokens, ESTIMATED_OUTPUT_TOKENS)
    if (estCost > HARD_BUDGET_CAP) {
      console.error(`review-essay: cost gate rejected profile_id=${profileId} estCost=${estCost.toFixed(4)}`)
      return json(413, { error: 'Essay too long — projected cost exceeds the per-review budget cap' })
    }

    // 6. Model call.
    let result: Awaited<ReturnType<typeof reviewEssay>>
    try {
      result = await reviewEssay(deps.anthropic, SONNET, promptInput)
    } catch (err) {
      console.error(`review-essay: Anthropic call failed for profile_id=${profileId}: ${String(err)}`)
      return json(502, { error: 'Model call failed' })
    }

    // 7. Save.
    const saved = await saveEssayReview(
      // deno-lint-ignore no-explicit-any
      deps.supabaseAdmin as any,
      {
        profile_id: profileId,
        essay,
        rubric_version: RUBRIC_VERSION,
        review: result.review,
        model: SONNET,
      }
    )

    // 8. Respond — a concrete, named shape ({ essayReview, usage }), not the
    // bare EssayReview, so the dashboard's typed PmEssayReview[] history is
    // unambiguous about what it's receiving.
    return json(200, { essayReview: saved, usage: result.usage })
  } catch (err) {
    return json(500, { error: `Unexpected error: ${String(err)}` })
  }
}

// Guarded so this file can be imported under Node/Vitest (to unit-test
// handleReviewEssay with fake deps) without the bare `Deno` global throwing.
if (typeof Deno !== 'undefined') {
  Deno.serve(req =>
    handleReviewEssay(req, {
      supabaseAdmin: createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!),
      anthropic: new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! }),
      now: () => new Date(),
    })
  )
}
