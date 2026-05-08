import { useKnowledgeUnits } from '../../hooks/useKnowledgeUnits'

interface KnowledgeUnitListProps {
  sourceMaterialId: string
}

const difficultyLabel: Record<number, string> = {
  1: 'Fundamental',
  2: 'Basic',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
}

export function KnowledgeUnitList({ sourceMaterialId }: KnowledgeUnitListProps) {
  const { units, loading } = useKnowledgeUnits(sourceMaterialId)

  if (loading) {
    return <p className="text-sm text-gray-400 py-4">Loading knowledge units...</p>
  }

  if (units.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No knowledge units found for this material.</p>
  }

  return (
    <div className="space-y-3 mt-2">
      <p className="text-xs text-gray-500 font-medium">{units.length} knowledge units extracted</p>
      {units.map((unit) => (
        <div key={unit.id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-semibold text-gray-900">{unit.concept_name}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {unit.difficulty_level !== null && (
                <span className="text-xs text-gray-400">{difficultyLabel[unit.difficulty_level]}</span>
              )}
              {unit.testability_score !== null && unit.testability_score >= 4 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                  High yield
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">{unit.plain_english_explanation}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{unit.topic}{unit.subtopic ? ` / ${unit.subtopic}` : ''}</span>
            {unit.source_location && <span>{unit.source_location}</span>}
          </div>
          {unit.common_misconceptions.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-0.5">Common mistake:</p>
              <p className="text-xs text-gray-500">{unit.common_misconceptions[0]}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
