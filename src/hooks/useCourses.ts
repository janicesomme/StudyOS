import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Course } from '../types/database'

interface CreateCourseInput {
  name: string
  subject: string
  institution?: string
  semester?: string
  exam_date?: string
}

interface UseCoursesReturn {
  courses: Course[]
  loading: boolean
  createCourse: (input: CreateCourseInput) => Promise<{ error: Error | null }>
}

export function useCourses(studentId: string | undefined): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) { setLoading(false); return }

    supabase
      .from('courses')
      .select('*')
      .eq('student_id', studentId)
      .then(({ data, error }) => {
        if (!error && data) setCourses(data)
        setLoading(false)
      })
  }, [studentId])

  const createCourse = async (input: CreateCourseInput) => {
    if (!studentId) return { error: new Error('No student ID') }

    const { error } = await supabase
      .from('courses')
      .insert({ ...input, student_id: studentId })

    if (!error) {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('student_id', studentId)
      if (data) setCourses(data)
    }

    return { error: error as Error | null }
  }

  return { courses, loading, createCourse }
}
