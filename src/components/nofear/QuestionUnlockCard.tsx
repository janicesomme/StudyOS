import { useState } from 'react'
import type { Ch10Question, ProgressStatus, UnlockStatus } from '../../types/nofear'
import { PROGRESS_LABELS, UNLOCK_LABELS } from '../../types/nofear'
import { getFirstHint } from '../../data/nofear-hints'

const UNLOCK_BADGE: Record<UnlockStatus, string> = {
  complete: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  not_yet: 'bg-gray-100 text-gray-500',
}

const PROGRESS_OPTIONS: ProgressStatus[] = [
  'not_started',
  'tried',
  'got_first_move',
  'solved',
  'needs_review',
  'mastered',
]


interface Props {
  question: Ch10Question
  unlockStatus: UnlockStatus
  progressStatus: ProgressStatus
  onProgressChange: (status: ProgressStatus) => void
}

export function QuestionUnlockCard({
  question,
  unlockStatus,
  progressStatus,
  onProgressChange,
}: Props) {
  const [showHint, setShowHint] = useState(false)
  const [showScaffold, setShowScaffold] = useState(false)

  const moves = question.requiredMoves
    .split(';')
    .map((m) => m.trim())
    .filter(Boolean)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      {/* Always visible: ID, type badge, unlock status */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-gray-900">{question.questionId}</span>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
            {question.questionType}
          </span>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${UNLOCK_BADGE[unlockStatus]}`}
        >
          {UNLOCK_LABELS[unlockStatus]}
        </span>
      </div>

      {/* Textbook reminder — shown when question is at least partially unlocked */}
      {unlockStatus !== 'not_yet' && (
        <p className="text-xs text-indigo-600 italic">
          Open your Smith/Gorzynski textbook to this question. You are ready to try it now.
        </p>
      )}

      {/* Optional accuracy risk metadata */}
      {question.accuracyRisk && (
        <p className="text-xs text-gray-500">
          Accuracy risk: <span className="text-gray-700">{question.accuracyRisk}</span>
        </p>
      )}

      {/* Progressive reveal — hint then scaffold */}
      {!showScaffold && (
        <div className="flex flex-wrap gap-2">
          {!showHint && (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-xs border border-gray-200 text-gray-600 rounded px-3 py-1 hover:bg-gray-50"
            >
              Show first hint
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowScaffold(true)}
            className="text-xs border border-gray-200 text-gray-600 rounded px-3 py-1 hover:bg-gray-50"
          >
            Reveal scaffold
          </button>
        </div>
      )}

      {showHint && !showScaffold && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          {getFirstHint(question.questionType)}
        </p>
      )}

      {showScaffold && (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Knowledge needed
            </p>
            <p className="text-sm text-gray-700">{question.knowledgeNeeded}</p>
          </div>

          {moves.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Required moves
              </p>
              <ol className="space-y-0.5">
                {moves.map((move, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-gray-400 shrink-0">{i + 1}.</span>
                    <span>{move}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Progress controls */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <label
          htmlFor={`progress-${question.questionId}`}
          className="text-xs text-gray-500 shrink-0"
        >
          My progress:
        </label>
        <select
          id={`progress-${question.questionId}`}
          value={progressStatus}
          onChange={(e) => onProgressChange(e.target.value as ProgressStatus)}
          className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 bg-white"
        >
          {PROGRESS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {PROGRESS_LABELS[opt]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
