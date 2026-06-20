import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useQuestionUnlockProgress } from '../../hooks/useQuestionUnlockProgress'

beforeEach(() => {
  localStorage.clear()
})

describe('useQuestionUnlockProgress', () => {
  it('starts with empty progress map and no completed modules', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    expect(result.current.progressMap).toEqual({})
    expect(result.current.completedModules).toEqual([])
  })

  it('updateProgress stores a status for a question', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.updateProgress('10.46a', 'solved') })
    expect(result.current.progressMap['10.46a']).toBe('solved')
  })

  it('updateProgress overwrites an existing status', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.updateProgress('10.46a', 'tried') })
    act(() => { result.current.updateProgress('10.46a', 'mastered') })
    expect(result.current.progressMap['10.46a']).toBe('mastered')
  })

  it('toggleModule adds a module when not present', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.toggleModule('module0') })
    expect(result.current.completedModules).toContain('module0')
  })

  it('toggleModule removes a module when already present', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.toggleModule('module0') })
    act(() => { result.current.toggleModule('module0') })
    expect(result.current.completedModules).not.toContain('module0')
  })

  it('persists progress map to localStorage', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.updateProgress('10.46b', 'mastered') })
    const stored = JSON.parse(localStorage.getItem('nofear:ch10:question-progress')!)
    expect(stored['10.46b']).toBe('mastered')
  })

  it('persists completed modules to localStorage', () => {
    const { result } = renderHook(() => useQuestionUnlockProgress())
    act(() => { result.current.toggleModule('module1') })
    const stored = JSON.parse(localStorage.getItem('nofear:ch10:completed-modules')!)
    expect(stored).toContain('module1')
  })

  it('loads persisted progress map on mount', () => {
    localStorage.setItem(
      'nofear:ch10:question-progress',
      JSON.stringify({ '10.46a': 'tried' })
    )
    const { result } = renderHook(() => useQuestionUnlockProgress())
    expect(result.current.progressMap['10.46a']).toBe('tried')
  })

  it('loads persisted completed modules on mount', () => {
    localStorage.setItem(
      'nofear:ch10:completed-modules',
      JSON.stringify(['module0', 'module1'])
    )
    const { result } = renderHook(() => useQuestionUnlockProgress())
    expect(result.current.completedModules).toEqual(['module0', 'module1'])
  })
})
