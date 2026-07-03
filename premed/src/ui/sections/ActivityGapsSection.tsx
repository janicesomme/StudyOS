import type { CategoryGap, GapStatus } from '../../lib/activity-gap.js'

type Props = {
  gaps: CategoryGap[]
}

const STATUS_STYLES: Record<GapStatus, string> = {
  strong: 'bg-green-100 text-green-700',
  competitive: 'bg-blue-100 text-blue-700',
  below: 'bg-amber-100 text-amber-700',
  missing: 'bg-red-100 text-red-700',
}

function StatusBadge({ status }: { status: GapStatus | null }) {
  if (status === null) {
    return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">not benchmarked</span>
  }
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>{status}</span>
}

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function PlannedIndicator({ closes }: { closes: boolean | null }) {
  if (closes === null) return <span className="text-gray-300">n/a</span>
  return closes ? <span className="text-green-600 font-medium">yes</span> : <span className="text-red-500 font-medium">no</span>
}

export function ActivityGapsSection({ gaps }: Props) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Activity Gaps</h2>
      <p className="text-xs text-gray-400 mb-4">Biggest gaps first</p>

      <div className="space-y-3">
        {gaps.map(gap => (
          <div key={gap.category} className="border border-gray-100 rounded-xl p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">{formatCategory(gap.category)}</span>
              <StatusBadge status={gap.status} />
            </div>
            <p className="text-xs text-gray-500 mb-1">
              you={gap.hoursCompleted}h (planned +{gap.hoursPlanned}h)
              {gap.baseline.competitive !== null && ` · baseline floor=${gap.baseline.floor}h competitive=${gap.baseline.competitive}h`}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                gap-to-competitive: <span className="font-medium text-gray-800">{gap.gapToCompetitive === null ? 'n/a' : gap.gapToCompetitive === 0 ? 'none (met/exceeded)' : `${gap.gapToCompetitive}h`}</span>
              </span>
              <span className="text-gray-500">
                planned hours close this gap: <PlannedIndicator closes={gap.plannedClosesGap} />
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{gap.baseline.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
