import { useMemo, useState, type ReactNode } from 'react'
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
  /** The logged-in user's auth.uid(), or null when logged out. Real-mode content only ever renders when this is non-null. */
  userId: string | null
  /** Rendered alongside demo mode when userId is null — the logged-out signup/login UI. Owned by PremedPage, not this component (keeps premed/src/ui/ free of any src/ auth imports). */
  loggedOutSlot?: ReactNode
}

export function PremedDashboard({ supabase, userId, loggedOutSlot }: Props) {
  const [mode, setMode] = useState<Mode>('demo')
  const [archetypeKey, setArchetypeKey] = useState(DEMO_ARCHETYPES[0]?.key ?? '')

  const real = useRealProfileData(supabase, userId)
  const demoFixture = useMemo(() => DEMO_ARCHETYPES.find(a => a.key === archetypeKey) ?? null, [archetypeKey])

  // Forces demo when logged out, regardless of whatever `mode` was left at
  // before a sign-out — without this, stale mode:'real' state would survive
  // the "Real profile" toggle being hidden and drive rendering against a
  // null userId.
  const effectiveMode: Mode = userId !== null ? mode : 'demo'
  const isReal = userId !== null && effectiveMode === 'real'

  const active =
    effectiveMode === 'demo'
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
            className={`px-3 py-1.5 text-sm font-medium ${effectiveMode === 'demo' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Demo
          </button>
          {userId !== null && (
            <button
              onClick={() => setMode('real')}
              className={`px-3 py-1.5 text-sm font-medium border-l border-gray-300 ${effectiveMode === 'real' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Real profile
            </button>
          )}
        </div>

        {effectiveMode === 'demo' && (
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

        {effectiveMode === 'demo' && <p className="text-xs text-gray-400 ml-auto">Read-only — seeded archetype data</p>}
      </div>

      {/* Renders independently of effectiveMode — forcing demo mode when logged out must not hide this, since it's the only way a logged-out visitor gets back to real mode. */}
      {userId === null && loggedOutSlot}

      {userId !== null && isReal && (
        <ProfileIntakePanel supabase={supabase} userId={userId} profile={real.profile} activities={real.activities} onChange={real.refetch} />
      )}

      {isReal && real.loading && <p className="text-sm text-gray-400">Loading...</p>}
      {isReal && real.error && <p className="text-sm text-red-600">{real.error}</p>}

      {!hasReadOut && isReal && !real.loading && (
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
      {isReal && !real.loading && real.profile && (
        <EssayReviewSection reviews={real.essayReviews} supabase={supabase} onReviewSaved={real.refetch} />
      )}
    </div>
  )
}
