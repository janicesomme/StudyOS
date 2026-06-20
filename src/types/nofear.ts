export type UnlockStatus = 'complete' | 'partial' | 'not_yet'

export type ProgressStatus =
  | 'not_started'
  | 'tried'
  | 'got_first_move'
  | 'solved'
  | 'needs_review'
  | 'mastered'

export interface Ch10Question {
  questionId: string
  smithPage: number | null
  problemArea: string
  questionType: string
  knowledgeNeeded: string
  requiredMoves: string
  module0Unlock: UnlockStatus
  module1Unlock: UnlockStatus
  laterModuleNeeded: string
  accuracyRisk: string
  notes: string
}

export interface ModuleDef {
  id: string
  name: string
  unlockField: 'module0Unlock' | 'module1Unlock'
}

export const CH10_MODULES: ModuleDef[] = [
  { id: 'module0', name: '25K Alkene Big Picture', unlockField: 'module0Unlock' },
  { id: 'module1', name: 'Formula, Naming, Cis/Trans, and E/Z', unlockField: 'module1Unlock' },
]

export type ProgressMap = Record<string, ProgressStatus>

export const PROGRESS_LABELS: Record<ProgressStatus, string> = {
  not_started: 'Not started',
  tried: 'Tried',
  got_first_move: 'Got first move',
  solved: 'Solved',
  needs_review: 'Needs review',
  mastered: 'Mastered',
}

export const UNLOCK_LABELS: Record<UnlockStatus, string> = {
  complete: 'Ready to answer completely',
  partial: 'Can make the first correct move',
  not_yet: 'Not yet',
}
