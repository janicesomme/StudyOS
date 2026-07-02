import type { EasProblem, EasSolutionStep } from '../types/database'

export type Chapter = {
  id: string   // String(problem.chapter) — used as join key in readiness
  number: number
}

export type Question = {
  id: string
  chapter_id: string   // String(problem.chapter)
  topic_id: string | null  // problem.topic; used as join key against Topic.id
  difficulty: 'easy' | 'medium' | 'hard'
}

export type Topic = {
  id: string        // same value as Question.topic_id
  chapter_id: string
  title: string
}

export type Hint = {
  question_id: string
  hint_level: number
  kind: 'hint' | 'checklist'
  content: string
}

export type Step = {
  question_id: string
  step_number: number
  content: string
}

// Assumes difficulty is on a 1–10 scale; null defaults to 'medium'.
function difficultyLabel(d: number | null): 'easy' | 'medium' | 'hard' {
  if (d === null) return 'medium'
  if (d <= 3) return 'easy'
  if (d <= 6) return 'medium'
  return 'hard'
}

export function toQuestion(p: EasProblem): Question {
  return {
    id: p.id,
    chapter_id: String(p.chapter),
    topic_id: p.topic,
    difficulty: difficultyLabel(p.difficulty),
  }
}

export function toHints(p: EasProblem): Hint[] {
  const hints: Hint[] = []
  if (p.hint_1) hints.push({ question_id: p.id, hint_level: 1, kind: 'hint', content: p.hint_1 })
  if (p.hint_2) hints.push({ question_id: p.id, hint_level: 2, kind: 'hint', content: p.hint_2 })
  if (p.checklist_hint) hints.push({ question_id: p.id, hint_level: 3, kind: 'checklist', content: p.checklist_hint })
  return hints
}

export function toStep(s: EasSolutionStep): Step {
  return {
    question_id: s.problem_id,
    step_number: s.step_order,
    content: `${s.do_this} — ${s.why}`,
  }
}

export function toTopics(problems: EasProblem[]): Topic[] {
  const seen = new Map<string, Topic>()
  for (const p of problems) {
    if (!p.topic) continue
    const key = `${p.chapter}:${p.topic}`
    if (!seen.has(key)) {
      seen.set(key, {
        id: p.topic,
        chapter_id: String(p.chapter),
        title: p.topic,
      })
    }
  }
  return Array.from(seen.values())
}

export function toChapters(problems: EasProblem[]): Chapter[] {
  const seen = new Map<number, Chapter>()
  for (const p of problems) {
    if (!seen.has(p.chapter)) {
      seen.set(p.chapter, { id: String(p.chapter), number: p.chapter })
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.number - b.number)
}
