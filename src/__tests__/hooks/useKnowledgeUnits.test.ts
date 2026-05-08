import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useKnowledgeUnits } from '../../hooks/useKnowledgeUnits'

const mockEq = vi.fn()
const mockSelect = vi.fn(() => ({ eq: mockEq }))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ select: mockSelect })),
  },
}))

describe('useKnowledgeUnits', () => {
  beforeEach(() => {
    mockEq.mockResolvedValue({ data: [], error: null })
  })

  it('starts with empty units and loading true', () => {
    const { result } = renderHook(() => useKnowledgeUnits('mat-1'))
    expect(result.current.units).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('loads knowledge units for the source material', async () => {
    const mockUnits = [{
      id: 'ku-1',
      student_id: 'student-1',
      course_id: 'course-1',
      source_material_id: 'mat-1',
      concept_name: 'SN2 Reaction',
      plain_english_explanation: 'A substitution where the nucleophile attacks as the leaving group departs.',
      topic: 'Reactions',
      subtopic: 'Substitution',
      difficulty_level: 3,
      prerequisite_concept_ids: [],
      common_misconceptions: ['Confusing SN1 and SN2 conditions'],
      testability_score: 5,
      extraction_confidence: 0.95,
      source_location: 'p. 12',
      created_by_agent: 'archivist',
      reviewed: false,
      created_at: '2026-05-08T00:00:00Z',
    }]
    mockEq.mockResolvedValueOnce({ data: mockUnits, error: null })

    const { result } = renderHook(() => useKnowledgeUnits('mat-1'))
    await act(async () => {})

    expect(result.current.units).toEqual(mockUnits)
    expect(result.current.loading).toBe(false)
  })

  it('does nothing when sourceMaterialId is undefined', async () => {
    const { result } = renderHook(() => useKnowledgeUnits(undefined))
    await act(async () => {})
    expect(result.current.units).toEqual([])
    expect(result.current.loading).toBe(false)
  })
})
