import { describe, it, expect } from 'vitest'
import { computeActivityGaps, computeGap, computeStatus } from '../activity-gap.js'
import { getBaseline } from '../baselines.js'
import { ACTIVITY_CATEGORIES } from '../schemas.js'

describe('baselines', () => {
  it('covers all 10 category enum values', async () => {
    for (const category of ACTIVITY_CATEGORIES) {
      const baseline = await getBaseline(category)
      expect(baseline).toBeDefined()
      expect(typeof baseline.note).toBe('string')
      expect(baseline.note.length).toBeGreaterThan(0)
    }
  })

  it('gives explicit null baselines (not fake numbers) for categories with no meaningful hour norm', async () => {
    for (const category of ['publication', 'extracurricular', 'other', 'teaching'] as const) {
      const baseline = await getBaseline(category)
      expect(baseline.competitive).toBeNull()
      expect(baseline.floor).toBeNull()
    }
  })

  it('gives numeric floor <= competitive for every category that has a norm', async () => {
    for (const category of ACTIVITY_CATEGORIES) {
      const baseline = await getBaseline(category)
      if (baseline.competitive === null) continue
      expect(baseline.floor).not.toBeNull()
      expect(baseline.floor!).toBeLessThanOrEqual(baseline.competitive)
    }
  })
})

describe('computeStatus', () => {
  const baseline = { competitive: 150, floor: 100, note: 'test' }

  it('is "missing" at exactly 0 hours', () => {
    expect(computeStatus(0, baseline)).toBe('missing')
  })

  it('is "below" for any amount under the floor', () => {
    expect(computeStatus(1, baseline)).toBe('below')
    expect(computeStatus(99, baseline)).toBe('below')
  })

  it('is "competitive" at exactly the floor and up to (not including) the competitive threshold', () => {
    expect(computeStatus(100, baseline)).toBe('competitive')
    expect(computeStatus(149, baseline)).toBe('competitive')
  })

  it('is "strong" at exactly the competitive threshold and beyond', () => {
    expect(computeStatus(150, baseline)).toBe('strong')
    expect(computeStatus(1000, baseline)).toBe('strong')
  })

  it('is null when the category has no baseline', () => {
    expect(computeStatus(500, { competitive: null, floor: null, note: 'no norm' })).toBeNull()
  })
})

describe('computeGap', () => {
  const baseline = { competitive: 150, floor: 100, note: 'test' }

  it('reports the hours still needed to reach competitive, with zero hours', () => {
    expect(computeGap(0, 0, baseline)).toEqual({ gapToCompetitive: 150, plannedClosesGap: false })
  })

  it('reports plannedClosesGap=true when completed+planned reaches the threshold', () => {
    expect(computeGap(50, 100, baseline)).toEqual({ gapToCompetitive: 100, plannedClosesGap: true })
  })

  it('reports plannedClosesGap=false when completed+planned falls short', () => {
    expect(computeGap(50, 20, baseline)).toEqual({ gapToCompetitive: 100, plannedClosesGap: false })
  })

  it('reports plannedClosesGap=true at the exact boundary (completed+planned == competitive)', () => {
    expect(computeGap(100, 50, baseline)).toEqual({ gapToCompetitive: 50, plannedClosesGap: true })
  })

  it('reports gap=0 and plannedClosesGap=null once already met or exceeded — nothing left to close', () => {
    expect(computeGap(150, 0, baseline)).toEqual({ gapToCompetitive: 0, plannedClosesGap: null })
    expect(computeGap(500, 0, baseline)).toEqual({ gapToCompetitive: 0, plannedClosesGap: null })
  })

  it('returns nulls for a category with no baseline', () => {
    expect(computeGap(500, 100, { competitive: null, floor: null, note: 'no norm' })).toEqual({
      gapToCompetitive: null,
      plannedClosesGap: null,
    })
  })
})

describe('computeActivityGaps', () => {
  it('sums hours across multiple activities in the same category', async () => {
    const gaps = await computeActivityGaps([
      { category: 'research', hours_completed: 100, hours_planned: 0 },
      { category: 'research', hours_completed: 50, hours_planned: 20 },
    ])
    const research = gaps.find(g => g.category === 'research')!
    expect(research.hoursCompleted).toBe(150)
    expect(research.hoursPlanned).toBe(20)
  })

  it('includes all 10 categories even when the user has zero activities', async () => {
    const gaps = await computeActivityGaps([])
    expect(gaps).toHaveLength(10)
    expect(gaps.every(g => g.hoursCompleted === 0 && g.hoursPlanned === 0)).toBe(true)
  })

  it('orders biggest gap first, with null-gap categories (no baseline, or already met) sorted last', async () => {
    const gaps = await computeActivityGaps([
      { category: 'shadowing', hours_completed: 75, hours_planned: 0 }, // met exactly -> gap 0
      { category: 'clinical_paid', hours_completed: 200, hours_planned: 0 }, // gap 100 (300 - 200)
      { category: 'research', hours_completed: 300, hours_planned: 0 }, // gap 100 (400 - 300)
      // clinical_volunteer left untouched: 0h logged -> gap 150 (its full competitive baseline), the largest of all
    ])

    const nonNullGaps = gaps.filter(g => g.gapToCompetitive !== null && g.gapToCompetitive > 0)
    for (let i = 1; i < nonNullGaps.length; i++) {
      expect(nonNullGaps[i - 1].gapToCompetitive!).toBeGreaterThanOrEqual(nonNullGaps[i].gapToCompetitive!)
    }
    expect(gaps[0].category).toBe('clinical_volunteer') // biggest numeric gap (150h, untouched) leads

    // null-baseline categories (publication, extracurricular, other, teaching) sort at the end
    const lastFour = gaps.slice(-4).map(g => g.category)
    expect(lastFour.sort()).toEqual(['extracurricular', 'other', 'publication', 'teaching'])
  })

  it('a zero-hours category is "missing" with the full competitive baseline as its gap', async () => {
    const gaps = await computeActivityGaps([])
    const clinicalVolunteer = gaps.find(g => g.category === 'clinical_volunteer')!
    expect(clinicalVolunteer.status).toBe('missing')
    expect(clinicalVolunteer.gapToCompetitive).toBe(clinicalVolunteer.baseline.competitive)
  })

  it('null-baseline categories report status=null and no gap even with logged hours', async () => {
    const gaps = await computeActivityGaps([{ category: 'publication', hours_completed: 40, hours_planned: 0 }])
    const publication = gaps.find(g => g.category === 'publication')!
    expect(publication.hoursCompleted).toBe(40)
    expect(publication.status).toBeNull()
    expect(publication.gapToCompetitive).toBeNull()
    expect(publication.plannedClosesGap).toBeNull()
  })
})
