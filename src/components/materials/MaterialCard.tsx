import type { SourceMaterial } from '../../types/database'

interface MaterialCardProps {
  material: SourceMaterial
  onSelect: (id: string) => void
  selected: boolean
}

const statusColors: Record<SourceMaterial['processing_status'], string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
}

export function MaterialCard({ material, onSelect, selected }: MaterialCardProps) {
  return (
    <button
      onClick={() => onSelect(material.id)}
      className={`w-full text-left rounded-xl border p-4 transition-colors ${
        selected
          ? 'border-indigo-400 bg-indigo-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">{material.title}</p>
        <span
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[material.processing_status]}`}
        >
          {material.processing_status}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-gray-400 uppercase">{material.file_type}</span>
        {material.needs_review && (
          <span className="text-xs text-amber-600 font-medium">needs review</span>
        )}
      </div>
      {material.error_message && material.processing_status === 'failed' && (
        <p className="mt-1 text-xs text-red-500">{material.error_message}</p>
      )}
    </button>
  )
}
