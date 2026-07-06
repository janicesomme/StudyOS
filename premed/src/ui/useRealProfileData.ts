import { useCallback, useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { computeActivityGaps, type CategoryGap } from '../lib/activity-gap.js'
import { computeApplicantPoolPosition, type ApplicantPoolPosition } from '../lib/corpus-stats.js'
import { listEssayReviews } from '../lib/essay-reviews.js'
import { analyzeProfile, type GapAnalysis } from '../lib/gap-analyzer.js'
import { getProfile, listActivities, profileToSlice } from '../lib/profiles.js'
import type { PmActivity, PmEssayReview, PmProfile } from '../lib/schemas.js'

const CYCLE_YEARS = [2023, 2025]

export type RealProfileData = {
  profile: PmProfile | null
  activities: PmActivity[]
  activityGaps: CategoryGap[] | null
  poolPositions: ApplicantPoolPosition[] | null
  gapAnalysis: GapAnalysis | null
  essayReviews: PmEssayReview[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Fetches + computes everything the dashboard needs for the real (non-demo)
 * profile, using the same premed/src/lib functions the CLI uses — passed the
 * browser's anon-key client, so every read/write goes through RLS exactly as
 * it would for any other logged-in user. No service-role key ever reaches
 * the browser.
 *
 * `userId` is `string | null` — `null` means logged out (no session yet).
 * React hooks can't be called conditionally, so this hook handles that case
 * internally rather than being skipped by its caller: no Supabase calls,
 * empty/default state, `loading: false`.
 */
export function useRealProfileData(supabase: SupabaseClient, userId: string | null): RealProfileData {
  const [profile, setProfile] = useState<PmProfile | null>(null)
  const [activities, setActivities] = useState<PmActivity[]>([])
  const [activityGaps, setActivityGaps] = useState<CategoryGap[] | null>(null)
  const [poolPositions, setPoolPositions] = useState<ApplicantPoolPosition[] | null>(null)
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null)
  const [essayReviews, setEssayReviews] = useState<PmEssayReview[]>([])
  const [loading, setLoading] = useState(userId !== null)
  const [error, setError] = useState<string | null>(null)

  // Always holds the latest userId synchronously, so an in-flight fetch for
  // a stale userId (e.g. after sign-out, or switching accounts) can detect
  // it's stale and drop its result instead of committing state for the
  // wrong user.
  const currentUserIdRef = useRef(userId)
  currentUserIdRef.current = userId

  const resetToEmpty = useCallback(() => {
    setProfile(null)
    setActivities([])
    setActivityGaps(null)
    setPoolPositions(null)
    setGapAnalysis(null)
    setEssayReviews([])
    setLoading(false)
    setError(null)
  }, [])

  const refetch = useCallback(async () => {
    const requestUserId = userId
    if (requestUserId === null) {
      resetToEmpty()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const fetchedProfile = await getProfile(supabase, requestUserId)
      if (currentUserIdRef.current !== requestUserId) return
      setProfile(fetchedProfile)

      if (!fetchedProfile) {
        setActivities([])
        setActivityGaps(null)
        setPoolPositions(null)
        setGapAnalysis(null)
        setEssayReviews([])
        return
      }

      const fetchedActivities = await listActivities(supabase, fetchedProfile.id)
      if (currentUserIdRef.current !== requestUserId) return
      setActivities(fetchedActivities)
      setActivityGaps(await computeActivityGaps(fetchedActivities))
      if (currentUserIdRef.current !== requestUserId) return
      setEssayReviews(await listEssayReviews(supabase, fetchedProfile.id))
      if (currentUserIdRef.current !== requestUserId) return

      if (fetchedProfile.gpa_cum !== null && fetchedProfile.mcat_total !== null) {
        const slice = profileToSlice(fetchedProfile)
        const [positions, analysis] = await Promise.all([
          Promise.all(CYCLE_YEARS.map(year => computeApplicantPoolPosition(supabase, slice, year))),
          analyzeProfile(supabase, slice, CYCLE_YEARS),
        ])
        if (currentUserIdRef.current !== requestUserId) return
        setPoolPositions(positions)
        setGapAnalysis(analysis)
      } else {
        setPoolPositions(null)
        setGapAnalysis(null)
      }
    } catch (err) {
      if (currentUserIdRef.current !== requestUserId) return
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      if (currentUserIdRef.current === requestUserId) setLoading(false)
    }
  }, [supabase, userId, resetToEmpty])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { profile, activities, activityGaps, poolPositions, gapAnalysis, essayReviews, loading, error, refetch }
}
