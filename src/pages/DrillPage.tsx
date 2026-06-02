import { useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { DashboardShell } from '../components/layout/DashboardShell'
import { QuestionImageCard } from '../components/questions/QuestionImageCard'
import { useAuth } from '../hooks/useAuth'
import { useExamQuestions } from '../hooks/useExamQuestions'
import type { ExamQuestion } from '../types/database'

type Tier = 'question' | 'hint' | 'answer'

export function DrillPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { session } = useAuth()
  const studentId = session?.user.id

  const sourceExamId = searchParams.get('source_exam_id') ?? undefined
  const examNumberParam = searchParams.get('exam_number')
  const examNumber = examNumberParam ? parseInt(examNumberParam) : undefined
  const topicFilter = searchParams.get('topics')
  const topicSet = topicFilter
    ? new Set(topicFilter.split(',').map(t => t.trim().toUpperCase()))
    : null

  const { questions: allQuestions, loading, error } = useExamQuestions(courseId, studentId, {
    sourceExamId,
    examNumber,
  })

  const questions: ExamQuestion[] = topicSet
    ? allQuestions.filter(q => topicSet.has(q.question_type.toUpperCase()))
    : allQuestions

  const [index, setIndex] = useState(0)
  const [tier, setTier] = useState<Tier>('question')
  const [done, setDone] = useState(false)

  if (loading) return <DashboardShell><p className="text-sm text-gray-400">Loading...</p></DashboardShell>
  if (error) return <DashboardShell><p className="text-sm text-red-600">{error}</p></DashboardShell>

  if (questions.length === 0) {
    return (
      <DashboardShell>
        <div className="text-center py-24">
          <p className="text-gray-500 mb-4">No questions found for this selection.</p>
          <Link to={`/courses/${courseId}/exam-picker`} className="text-indigo-600 hover:underline text-sm">
            Back to picker
          </Link>
        </div>
      </DashboardShell>
    )
  }

  if (done) {
    return (
      <DashboardShell>
        <div className="text-center py-24">
          <p className="text-xl font-semibold text-gray-900 mb-2">Session complete</p>
          <p className="text-gray-500 text-sm mb-6">{questions.length} questions reviewed.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setIndex(0); setTier('question'); setDone(false) }}
              className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Drill again
            </button>
            <Link
              to={`/courses/${courseId}`}
              className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Back to course
            </Link>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const q = questions[index]
  const isLast = index === questions.length - 1
  const isImageQuestion = Boolean(q.image_url)
  const hasHint = Boolean(q.hint)

  const handleNext = () => {
    if (isLast) { setDone(true); return }
    setIndex(i => i + 1)
    setTier('question')
  }

  const advanceTier = () => {
    if (tier === 'question') {
      setTier(hasHint ? 'hint' : 'answer')
    } else if (tier === 'hint') {
      setTier('answer')
    }
  }

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <Link to={`/courses/${courseId}/exam-picker`} className="text-sm text-indigo-600 hover:underline">
          Back to picker
        </Link>
        <p className="text-sm text-gray-400">{index + 1} / {questions.length}</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2 mb-4 flex-wrap">
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">
            {q.difficulty}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {q.question_type}
          </span>
          {q.exam_number != null && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              Exam {q.exam_number}
            </span>
          )}
          {q.point_value != null && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {q.point_value} pts
            </span>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-4 min-h-64">
          {tier === 'question' && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Question</p>
              {isImageQuestion && q.image_url ? (
                <QuestionImageCard imagePath={q.image_url} className="w-full" />
              ) : q.raw_text ? (
                <p className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {q.raw_text}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">Question text not available.</p>
              )}
            </div>
          )}

          {tier === 'hint' && (
            <div>
              <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-4">Hint</p>
              <div className="bg-indigo-50 rounded-lg p-5">
                <p className="text-base text-indigo-900 leading-relaxed">{q.hint}</p>
              </div>
            </div>
          )}

          {tier === 'answer' && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Answer</p>
              {q.answer_image_url ? (
                <QuestionImageCard imagePath={q.answer_image_url} className="w-full" />
              ) : q.answer_key ? (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-indigo-900">{q.answer_key}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Answer image not yet attached.</p>
              )}
              {q.janice_shortcut && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Shortcut</p>
                  <p className="text-sm font-medium text-gray-900">{q.janice_shortcut}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          {tier !== 'answer' ? (
            <button
              onClick={advanceTier}
              className="bg-indigo-600 text-white text-sm font-medium px-8 py-2 rounded-lg hover:bg-indigo-700"
            >
              {tier === 'question' ? (hasHint ? 'Show hint' : 'Show answer') : 'Show answer'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-indigo-600 text-white text-sm font-medium px-8 py-2 rounded-lg hover:bg-indigo-700"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
