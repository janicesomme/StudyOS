import type { ApplicantPoolPosition } from '../../lib/corpus-stats.js'
import type { GapAnalysis } from '../../lib/gap-analyzer.js'

type Props = {
  poolPositions: ApplicantPoolPosition[]
  gapAnalysis: GapAnalysis
}

function PercentileBar({ label, percentile }: { label: string; percentile: number | null }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-medium text-gray-900">{percentile !== null ? `${percentile.toFixed(1)}th percentile` : 'n/a'}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className="bg-indigo-500 h-2.5 rounded-full transition-all"
          style={{ width: `${percentile ?? 0}%` }}
        />
      </div>
    </div>
  )
}

function trendArrow(delta: GapAnalysis['delta']): string {
  if (!delta || delta.acceptance_rate_delta === null) return '(n/a)'
  if (delta.acceptance_rate_delta > 0) return `+${delta.acceptance_rate_delta.toFixed(1)} pts ↑`
  if (delta.acceptance_rate_delta < 0) return `${delta.acceptance_rate_delta.toFixed(1)} pts ↓`
  return '0.0 pts →'
}

function formatRate(cell: GapAnalysis['cycles'][number]['mainCell']): string {
  if (cell.acceptance_rate !== null) return `${cell.acceptance_rate.toFixed(1)}%`
  return cell.note ?? 'n/a'
}

export function ApplicantPoolPositionSection({ poolPositions, gapAnalysis }: Props) {
  const latest = poolPositions[poolPositions.length - 1]
  const earliest = poolPositions[0]
  const latestCycle = gapAnalysis.cycles[gapAnalysis.cycles.length - 1]

  const sensitivityRows: Array<[string, string, GapAnalysis['cycles'][number]['mainCell'] | null]> = [
    ['GPA band up', gapAnalysis.neighborBands.gpaUp ?? '(already top band)', latestCycle.neighbors.gpaUp],
    ['Your cell', gapAnalysis.gpa_band, latestCycle.mainCell],
    ['GPA band down', gapAnalysis.neighborBands.gpaDown ?? '(already bottom band)', latestCycle.neighbors.gpaDown],
    ['MCAT band up', gapAnalysis.neighborBands.mcatUp ?? '(already top band)', latestCycle.neighbors.mcatUp],
    ['MCAT band down', gapAnalysis.neighborBands.mcatDown ?? '(already bottom band)', latestCycle.neighbors.mcatDown],
  ]

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Applicant Pool Position</h2>
      <p className="text-xs text-gray-400 mb-4">
        GPA band {latest.gpa_band} &times; MCAT band {latest.mcat_band} (cycle {latest.cycle_year})
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">GPA</p>
          <PercentileBar label="vs. applicants" percentile={latest.gpa_percentile_applicants} />
          <PercentileBar label="vs. acceptees" percentile={latest.gpa_percentile_acceptees} />
          {earliest.cycle_year !== latest.cycle_year && (
            <p className="text-xs text-gray-400 mt-1">
              {earliest.cycle_year}: {earliest.gpa_percentile_applicants?.toFixed(1) ?? 'n/a'}th / {earliest.gpa_percentile_acceptees?.toFixed(1) ?? 'n/a'}th
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">MCAT</p>
          <PercentileBar label="vs. applicants" percentile={latest.mcat_percentile_applicants} />
          <PercentileBar label="vs. acceptees" percentile={latest.mcat_percentile_acceptees} />
          {earliest.cycle_year !== latest.cycle_year && (
            <p className="text-xs text-gray-400 mt-1">
              {earliest.cycle_year}: {earliest.mcat_percentile_applicants?.toFixed(1) ?? 'n/a'}th / {earliest.mcat_percentile_acceptees?.toFixed(1) ?? 'n/a'}th
            </p>
          )}
        </div>
      </div>
      {latest.note && <p className="text-xs text-amber-600 mb-5">{latest.note}</p>}

      <div className="border-t border-gray-100 pt-4 mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Your odds by cycle</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {gapAnalysis.cycles.map(cycle => (
            <span key={cycle.cycle_year} className="text-gray-700">
              <span className="font-medium">{cycle.cycle_year}:</span> {formatRate(cycle.mainCell)}
            </span>
          ))}
          {gapAnalysis.delta && (
            <span className="font-medium text-indigo-600">
              Trend {gapAnalysis.delta.from_cycle_year}&rarr;{gapAnalysis.delta.to_cycle_year}: {trendArrow(gapAnalysis.delta)}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">+/-1 band sensitivity (cycle {latestCycle.cycle_year})</p>
        <table className="w-full text-sm">
          <tbody>
            {sensitivityRows.map(([label, band, cell]) => (
              <tr key={label} className="border-b border-gray-50 last:border-0">
                <td className="py-1.5 text-gray-500">{label}</td>
                <td className="py-1.5 text-gray-700">{band}</td>
                <td className="py-1.5 text-right font-medium text-gray-900">{cell ? formatRate(cell) : 'n/a'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
