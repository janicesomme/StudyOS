import { describe, it, expect } from 'vitest'
import { createLiveBaselineProvider } from '../baselines-live.js'
import { getBaseline as getStaticBaseline } from '../baselines.js'
import { createFakeSupabase } from './fake-supabase.js'

function seedStats(rows: { median_clinical_hours: number | null; median_research_hours: number | null }[]) {
  return createFakeSupabase({
    pm_school_stats: rows.map((r, i) => ({ id: `stat-${i}`, school_id: `school-${i}`, cycle_year: 2029, ...r })),
  })
}

describe('createLiveBaselineProvider — enough data', () => {
  it('derives `competitive` as the median across schools with data, for a mapped category', async () => {
    const supabase = seedStats([
      { median_research_hours: 300, median_clinical_hours: null },
      { median_research_hours: 500, median_clinical_hours: null },
      { median_research_hours: 700, median_clinical_hours: null },
    ])
    const provider = createLiveBaselineProvider(supabase as never)
    const baseline = await provider.getBaseline('research')
    expect(baseline.competitive).toBe(500) // median of 300/500/700
  })

  it('retains the static floor — there is no live analog for "floor"', async () => {
    const supabase = seedStats([
      { median_research_hours: 300, median_clinical_hours: null },
      { median_research_hours: 500, median_clinical_hours: null },
      { median_research_hours: 700, median_clinical_hours: null },
    ])
    const provider = createLiveBaselineProvider(supabase as never)
    const [live, staticBaseline] = await Promise.all([provider.getBaseline('research'), getStaticBaseline('research')])
    expect(live.floor).toBe(staticBaseline.floor)
  })

  it('clinical_volunteer and clinical_paid both derive from the same median_clinical_hours column', async () => {
    const supabase = seedStats([
      { median_clinical_hours: 200, median_research_hours: null },
      { median_clinical_hours: 300, median_research_hours: null },
      { median_clinical_hours: 400, median_research_hours: null },
    ])
    const provider = createLiveBaselineProvider(supabase as never)
    const [volunteer, paid] = await Promise.all([provider.getBaseline('clinical_volunteer'), provider.getBaseline('clinical_paid')])
    expect(volunteer.competitive).toBe(300)
    expect(paid.competitive).toBe(300)
  })
})

describe('createLiveBaselineProvider — sparse data falls back to static', () => {
  it('falls back fully to static when fewer than 3 schools have non-null data', async () => {
    const supabase = seedStats([
      { median_research_hours: 300, median_clinical_hours: null },
      { median_research_hours: 500, median_clinical_hours: null },
    ]) // only 2 — below the minimum
    const provider = createLiveBaselineProvider(supabase as never)
    const [live, staticBaseline] = await Promise.all([provider.getBaseline('research'), getStaticBaseline('research')])
    expect(live).toEqual(staticBaseline)
  })

  it('falls back to static when there is no pm_school_stats data at all', async () => {
    const supabase = createFakeSupabase()
    const provider = createLiveBaselineProvider(supabase as never)
    const [live, staticBaseline] = await Promise.all([provider.getBaseline('research'), getStaticBaseline('research')])
    expect(live).toEqual(staticBaseline)
  })

  it('null values in the column do not count toward the minimum-schools threshold', async () => {
    const supabase = seedStats([
      { median_research_hours: 300, median_clinical_hours: null },
      { median_research_hours: null, median_clinical_hours: null },
      { median_research_hours: null, median_clinical_hours: null },
    ]) // only 1 non-null value
    const provider = createLiveBaselineProvider(supabase as never)
    const [live, staticBaseline] = await Promise.all([provider.getBaseline('research'), getStaticBaseline('research')])
    expect(live).toEqual(staticBaseline)
  })
})

describe('createLiveBaselineProvider — categories with no mapped column', () => {
  it('always returns the static baseline for a category pm_school_stats cannot ever back', async () => {
    // even with abundant clinical/research data seeded, "shadowing" has no
    // corresponding pm_school_stats column and must stay static
    const supabase = seedStats([
      { median_clinical_hours: 200, median_research_hours: 300 },
      { median_clinical_hours: 250, median_research_hours: 350 },
      { median_clinical_hours: 300, median_research_hours: 400 },
    ])
    const provider = createLiveBaselineProvider(supabase as never)
    const [live, staticBaseline] = await Promise.all([provider.getBaseline('shadowing'), getStaticBaseline('shadowing')])
    expect(live).toEqual(staticBaseline)
  })

  it('publication stays static — pct_with_publications is a percentage, not an hours metric', async () => {
    const supabase = seedStats([
      { median_clinical_hours: 200, median_research_hours: 300 },
      { median_clinical_hours: 250, median_research_hours: 350 },
      { median_clinical_hours: 300, median_research_hours: 400 },
    ])
    const provider = createLiveBaselineProvider(supabase as never)
    const [live, staticBaseline] = await Promise.all([provider.getBaseline('publication'), getStaticBaseline('publication')])
    expect(live).toEqual(staticBaseline)
    expect(live.competitive).toBeNull()
  })
})

describe('createLiveBaselineProvider — getAllBaselines', () => {
  it('returns all 10 categories, live-derived where applicable and static elsewhere', async () => {
    const supabase = seedStats([
      { median_research_hours: 300, median_clinical_hours: 200 },
      { median_research_hours: 500, median_clinical_hours: 300 },
      { median_research_hours: 700, median_clinical_hours: 400 },
    ])
    const provider = createLiveBaselineProvider(supabase as never)
    const all = await provider.getAllBaselines()
    expect(Object.keys(all)).toHaveLength(10)
    expect(all.research.competitive).toBe(500)
    expect(all.clinical_volunteer.competitive).toBe(300)
    const staticShadowing = await getStaticBaseline('shadowing')
    expect(all.shadowing).toEqual(staticShadowing)
  })
})
