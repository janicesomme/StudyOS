import { useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { computeSchoolComparison } from '../lib/school-comparison.js'
import { ApplicantPoolPositionSection } from './sections/ApplicantPoolPositionSection.js'
import { ActivityGapsSection } from './sections/ActivityGapsSection.js'
import { EssayReviewSection } from './sections/EssayReviewSection.js'
import { SchoolComparisonSection } from './sections/SchoolComparisonSection.js'
import { ProfileIntakePanel } from './ProfileIntakePanel.js'
import { useRealProfileData } from './useRealProfileData.js'
import { DEMO_ARCHETYPES } from './data/demo-archetypes.generated.js'
import { SCHOOL_STATS_SNAPSHOT } from './data/school-stats-snapshot.generated.js'

type Mode = 'real' | 'demo'

type Props = {
  supabase: SupabaseClient
  /**
   * "Real profile mode" reads/writes this fixed user_id rather than the
   * actual logged-in session's own id — deliberate for this session (see
   * docs/handoffs/2026-07-03-premed-session-7.md). RLS still applies, so
   * this only works end to end while logged in as the account this id
   * belongs to. Deriving it from the real session is deferred to the
   * auth-wiring session.
   */
  devUserId: string
}

export function PremedDashboard({ supabase, devUserId }: Props) {
  const [mode, setMode] = useState<Mode>('demo')
  const [archetypeKey, setArchetypeKey] = useState(DEMO_ARCHETYPES[0]?.key ?? '')

  const real = useRealProfileData(supabase, devUserId)
  const demoFixture = useMemo(() => DEMO_ARCHETYPES.find(a => a.key === archetypeKey) ?? null, [archetypeKey])

  const active =
    mode === 'demo'
      ? demoFixture
        ? {
            profile: demoFixture.profile,
            activities: demoFixture.activities,
            activityGaps: demoFixture.activityGaps,
            poolPositions: demoFixture.poolPositions,
            gapAnalysis: demoFixture.gapAnalysis,
          }
        : null
      : {
          profile: real.profile,
          activities: real.activities,
          activityGaps: real.activityGaps,
          poolPositions: real.poolPositions,
          gapAnalysis: real.gapAnalysis,
        }

  const schoolComparison = useMemo(() => {
    if (!active?.profile?.gpa_cum || !active.profile.mcat_total) return []
    return computeSchoolComparison(SCHOOL_STATS_SNAPSHOT, { gpa: active.profile.gpa_cum, mcat: active.profile.mcat_total })
  }, [active?.profile?.gpa_cum, active?.profile?.mcat_total])

  // All four pieces load asynchronously and independently (see useRealProfileData) —
  // a profile with valid gpa/mcat can render before poolPositions/gapAnalysis finish
  // loading, so every one of them must be checked before rendering sections that
  // depend on them, not just the profile fields.
  const hasReadOut = Boolean(
    active?.profile?.gpa_cum !== null &&
      active?.profile?.mcat_total !== null &&
      active?.activityGaps &&
      active?.poolPositions &&
      active?.gapAnalysis
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setMode('demo')}
            className={`px-3 py-1.5 text-sm font-medium ${mode === 'demo' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Demo
          </button>
          <button
            onClick={() => setMode('real')}
            className={`px-3 py-1.5 text-sm font-medium border-l border-gray-300 ${mode === 'real' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Real profile
          </button>
        </div>

        {mode === 'demo' && (
          <div className="flex gap-2">
            {DEMO_ARCHETYPES.map(a => (
              <button
                key={a.key}
                onClick={() => setArchetypeKey(a.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                  archetypeKey === a.key ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {a.key}
              </button>
            ))}
          </div>
        )}

        {mode === 'demo' && <p className="text-xs text-gray-400 ml-auto">Read-only — seeded archetype data</p>}
      </div>

      {mode === 'real' && (
        <ProfileIntakePanel supabase={supabase} userId={devUserId} profile={real.profile} activities={real.activities} onChange={real.refetch} />
      )}

      {mode === 'real' && real.loading && <p className="text-sm text-gray-400">Loading...</p>}
      {mode === 'real' && real.error && <p className="text-sm text-red-600">{real.error}</p>}

      {!hasReadOut && mode === 'real' && !real.loading && (
        <p className="text-sm text-gray-400">Fill in GPA and MCAT above to see your read-out.</p>
      )}

      {hasReadOut && active && (
        <>
          <ApplicantPoolPositionSection poolPositions={active.poolPositions!} gapAnalysis={active.gapAnalysis!} />
          <ActivityGapsSection gaps={active.activityGaps!} />
          <SchoolComparisonSection comparison={schoolComparison} />
        </>
      )}

      {/* Real mode only — demo archetypes have no essays (session 8). */}
      {mode === 'real' && !real.loading && real.profile && (
        <EssayReviewSection reviews={real.essayReviews} supabase={supabase} onReviewSaved={real.refetch} />
      )}
    </div>
  )
}
