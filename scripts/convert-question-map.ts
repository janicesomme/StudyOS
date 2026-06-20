import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { read, utils } from 'xlsx'

type RawRow = { [key: string]: string | number }

function normalizeCoverage(raw: string | number): 'complete' | 'partial' | 'not_yet' {
  const s = String(raw)
  if (s === 'Complete') return 'complete'
  if (s === 'Partial') return 'partial'
  return 'not_yet'
}

const buf = readFileSync('docs/no-fear-ochem/gorzynski_ch10_question_knowledge_map_v1.xlsx')
const wb = read(buf)
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = utils.sheet_to_json<RawRow>(ws, { defval: '' })

const questions = rows.map(r => ({
  questionId: String(r['Question_ID']),
  smithPage: typeof r['Smith_Page'] === 'number' ? (r['Smith_Page'] as number) : null,
  problemArea: String(r['Problem_Area']),
  questionType: String(r['Question_Type']),
  knowledgeNeeded: String(r['Knowledge_Needed']),
  requiredMoves: String(r['Required_Moves']),
  module0Unlock: normalizeCoverage(r['25K_Coverage']),
  module1Unlock: normalizeCoverage(r['10K_Coverage']),
  laterModuleNeeded: String(r['Later_Module_Needed']),
  accuracyRisk: String(r['Accuracy_Risk']),
  notes: String(r['Notes']),
}))

const output = [
  `// Auto-generated -- do not edit by hand.`,
  `// Source: docs/no-fear-ochem/gorzynski_ch10_question_knowledge_map_v1.xlsx`,
  `// To regenerate: npm run convert-question-map`,
  `import type { Ch10Question } from '../types/nofear'`,
  ``,
  `export const CH10_QUESTIONS: Ch10Question[] = ${JSON.stringify(questions, null, 2)}`,
].join('\n')

mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/ch10-question-map.ts', output)
console.log(`Wrote ${questions.length} questions to src/data/ch10-question-map.ts`)
