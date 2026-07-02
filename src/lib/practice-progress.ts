export type Attempt = {
  question_id: string
  score: 0 | 1 | 3 | 5
  hints_used: number
  used_solution: boolean
  created_at: string
  scratchpad?: string | null
}

const KEY = 'studyos-eas-attempts-v1'

function read(): Attempt[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function write(a: Attempt[]) {
  localStorage.setItem(KEY, JSON.stringify(a))
  window.dispatchEvent(new Event('attempts-updated'))
}

export const progress = {
  all: read,
  recordAttempt(input: Omit<Attempt, 'created_at'>) {
    const list = read()
    list.push({ ...input, created_at: new Date().toISOString() })
    write(list)
  },
  latestFor(qId: string): Attempt | null {
    const list = read().filter((a) => a.question_id === qId)
    return list[list.length - 1] ?? null
  },
  clear() {
    write([])
  },
}
