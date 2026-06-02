import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ClaudeQuestion } from '../lib/customQuestions'
import type { ExamQuestion, ExamQuestionInsert } from '../types/database'

interface Options {
  sourceExamId?: string
  examNumber?: number
}

export function useExamQuestions(
  courseId: string | undefined,
  studentId: string | undefined,
  options: Options = {}
) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId || !studentId) return
    setLoading(true)

    let query = supabase
      .from('exam_questions')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', studentId)

    if (options.sourceExamId) {
      query = query.eq('source_exam_id', options.sourceExamId).order('question_order', { ascending: true })
    } else if (options.examNumber) {
      query = query.eq('exam_number', options.examNumber).order('created_at', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: true })
    }

    query.then(({ data, error: err }) => {
      setLoading(false)
      if (err) setError(err.message)
      else setQuestions((data as ExamQuestion[]) ?? [])
    })
  }, [courseId, studentId, options.sourceExamId, options.examNumber])

  async function insertQuestions(
    raw: ClaudeQuestion[]
  ): Promise<{ count: number; error: string | null }> {
    if (!courseId || !studentId) return { count: 0, error: 'Missing course or student ID' }
    const rows: ExamQuestionInsert[] = raw.map((q) => ({
      student_id: studentId,
      course_id: courseId,
      q_id: q.q_id,
      source_doc: q.source_doc,
      source_page: q.source_page,
      question_type: q.question_type,
      pack: q.pack,
      pattern: q.pattern,
      difficulty: q.difficulty,
      suitable_use: q.suitable_use,
      janice_shortcut: q.janice_shortcut,
      student_visible_trigger: q.student_visible_trigger,
      what_student_does: q.what_student_does,
      struggle_point: q.struggle_point,
      why_easy_in_system: q.why_easy_in_system,
      pre_lesson_needed: q.pre_lesson_needed,
      topics: q.topics,
      reagents_involved: q.reagents_involved,
      vocab_needed: q.vocab_needed,
      related_knowledge_unit_ids: [],
      verified: false,
    }))
    // @ts-expect-error supabase-js v2 insert types incompatible with TypeScript 6
    const { error: err } = await supabase.from('exam_questions').insert(rows)
    if (err) return { count: 0, error: err.message }
    const { data } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })
    setQuestions((data as ExamQuestion[]) ?? [])
    return { count: rows.length, error: null }
  }

  return { questions, loading, error, insertQuestions }
}
