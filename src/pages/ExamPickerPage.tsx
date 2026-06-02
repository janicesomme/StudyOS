import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../components/layout/DashboardShell'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { SourceExam } from '../types/database'

export function ExamPickerPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const { session } = useAuth()
  const studentId = session?.user.id
  const navigate = useNavigate()

  const [exams, setExams] = useState<SourceExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'topic' | 'exam'>('topic')

  const [selectedExamNumber, setSelectedExamNumber] = useState<number | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [availableTopics, setAvailableTopics] = useState<string[]>([])

  useEffect(() => {
    if (!courseId || !studentId) return
    Promise.all([
      supabase
        .from('source_exams')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .order('year')
        .order('exam_number'),
      supabase
        .from('exam_questions')
        .select('question_type')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .not('source_exam_id', 'is', null),
    ]).then(([examRes, topicRes]) => {
      setLoading(false)
      if (examRes.error) { setError(examRes.error.message); return }
      setExams((examRes.data ?? []) as SourceExam[])
      if (!topicRes.error && topicRes.data) {
        const topics = [
          ...new Set(
            (topicRes.data as { question_type: string }[]).map(r => r.question_type)
          ),
        ].sort()
        setAvailableTopics(topics)
      }
    })
  }, [courseId, studentId])

  const examNumbers = [...new Set(exams.map(e => e.exam_number))].sort((a, b) => a - b)

  const handleTopicDrill = () => {
    if (!selectedExamNumber || !selectedTopic) return
    navigate(`/courses/${courseId}/drill?exam_number=${selectedExamNumber}&topics=${selectedTopic}`)
  }

  const handleFullExamDrill = (examId: string) => {
    navigate(`/courses/${courseId}/drill?source_exam_id=${examId}`)
  }

  if (loading) return <DashboardShell><p className="text-sm text-gray-400">Loading...</p></DashboardShell>
  if (error) return <DashboardShell><p className="text-sm text-red-600">{error}</p></DashboardShell>

  if (exams.length === 0) {
    return (
      <DashboardShell>
        <div className="text-center py-24">
          <p className="text-gray-500 mb-4">No past exams loaded yet. Run the exam pair ingest script first.</p>
          <Link to={`/courses/${courseId}`} className="text-indigo-600 hover:underline text-sm">
            Back to course
          </Link>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <Link to={`/courses/${courseId}`} className="text-sm text-indigo-600 hover:underline">
          Back to course
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Drill</h1>
        <div className="w-24" />
      </div>

      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {(['topic', 'exam'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'topic' ? 'Topic worksheet' : 'Full exam'}
            </button>
          ))}
        </div>

        {mode === 'topic' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Drill questions from a single exam focused on one topic. Builds pattern recognition before testing under pressure.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Exam</label>
              <div className="flex gap-2 flex-wrap">
                {examNumbers.map(n => (
                  <button
                    key={n}
                    onClick={() => setSelectedExamNumber(n)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      selectedExamNumber === n
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Exam {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Topic</label>
              <select
                value={selectedTopic}
                onChange={e => setSelectedTopic(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Pick a topic...</option>
                {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button
              onClick={handleTopicDrill}
              disabled={!selectedExamNumber || !selectedTopic}
              className="w-full bg-indigo-600 text-white text-sm font-medium py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start worksheet
            </button>
          </div>
        )}

        {mode === 'exam' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Drill a complete past exam in original order. Builds the meta-skill of recognising which move a mixed question needs.
            </p>
            {exams.map(exam => (
              <button
                key={exam.id}
                onClick={() => handleFullExamDrill(exam.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {exam.course_code} {exam.year} &#8212; Exam {exam.exam_number}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{exam.question_count ?? '?'} questions</p>
                </div>
                <span className="text-gray-400">&#8594;</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
