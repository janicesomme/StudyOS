import { useState, useEffect } from 'react'
import type { EasProblem, EasSolutionStep } from '../types/database'
import { getProblems, getProblemWithSteps } from '../lib/eas'

export function EasPracticePage() {
  const [problems, setProblems] = useState<EasProblem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [steps, setSteps] = useState<EasSolutionStep[]>([])
  const [stepsLoading, setStepsLoading] = useState(false)

  useEffect(() => {
    getProblems()
      .then(setProblems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSelect(id: string) {
    if (selected === id) {
      setSelected(null)
      setSteps([])
      return
    }
    setSelected(id)
    setSteps([])
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

  const bySource = problems.reduce<Record<string, EasProblem[]>>((acc, p) => {
    ;(acc[p.source] ??= []).push(p)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">EAS Practice</h1>
        <p className="text-sm text-gray-500 mb-8">{problems.length} problems across 3 textbooks — click any to see the step ladder</p>

        {Object.entries(bySource).map(([source, probs]) => (
          <section key={source} className="mb-10">
            <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
              {source}
            </h2>
            <div className="space-y-2">
              {probs.map(p => (
                <div key={p.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => handleSelect(p.id)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs font-mono text-gray-400 pt-0.5 shrink-0 w-12">
                      {p.problem_number}
                    </span>
                    <span className="text-sm text-gray-700 leading-snug">
                      {p.question_text_raw.replace(/\n/g, ' ').slice(0, 120)}
                      {p.question_text_raw.length > 120 ? '...' : ''}
                    </span>
                    <span className="ml-auto shrink-0 text-gray-300 text-xs pt-0.5">
                      {selected === p.id ? 'v' : '>'}
                    </span>
                  </button>

                  {selected === p.id && (
                    <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
                      {p.question_analysis && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-md">
                          <p className="text-xs font-semibold text-blue-700 mb-1">Skill tested</p>
                          <p className="text-sm text-blue-900">{p.question_analysis.skill_tested}</p>
                          <p className="text-xs font-semibold text-blue-700 mt-2 mb-1">Recognition cue</p>
                          <p className="text-xs text-blue-800">{p.question_analysis.recognition_cue}</p>
                        </div>
                      )}

                      {stepsLoading ? (
                        <p className="text-xs text-gray-400">Loading steps...</p>
                      ) : (
                        <ol className="space-y-3">
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
