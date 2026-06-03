import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ExamQuestion } from '../types/database'

export function useImageReview(courseId: string | undefined, studentId: string | undefined) {
  const [flagged, setFlagged] = useState<ExamQuestion[]>([])
  const [allTopics, setAllTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchFlagged() {
    if (!courseId || !studentId) return
    setLoading(true)
    const [flaggedRes, topicsRes] = await Promise.all([
      supabase
        .from('exam_questions')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .eq('verified', false)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: true }),
      supabase
        .from('exam_questions')
        .select('question_type')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .not('image_url', 'is', null),
    ])
    setLoading(false)
    if (flaggedRes.error) { setError(flaggedRes.error.message); return }
    setFlagged((flaggedRes.data as ExamQuestion[]) ?? [])
    const topics = [...new Set(
      ((topicsRes.data ?? []) as { question_type: string }[])
        .map(r => r.question_type)
        .filter(Boolean)
    )].sort()
    setAllTopics(topics)
  }

  useEffect(() => { fetchFlagged() }, [courseId, studentId])

  async function approveQuestion(id: string, topic: string): Promise<string | null> {
    // Cast to any: supabase-js v2 update types incompatible with TypeScript 6
    const { error: err } = await (supabase.from('exam_questions') as any)
      .update({ question_type: topic, verified: true, ai_tagged: false })
      .eq('id', id)
    if (err) return err.message
    setFlagged(prev => prev.filter(q => q.id !== id))
    return null
  }

  return { flagged, allTopics, loading, error, approveQuestion }
}
