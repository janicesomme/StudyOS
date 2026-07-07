import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EssayReview } from '../../lib/committee-simulator.js'
import { getRubricCalibrationStats, type DimensionCalibrationStats } from '../../lib/rubric-calibration.js'
import { RED_FLAGS } from '../../lib/rubrics.js'
import type { PmEssayReview } from '../../lib/schemas.js'

type Props = {
  reviews: PmEssayReview[]
  supabase: SupabaseClient
  onReviewSaved: () => Promise<void> | void
}

function formatDimension(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function ScoreBar({ score, dimension, calibration }: { score: number; dimension: string; calibration?: DimensionCalibrationStats }) {
  const color = score >= 4 ? 'bg-green-500' : score === 3 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      {calibration && (
        <div
          data-testid={`calibration-band-${dimension}`}
          className="absolute h-full bg-indigo-100"
          style={{ left: `${(calibration.min / 5) * 100}%`, width: `${((calibration.max - calibration.min) / 5) * 100}%` }}
        />
      )}
      {calibration && <div className="absolute h-full w-px bg-indigo-300" style={{ left: `${(calibration.median / 5) * 100}%` }} />}
      <div className={`relative h-full ${color}`} style={{ width: `${(score / 5) * 100}%` }} />
    </div>
  )
}

/** Same error-unwrapping pattern as useChapterTranslator.ts — surfaces the actual edge function error body, not just a generic FunctionsHttpError message. */
async function unwrapInvokeError(error: unknown): Promise<string> {
  const detail = (error as { context?: { text?: () => Promise<string> } }).context?.text
    ? await (error as { context: { text: () => Promise<string> } }).context.text()
    : null
  if (!detail) {
    const message = (error as { message?: unknown })?.message
    return typeof message === 'string' ? message : String(error)
  }
  try {
    const parsed = JSON.parse(detail) as { error?: string }
    return parsed.error ?? detail
  } catch {
    return detail
  }
}

export function EssayReviewSection({ reviews, supabase, onReviewSaved }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(reviews[0]?.id ?? null)
  const [essay, setEssay] = useState('')
  const [school, setSchool] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calibration, setCalibration] = useState<Record<string, DimensionCalibrationStats> | null>(null)

  const selected = reviews.find(r => r.id === selectedId) ?? reviews[0] ?? null
  const review = selected ? (selected.review as unknown as EssayReview) : null

  // pm_rubric_calibration is global reference data (read-open, same tier as
  // pm_schools) — independent of the logged-in profile, so this fetches it
  // directly rather than threading it through useRealProfileData, which is
  // deliberately scoped to per-user RLS-gated state.
  useEffect(() => {
    let cancelled = false
    getRubricCalibrationStats(supabase)
      .then(stats => {
        if (!cancelled) setCalibration(stats)
      })
      .catch(err => {
        // RLS misconfigured, table not yet migrated, network failure — distinct
        // from "calibration hasn't been run yet" (an empty but successful
        // fetch). Either way the overlay just doesn't render; this is only to
        // keep that distinction visible to a developer debugging it.
        console.error('EssayReviewSection: failed to fetch rubric calibration', err)
      })
    return () => {
      cancelled = true
    }
  }, [supabase])

  const calibrationN = calibration ? Math.max(0, ...Object.values(calibration).map(s => s.n)) : 0

  async function handleSubmit() {
    if (!essay.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('review-essay', {
        body: { essay, school: school.trim() || undefined },
      })
      if (invokeError) {
        setError(await unwrapInvokeError(invokeError))
        return
      }
      setSelectedId(data.essayReview.id)
      await onReviewSaved()
      setEssay('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Committee Simulator</h2>
      <p className="text-xs text-gray-400 mb-4">Critique only — it names problems, it never rewrites your essay for you</p>

      <div className="space-y-2 mb-6">
        <textarea
          value={essay}
          onChange={e => setEssay(e.target.value)}
          placeholder="Paste your personal statement draft here..."
          rows={8}
          className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          disabled={submitting}
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={school}
            onChange={e => setSchool(e.target.value)}
            placeholder="Target school (optional — scores mission fit)"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            disabled={submitting}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !essay.trim()}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700"
          >
            {submitting ? 'Reviewing…' : 'Get Review'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {reviews.length === 0 && <p className="text-sm text-gray-400">No reviews yet — paste a draft above and click "Get Review".</p>}

      {reviews.length > 0 && (
        <div className="flex gap-4">
          <div className="w-36 flex-shrink-0 space-y-1">
            {reviews.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs ${
                  (selectedId ?? reviews[0].id) === r.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {new Date(r.created_at).toLocaleDateString()}
              </button>
            ))}
          </div>

          {review && (
            <div className="flex-1 space-y-4 min-w-0">
              <p className="text-sm text-gray-800">{review.verdict}</p>

              <div>
                <p className="text-xs font-medium text-gray-800 mb-1">Strengths</p>
                <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
                  {review.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-800 mb-1">Your three moves</p>
                <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
                  {review.priorityFixes.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-3">
                {calibrationN > 0 && <p className="text-xs text-gray-400">Accepted-essay range (n={calibrationN} published essays)</p>}
                {review.dimensionScores.map(d => (
                  <div key={d.dimension}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-medium text-gray-800">{formatDimension(d.dimension)}</span>
                      <span className="text-gray-500">{d.score}/5</span>
                    </div>
                    <ScoreBar score={d.score} dimension={d.dimension} calibration={calibration?.[d.dimension]} />
                    {d.evidenceQuotes.map((q, i) => (
                      <p key={i} className="text-xs text-gray-400 italic mt-1">
                        "{q}"
                      </p>
                    ))}
                    {d.challengeQuestion && <p className="text-xs text-amber-700 mt-1">Challenge: {d.challengeQuestion}</p>}
                  </div>
                ))}
              </div>

              {(review.consistencyFlags.length > 0 || (review.redFlags && review.redFlags.length > 0)) && (
                <div className="space-y-3 border-t border-gray-100 pt-3">
                  {review.consistencyFlags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-700 mb-1">Consistency flags</p>
                      <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5">
                        {review.consistencyFlags.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.redFlags && review.redFlags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-700 mb-1">Red flags</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {review.redFlags.map((f, i) => (
                          <li key={i}>
                            <span className="font-medium">{RED_FLAGS[f.key].name}:</span> {f.note}
                            {f.evidenceQuote && <span className="italic text-red-500"> — "{f.evidenceQuote}"</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
