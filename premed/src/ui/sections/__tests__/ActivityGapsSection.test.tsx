import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { CategoryGap } from '../../../lib/activity-gap.js'
import { DEMO_ARCHETYPES } from '../../data/demo-archetypes.generated.js'
import { ActivityGapsSection } from '../ActivityGapsSection.js'

const grinder = DEMO_ARCHETYPES.find(a => a.key === 'grinder')!

function makeGap(overrides: Partial<CategoryGap>): CategoryGap {
  return {
    category: 'shadowing',
    hoursCompleted: 0,
    hoursPlanned: 0,
    baseline: { competitive: 75, floor: 40, note: 'test baseline note' },
    status: 'missing',
    gapToCompetitive: 75,
    plannedClosesGap: false,
    ...overrides,
  }
}

describe('ActivityGapsSection', () => {
  it('renders one row per category from the real archetype fixture', () => {
    render(<ActivityGapsSection gaps={grinder.activityGaps} />)
    for (const gap of grinder.activityGaps) {
      expect(screen.getAllByText(new RegExp(gap.category.replace(/_/g, ' '), 'i')).length).toBeGreaterThan(0)
    }
  })

  it('shows a status badge matching the gap status', () => {
    render(<ActivityGapsSection gaps={[makeGap({ category: 'research', status: 'strong' })]} />)
    expect(screen.getByText('strong')).toBeInTheDocument()
  })

  it('shows "not benchmarked" for a null-status (no-baseline) category', () => {
    render(<ActivityGapsSection gaps={[makeGap({ category: 'publication', status: null, gapToCompetitive: null, plannedClosesGap: null, baseline: { competitive: null, floor: null, note: 'no norm' } })]} />)
    expect(screen.getByText('not benchmarked')).toBeInTheDocument()
  })

  it('shows "yes" when planned hours close the gap, "no" when they do not', () => {
    render(
      <ActivityGapsSection
        gaps={[makeGap({ category: 'research', plannedClosesGap: true }), makeGap({ category: 'leadership', plannedClosesGap: false })]}
      />
    )
    expect(screen.getByText('yes')).toBeInTheDocument()
    expect(screen.getByText('no')).toBeInTheDocument()
  })

  it('shows "none (met/exceeded)" once the gap is fully closed', () => {
    render(<ActivityGapsSection gaps={[makeGap({ category: 'research', gapToCompetitive: 0, plannedClosesGap: null })]} />)
    expect(screen.getByText('none (met/exceeded)')).toBeInTheDocument()
  })
})
