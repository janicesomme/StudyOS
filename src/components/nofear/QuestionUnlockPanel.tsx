import { CH10_QUESTIONS } from '../../data/ch10-question-map'
import { CH10_MODULES, UNLOCK_LABELS } from '../../types/nofear'
import type { UnlockStatus, ProgressStatus } from '../../types/nofear'
import { useQuestionUnlockProgress } from '../../hooks/useQuestionUnlockProgress'
import { QuestionUnlockCard } from './QuestionUnlockCard'

function getActiveUnlock(
  q: typeof CH10_QUESTIONS[number],
  completedModules: string[]
): UnlockStatus {
  let status: UnlockStatus = 'not_yet'
  for (const mod of CH10_MODULES) {
    if (completedModules.includes(mod.id)) {
      status = q[mod.unlockField]
    }
  }
  return status
}

const ATTEMPTED_STATUSES: ProgressStatus[] = [
  'tried',
  'got_first_move',
  'solved',
  'needs_review',
  'mastered',
]

export function QuestionUnlockPanel() {
  const { progressMap, completedModules, updateProgress, toggleModule } =
    useQuestionUnlockProgress()

  const questions = CH10_QUESTIONS.map(q => ({
    ...q,
    unlockStatus: getActiveUnlock(q, completedModules),
    progressStatus: (progressMap[q.questionId] ?? 'not_started') as ProgressStatus,
  }))

  const complete = questions.filter(q => q.unlockStatus === 'complete')
  const partial = questions.filter(q => q.unlockStatus === 'partial')
  const notYet = questions.filter(q => q.unlockStatus === 'not_yet')
  const attempted = questions.filter(q => ATTEMPTED_STATUSES.includes(q.progressStatus))
  const mastered = questions.filter(q => q.progressStatus === 'mastered')

  const groups: Array<{
    status: UnlockStatus
    items: typeof questions
    headingColor: string
    borderColor: string
  }> = [
    { status: 'complete', items: complete, headingColor: 'text-green-800', borderColor: 'border-green-200' },
    { status: 'partial', items: partial, headingColor: 'text-yellow-800', borderColor: 'border-yellow-200' },
    { status: 'not_yet', items: notYet, headingColor: 'text-gray-600', borderColor: 'border-gray-200' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Question Unlocks</h2>
        <p className="text-sm text-gray-500 mt-1">
          After each No-Fear module, the app unlocks the exact textbook questions you are now ready to attempt.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Modules I have completed</p>
        <div className="space-y-2">
          {CH10_MODULES.map(mod => (
            <label key={mod.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={completedModules.includes(mod.id)}
                onChange={() => toggleModule(mod.id)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700">{mod.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Fully unlocked', count: complete.length, color: 'text-green-700' },
          { label: 'First move only', count: partial.length, color: 'text-yellow-700' },
          { label: 'Not yet', count: notYet.length, color: 'text-gray-500' },
          { label: 'Attempted', count: attempted.length, color: 'text-indigo-700' },
          { label: 'Mastered', count: mastered.length, color: 'text-purple-700' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {groups.map(({ status, items, headingColor, borderColor }) => (
        <section key={status}>
          <h3 className={`text-base font-semibold mb-3 ${headingColor}`}>
            {UNLOCK_LABELS[status]}{' '}
            <span className="font-normal text-sm">({items.length})</span>
          </h3>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 italic">None at this unlock level yet.</p>
          ) : (
            <div className={`space-y-3 border-l-4 ${borderColor} pl-4`}>
              {items.map(q => (
                <QuestionUnlockCard
                  key={q.questionId}
                  question={q}
                  unlockStatus={q.unlockStatus}
                  progressStatus={q.progressStatus}
                  onProgressChange={newStatus => updateProgress(q.questionId, newStatus)}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
