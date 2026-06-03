import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardShell } from '../components/layout/DashboardShell'
import { QuestionImageCard } from '../components/questions/QuestionImageCard'
import { useAuth } from '../hooks/useAuth'
import { useImageReview } from '../hooks/useImageReview'
import type { ExamQuestion } from '../types/database'

function ReviewCard({
  question,
  allTopics,
  onApprove,
}: {
  question: ExamQuestion
  allTopics: string[]
  onApprove: (id: string, topic: string) => Promise<string | null>
}) {
  const [topic, setTopic] = useState(question.question_type ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleApprove = async () => {
    if (!topic.trim()) return
    setSaving(true)
    const error = await onApprove(question.id, topic.trim())
    setSaving(false)
    if (error) setErr(error)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-gray-400">{question.q_id}</span>
        {question.ai_tagged && (
          <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">
            AI suggested
          </span>
        )}
        {!question.ai_tagged && (
          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
            needs review
          </span>
        )}
      </div>

      {question.image_url && (
        <QuestionImageCard imagePath={question.image_url} className="max-h-64 object-contain" />
      )}

      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">Topic label</label>
        <div className="flex gap-2">
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a topic...</option>
            {allTopics.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="or type a new label"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {question.answer_key && (
          <p className="text-xs text-gray-500">Answer key: <strong>{question.answer_key}</strong></p>
        )}
      </div>

      {err && <p className="text-xs text-red-600">{err}</p>}

      <button
        onClick={handleApprove}
        disabled={!topic.trim() || saving}
        className="bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? 'Approving...' : 'Approve'}
      </button>
    </div>
  )
}

export function ReviewImagesPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const { session } = useAuth()
  const studentId = session?.user.id

  const { flagged, allTopics, loading, error, approveQuestion } = useImageReview(courseId, studentId)

  return (
    <DashboardShell>
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-sm text-indigo-600 hover:underline">
          Back to course
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Review Image Questions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Confirm the topic label for each flagged question, then approve.
        </p>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && flagged.length === 0 && (
        <div className="text-center py-20 text-gray-500 text-sm">
          No flagged questions. All image questions are verified.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {flagged.map(q => (
          <ReviewCard
            key={q.id}
            question={q}
            allTopics={allTopics}
            onApprove={approveQuestion}
          />
        ))}
      </div>
    </DashboardShell>
  )
}
