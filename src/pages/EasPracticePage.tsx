import { useState, useEffect, useMemo } from 'react'
import type { EasProblem, EasSolutionStep } from '../types/database'
import { getProblems, getProblemWithSteps } from '../lib/eas'
import { toHints } from '../lib/eas-adapter'
import { progress } from '../lib/practice-progress'
import type { Attempt } from '../lib/practice-progress'
import { latestPerQuestion, buildReviewIds, statusFor } from '../lib/practice-readiness'
import type { ReadinessStatus } from '../lib/practice-readiness'

const SCORE_OPTIONS = [
  { score: 0 as const, label: 'Blank',     cls: 'text-red-600    bg-red-50    border-red-200    hover:bg-red-100'    },
  { score: 1 as const, label: 'Lost',      cls: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { score: 3 as const, label: 'Partial',   cls: 'text-amber-700  bg-amber-50  border-amber-200  hover:bg-amber-100'  },
  { score: 5 as const, label: 'Nailed it', cls: 'text-green-700  bg-green-50  border-green-200  hover:bg-green-100'  },
]

const SCORE_BADGE: Record<number, { label: string; cls: string }> = {
  0: { label: 'Blank',     cls: 'text-red-600    bg-red-50    border border-red-200'    },
  1: { label: 'Lost',      cls: 'text-orange-600 bg-orange-50 border border-orange-200' },
  3: { label: 'Partial',   cls: 'text-amber-700  bg-amber-50  border border-amber-200'  },
  5: { label: 'Nailed it', cls: 'text-green-700  bg-green-50  border border-green-200'  },
}

function statusChipCls(status: ReadinessStatus): string {
  switch (status) {
    case 'strong':   return 'text-green-700   bg-green-100'
    case 'solid':    return 'text-emerald-700 bg-emerald-100'
    case 'shaky':    return 'text-amber-700   bg-amber-100'
    case 'danger':   return 'text-red-700     bg-red-100'
    case 'untested': return 'text-gray-500    bg-gray-100'
  }
}

function statusLabel(status: ReadinessStatus): string {
  switch (status) {
    case 'strong':   return 'Strong'
    case 'solid':    return 'Solid'
    case 'shaky':    return 'Shaky'
    case 'danger':   return 'Danger'
    case 'untested': return 'Untested'
  }
}

// Same math as computeChapterStat but aggregated over a whole source group.
function computeSourceStat(
  probs: EasProblem[],
  latest: Map<string, Attempt>,
  reviewIds: Set<string>,
) {
  let earned = 0
  let attempted = 0
  for (const p of probs) {
    const a = latest.get(p.id)
    if (!a) continue
    attempted++
    earned += Math.max(
      0,
      a.score / 5 - Math.min(a.hints_used * 0.05, 0.15) - (a.used_solution ? 0.1 : 0),
    )
  }
  const total = probs.length
  const readiness = total === 0 ? 0 : Math.round((earned / total) * 100)
  return {
    total,
    attempted,
    readiness,
    reviewCount: probs.filter(p => reviewIds.has(p.id)).length,
    status: statusFor(readiness, attempted),
  }
}

export function EasPracticePage() {
  const [problems, setProblems]       = useState<EasProblem[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [selected, setSelected]       = useState<string | null>(null)
  const [steps, setSteps]             = useState<EasSolutionStep[]>([])
  const [stepsLoading, setStepsLoading] = useState(false)
  const [tier, setTier]               = useState<1 | 2 | 3>(1)
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [usedSolution, setUsedSolution]   = useState(false)
  const [filter, setFilter]           = useState<'all' | 'review'>('all')
  const [attempts, setAttempts]       = useState<Attempt[]>(() => progress.all())

  const latest    = useMemo(() => latestPerQuestion(attempts), [attempts])
  const reviewIds = useMemo(() => buildReviewIds(attempts),    [attempts])

  const bySource = useMemo(() =>
    problems.reduce<Record<string, EasProblem[]>>((acc, p) => {
      ;(acc[p.source] ??= []).push(p)
      return acc
    }, {}),
    [problems],
  )

  useEffect(() => {
    getProblems()
      .then(setProblems)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const refresh = () => setAttempts(progress.all())
    window.addEventListener('attempts-updated', refresh)
    return () => window.removeEventListener('attempts-updated', refresh)
  }, [])

  function handleSelect(id: string) {
    if (selected === id) { setSelected(null); setSteps([]); return }
    setSelected(id)
    setSteps([])
    setTier(1)
    setHintsRevealed(0)
    setUsedSolution(false)
  }

  async function handleShowSolution(id: string) {
    setUsedSolution(true)
    setTier(3)
    setStepsLoading(true)
    try {
      const { steps: fetched } = await getProblemWithSteps(id)
      setSteps(fetched)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load steps')
    } finally {
      setStepsLoading(false)
    }
  }

  function handleScore(qId: string, score: 0 | 1 | 3 | 5) {
    progress.recordAttempt({ question_id: qId, score, hints_used: hintsRevealed, used_solution: usedSolution })
    setSelected(null)
    setSteps([])
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading problems...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  )

  const isReviewFilter = filter === 'review'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">EAS Practice</h1>
        <p className="text-sm text-gray-500 mb-6">{problems.length} problems across 3 textbooks</p>

        {/* Filter toggle */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('review')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              filter === 'review'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            Flagged for review{reviewIds.size > 0 ? ` (${reviewIds.size})` : ''}
          </button>
        </div>

        {isReviewFilter && reviewIds.size === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">No problems flagged for review yet.</p>
        )}

        {Object.entries(bySource).map(([source, sourceProbs]) => {
          const visible = isReviewFilter ? sourceProbs.filter(p => reviewIds.has(p.id)) : sourceProbs
          if (visible.length === 0) return null
          const stat = computeSourceStat(sourceProbs, latest, reviewIds)

          return (
            <section key={source} className="mb-10">
              {/* Source header + readiness summary */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                  {source}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusChipCls(stat.status)}`}>
                    {statusLabel(stat.status)}
                  </span>
                  {stat.status !== 'untested' && (
                    <span className="text-xs text-gray-500">{stat.readiness}%</span>
                  )}
                  <span className="text-xs text-gray-400">{stat.attempted}/{stat.total}</span>
                </div>
              </div>

              <div className="space-y-2">
                {visible.map(p => {
                  const lastAttempt = latest.get(p.id)
                  const isReview    = reviewIds.has(p.id)
                  const hints       = toHints(p)
                  const isOpen      = selected === p.id
                  const badge       = lastAttempt ? SCORE_BADGE[lastAttempt.score] : null

                  return (
                    <div key={p.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {/* Collapsed row */}
                      <button
                        onClick={() => handleSelect(p.id)}
                        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-xs font-mono text-gray-400 pt-0.5 shrink-0 w-12">
                          {p.problem_number}
                        </span>
                        <span className="text-sm text-gray-700 leading-snug flex-1">
                          {p.question_text_raw.replace(/\n/g, ' ').slice(0, 120)}
                          {p.question_text_raw.length > 120 ? '...' : ''}
                        </span>
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          {isReview && (
                            <span className="text-xs font-medium text-amber-600">review</span>
                          )}
                          {badge && (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badge.cls}`}>
                              {badge.label}
                            </span>
                          )}
                          <span className="text-gray-300 text-xs">{isOpen ? 'v' : '>'}</span>
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isOpen && (
                        <div className="border-t border-gray-100 bg-gray-50">
                          {/* Tier 1 + 2: question text */}
                          <div className="px-4 pt-4 pb-3">
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {p.question_text_raw}
                            </p>
                          </div>

                          {/* Tier 2: revealed hints */}
                          {tier >= 2 && hints.length > 0 && (
                            <div className="px-4 pb-3 space-y-2">
                              {hints.slice(0, hintsRevealed).map(h => (
                                <div
                                  key={h.hint_level}
                                  className={`p-3 rounded-md text-sm ${
                                    h.kind === 'checklist'
                                      ? 'bg-amber-50 border border-amber-200 text-amber-900'
                                      : 'bg-blue-50 border border-blue-200 text-blue-900'
                                  }`}
                                >
                                  <span className="text-xs font-semibold uppercase tracking-wide opacity-60 mr-2">
                                    {h.kind === 'checklist' ? 'Checklist' : `Hint ${h.hint_level}`}
                                  </span>
                                  {h.content}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tier 3: solution steps + debrief */}
                          {tier === 3 && (
                            <div className="px-4 pb-4">
                              {stepsLoading ? (
                                <p className="text-xs text-gray-400 mb-4">Loading steps...</p>
                              ) : (
                                <ol className="space-y-3 mb-4">
                                  {steps.map(s => (
                                    <li key={s.id} className="flex gap-3">
                                      <span className="shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-semibold mt-0.5">
                                        {s.step_order}
                                      </span>
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">{s.do_this}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.why}</p>
                                        {s.vocab && Object.keys(s.vocab).length > 0 && (
                                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {Object.entries(s.vocab).map(([term, def]) => (
                                              <span
                                                key={term}
                                                title={def}
                                                className="text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5 cursor-help"
                                              >
                                                {term}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </ol>
                              )}

                              {/* Debrief: what this was really testing */}
                              {p.question_analysis && (
                                <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                                  <p className="text-xs font-semibold text-blue-700 mb-1">What this was really testing</p>
                                  <p className="text-sm text-blue-900 mb-3">{p.question_analysis.skill_tested}</p>
                                  <p className="text-xs font-semibold text-blue-700 mb-1">How it was disguised</p>
                                  <p className="text-xs text-blue-800 mb-3">{p.question_analysis.disguise}</p>
                                  <p className="text-xs font-semibold text-blue-700 mb-1">The cue you should have caught</p>
                                  <p className="text-xs text-blue-800">{p.question_analysis.recognition_cue}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Controls */}
                          <div className="px-4 py-3 border-t border-gray-100 space-y-3">
                            {/* Progression buttons — hidden once solution is shown */}
                            {tier < 3 && (
                              <div className="flex gap-2">
                                {hints.length > 0 && hintsRevealed < hints.length && (
                                  <button
                                    onClick={() => { setHintsRevealed(n => n + 1); setTier(2) }}
                                    className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:border-gray-400 transition-colors"
                                  >
                                    {hintsRevealed === 0 ? 'Show hint' : 'Next hint'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleShowSolution(p.id)}
                                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:border-gray-400 transition-colors"
                                >
                                  Show solution
                                </button>
                              </div>
                            )}

                            {/* Self-score row — always visible */}
                            <div>
                              <p className="text-xs text-gray-400 mb-2">How did you do?</p>
                              <div className="flex gap-2">
                                {SCORE_OPTIONS.map(({ score, label, cls }) => (
                                  <button
                                    key={score}
                                    onClick={() => handleScore(p.id, score)}
                                    className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-colors ${cls}`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
