import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useSourceMaterials } from '../../hooks/useSourceMaterials'

const {
  mockUpload,
  mockInvoke,
  mockOrder,
  mockEqSelect,
  mockSelectChain,
  mockInsertChain,
} = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockInvoke: vi.fn(),
  mockOrder: vi.fn(),
  mockEqSelect: vi.fn(),
  mockSelectChain: vi.fn(),
  mockInsertChain: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'source_materials') {
        return {
          select: mockSelectChain,
          insert: mockInsertChain,
          update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        }
      }
      return { select: mockSelectChain }
    }),
    storage: {
      from: vi.fn(() => ({ upload: mockUpload })),
    },
    functions: {
      invoke: mockInvoke,
    },
  },
}))

describe('useSourceMaterials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrder.mockResolvedValue({ data: [], error: null })
    mockEqSelect.mockReturnValue({ order: mockOrder })
    mockSelectChain.mockReturnValue({ eq: mockEqSelect })
    mockInvoke.mockResolvedValue({ error: null })
  })

  it('starts with empty materials and loading true', () => {
    const { result } = renderHook(() => useSourceMaterials('course-1', 'student-1'))
    expect(result.current.materials).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('loads materials for the course on mount', async () => {
    const mockMaterials = [{
      id: 'mat-1',
      student_id: 'student-1',
      course_id: 'course-1',
      title: 'Lecture Notes',
      file_type: 'txt',
      file_url: 'student-1/course-1/notes.txt',
      processing_status: 'complete',
      extraction_confidence: 0.9,
      needs_review: false,
      error_message: null,
      created_at: '2026-05-08T00:00:00Z',
    }]
    mockOrder.mockResolvedValueOnce({ data: mockMaterials, error: null })

    const { result } = renderHook(() => useSourceMaterials('course-1', 'student-1'))
    await act(async () => {})

    expect(result.current.materials).toEqual(mockMaterials)
    expect(result.current.loading).toBe(false)
  })

  it('rejects unsupported file types without calling upload', async () => {
    const { result } = renderHook(() => useSourceMaterials('course-1', 'student-1'))
    await act(async () => {})

    const file = new File(['content'], 'notes.docx', { type: 'application/msword' })
    let outcome: { error: Error | null } = { error: null }
    await act(async () => {
      outcome = await result.current.uploadAndProcess({ file, courseId: 'course-1', studentId: 'student-1' })
    })

    expect(outcome.error).not.toBeNull()
    expect(outcome.error?.message).toMatch(/unsupported/i)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('returns error when storage upload fails', async () => {
    mockUpload.mockResolvedValueOnce({ error: new Error('Storage full') })

    const { result } = renderHook(() => useSourceMaterials('course-1', 'student-1'))
    await act(async () => {})

    const file = new File(['content'], 'notes.txt', { type: 'text/plain' })
    let outcome: { error: Error | null } = { error: null }
    await act(async () => {
      outcome = await result.current.uploadAndProcess({ file, courseId: 'course-1', studentId: 'student-1' })
    })

    expect(outcome.error).not.toBeNull()
    expect(outcome.error?.message).toBe('Storage full')
  })
})
