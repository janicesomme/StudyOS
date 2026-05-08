import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useCourses } from '../../hooks/useCourses'

const mockEq = vi.fn()
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockInsert = vi.fn().mockResolvedValue({ error: null })

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
    })),
  },
}))

describe('useCourses', () => {
  beforeEach(() => {
    mockEq.mockResolvedValue({ data: [], error: null })
  })

  it('starts with empty courses and loading true', () => {
    const { result } = renderHook(() => useCourses('student-123'))
    expect(result.current.courses).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('loads courses for the student on mount', async () => {
    const mockCourses = [{
      id: '1', name: 'Organic Chemistry', subject: 'Chemistry',
      student_id: 'student-123', institution: null, semester: null,
      exam_date: null, created_at: '2026-05-08'
    }]
    mockEq.mockResolvedValueOnce({ data: mockCourses, error: null })

    const { result } = renderHook(() => useCourses('student-123'))
    await act(async () => {})

    expect(result.current.courses).toEqual(mockCourses)
    expect(result.current.loading).toBe(false)
  })
})
