import type { SchoolComparisonRow } from '../../lib/school-comparison.js'

type Props = {
  comparison: SchoolComparisonRow[]
}

const FIT_STYLES: Record<SchoolComparisonRow['fit_category'], string> = {
  safety: 'bg-green-100 text-green-700',
  target: 'bg-blue-100 text-blue-700',
  reach: 'bg-red-100 text-red-700',
}

function formatDelta(delta: number, unit: string): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta}${unit}`
}

export function SchoolComparisonSection({ comparison }: Props) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">School Comparison</h2>
      <p className="text-xs text-gray-400 mb-4">
        {comparison.length} schools with real, publicly-scraped median GPA/MCAT — sorted safest fit first
      </p>

      {comparison.length === 0 ? (
        <p className="text-sm text-gray-400">No school comparison data available yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                <th className="py-2 pr-2">School</th>
                <th className="py-2 px-2">Median GPA</th>
                <th className="py-2 px-2">Median MCAT</th>
                <th className="py-2 px-2">Your delta</th>
                <th className="py-2 pl-2">Fit</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(row => (
                <tr key={row.school_id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 pr-2 font-medium text-gray-900">{row.school_name}</td>
                  <td className="py-2 px-2 text-gray-600">{row.median_gpa.toFixed(2)}</td>
                  <td className="py-2 px-2 text-gray-600">{row.median_mcat}</td>
                  <td className="py-2 px-2 text-gray-600">
                    {formatDelta(row.gpa_delta, ' GPA')}, {formatDelta(row.mcat_delta, ' MCAT')}
                  </td>
                  <td className="py-2 pl-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${FIT_STYLES[row.fit_category]}`}>
                      {row.fit_category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
