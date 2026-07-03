import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DEMO_ARCHETYPES } from '../../data/demo-archetypes.generated.js'
import { ApplicantPoolPositionSection } from '../ApplicantPoolPositionSection.js'

const grinder = DEMO_ARCHETYPES.find(a => a.key === 'grinder')!

describe('ApplicantPoolPositionSection', () => {
  it('renders the matched GPA/MCAT band and cycle year', () => {
    render(<ApplicantPoolPositionSection poolPositions={grinder.poolPositions} gapAnalysis={grinder.gapAnalysis} />)
    expect(screen.getByText('Applicant Pool Position')).toBeInTheDocument()
    const bandRegex = new RegExp(grinder.gapAnalysis.gpa_band.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    expect(screen.getAllByText(bandRegex).length).toBeGreaterThan(0)
  })

  it('renders a percentile figure for GPA and MCAT', () => {
    render(<ApplicantPoolPositionSection poolPositions={grinder.poolPositions} gapAnalysis={grinder.gapAnalysis} />)
    const latest = grinder.poolPositions[grinder.poolPositions.length - 1]
    if (latest.gpa_percentile_applicants !== null) {
      expect(screen.getAllByText(new RegExp(`${latest.gpa_percentile_applicants.toFixed(1)}th percentile`)).length).toBeGreaterThan(0)
    }
  })

  it('renders the cycle-by-cycle odds and a trend line', () => {
    render(<ApplicantPoolPositionSection poolPositions={grinder.poolPositions} gapAnalysis={grinder.gapAnalysis} />)
    expect(screen.getByText('Your odds by cycle')).toBeInTheDocument()
    for (const cycle of grinder.gapAnalysis.cycles) {
      expect(screen.getAllByText(new RegExp(String(cycle.cycle_year))).length).toBeGreaterThan(0)
    }
  })

  it('renders the sensitivity table with "Your cell" row', () => {
    render(<ApplicantPoolPositionSection poolPositions={grinder.poolPositions} gapAnalysis={grinder.gapAnalysis} />)
    expect(screen.getByText('Your cell')).toBeInTheDocument()
  })

  it('renders a suppression note when present, and omits it when absent', () => {
    const suppressed = { ...grinder.poolPositions[0], note: 'Fewer than 10 nationally excluded.' }
    render(<ApplicantPoolPositionSection poolPositions={[suppressed, suppressed]} gapAnalysis={grinder.gapAnalysis} />)
    expect(screen.getByText('Fewer than 10 nationally excluded.')).toBeInTheDocument()
  })
})
