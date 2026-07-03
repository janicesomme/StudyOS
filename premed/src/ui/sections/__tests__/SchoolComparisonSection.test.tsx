import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { computeSchoolComparison } from '../../../lib/school-comparison.js'
import { SCHOOL_STATS_SNAPSHOT } from '../../data/school-stats-snapshot.generated.js'
import { SchoolComparisonSection } from '../SchoolComparisonSection.js'

const comparison = computeSchoolComparison(SCHOOL_STATS_SNAPSHOT, { gpa: 3.6, mcat: 508 })

describe('SchoolComparisonSection', () => {
  it('renders a row per school with real snapshot data', () => {
    render(<SchoolComparisonSection comparison={comparison} />)
    for (const row of comparison) {
      expect(screen.getByText(row.school_name)).toBeInTheDocument()
    }
  })

  it('renders a fit category badge for each row', () => {
    render(<SchoolComparisonSection comparison={comparison} />)
    const categories = new Set(comparison.map(r => r.fit_category))
    for (const category of categories) {
      expect(screen.getAllByText(category).length).toBeGreaterThan(0)
    }
  })

  it('shows the school count in the header', () => {
    render(<SchoolComparisonSection comparison={comparison} />)
    expect(screen.getByText(new RegExp(`${comparison.length} schools`))).toBeInTheDocument()
  })

  it('renders an empty state when there is no comparison data', () => {
    render(<SchoolComparisonSection comparison={[]} />)
    expect(screen.getByText('No school comparison data available yet.')).toBeInTheDocument()
  })

  it('lists the safest fit first (sorted order is preserved from the caller)', () => {
    render(<SchoolComparisonSection comparison={comparison} />)
    const rows = screen.getAllByRole('row').slice(1) // skip header row
    expect(rows[0]).toHaveTextContent(comparison[0].school_name)
  })
})
