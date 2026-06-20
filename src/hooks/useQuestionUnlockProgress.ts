import { useState, useCallback, useEffect } from 'react'
import type { ProgressMap, ProgressStatus } from '../types/nofear'

const PROGRESS_KEY = 'nofear:ch10:question-progress'
const MODULES_KEY = 'nofear:ch10:completed-modules'

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function useQuestionUnlockProgress() {
  const [progressMap, setProgressMap] = useState<ProgressMap>(() =>
    readStorage<ProgressMap>(PROGRESS_KEY, {})
  )
  const [completedModules, setCompletedModules] = useState<string[]>(() =>
    readStorage<string[]>(MODULES_KEY, [])
  )

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap))
  }, [progressMap])

  useEffect(() => {
    localStorage.setItem(MODULES_KEY, JSON.stringify(completedModules))
  }, [completedModules])

  const updateProgress = useCallback((questionId: string, status: ProgressStatus) => {
    setProgressMap(prev => ({ ...prev, [questionId]: status }))
  }, [])

  const toggleModule = useCallback((moduleId: string) => {
    setCompletedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }, [])

  return { progressMap, completedModules, updateProgress, toggleModule }
}
