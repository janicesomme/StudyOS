import { describe, it, expect } from 'vitest'
import {
  parseBandBounds,
  buildBandOrder,
  mapToBand,
  getNeighborLabel,
  computeCellStats,
  analyzeProfile,
  type FactsGridRow,
} from '../gap-analyzer.js'

// The real 11 GPA bands and 10 MCAT bands, verbatim as stored in pm_facts_grid
// (verified against the ingested 2023/2025 AAMC Table A-23 workbooks).
const GPA_BANDS = [
  'Greater than 3.79',
  '3.60-3.79',
  '3.40-3.59',
  '3.20-3.39',
  '3.00-3.19',
  '2.80-2.99',
  '2.60-2.79',
  '2.40-2.59',
  '2.20-2.39',
  '2.00-2.19',
  'Less than 2.00',
]
const MCAT_BANDS = [
  'Less than 486',
  '486-489',
  '490-493',
  '494-497',
  '498-501',
  '502-505',
  '506-509',
  '510-513',
  '514-517',
  'Greater than 517',
]

describe('parseBandBounds', () => {
  it('parses an inclusive "X-Y" range', () => {
    expect(parseBandBounds('3.60-3.79')).toEqual({ min: 3.6, minInclusive: true, max: 3.79, maxInclusive: true })
  })

  it('parses "Less than X" as an exclusive-max open band', () => {
    expect(parseBandBounds('Less than 2.00')).toEqual({
      min: -Infinity,
      minInclusive: true,
      max: 2.0,
      maxInclusive: false,
    })
  })

  it('parses "Greater than X" as an exclusive-min open band', () => {
    expect(parseBandBounds('Greater than 3.79')).toEqual({
      min: 3.79,
      minInclusive: false,
      max: Infinity,
      maxInclusive: true,
    })
  })

  it('parses integer MCAT bands the same way', () => {
    expect(parseBandBounds('486-489')).toEqual({ min: 486, minInclusive: true, max: 489, maxInclusive: true })
    expect(parseBandBounds('Greater than 517')).toEqual({
      min: 517,
      minInclusive: false,
      max: Infinity,
      maxInclusive: true,
    })
  })

  it('throws on an unrecognized label', () => {
    expect(() => parseBandBounds('not a band')).toThrow(/Unrecognized band label/)
  })
})

describe('buildBandOrder', () => {
  it('dedupes and sorts ascending by lower bound', () => {
    const order = buildBandOrder(['3.60-3.79', 'Less than 2.00', '3.60-3.79', '2.00-2.19', 'Greater than 3.79'])
    expect(order.map(b => b.label)).toEqual(['Less than 2.00', '2.00-2.19', '3.60-3.79', 'Greater than 3.79'])
  })
})

describe('mapToBand — GPA boundaries', () => {
  const gpaOrder = buildBandOrder(GPA_BANDS)

  it('maps a value exactly on a range upper edge to the inclusive range band, not the open band above it', () => {
    expect(mapToBand(3.79, gpaOrder).label).toBe('3.60-3.79')
  })

  it('maps a value just above a range upper edge to the open "Greater than" band', () => {
    expect(mapToBand(3.8, gpaOrder).label).toBe('Greater than 3.79')
  })

  it('maps a value exactly on a range lower edge to that range band, not the open band below it', () => {
    expect(mapToBand(2.0, gpaOrder).label).toBe('2.00-2.19')
  })

  it('maps a value just below a range lower edge to the open "Less than" band', () => {
    expect(mapToBand(1.99, gpaOrder).label).toBe('Less than 2.00')
  })

  it('maps the legal extremes (0 and 4.0) into the open top/bottom bands', () => {
    expect(mapToBand(0, gpaOrder).label).toBe('Less than 2.00')
    expect(mapToBand(4.0, gpaOrder).label).toBe('Greater than 3.79')
  })

  it('throws when no band in the list covers the value', () => {
    const partial = buildBandOrder(['3.60-3.79', '3.40-3.59'])
    expect(() => mapToBand(2.5, partial)).toThrow(/No band in the provided band list contains value/)
  })
})

describe('mapToBand — MCAT boundaries', () => {
  const mcatOrder = buildBandOrder(MCAT_BANDS)

  it('maps a value exactly on a range edge to the range band', () => {
    expect(mapToBand(486, mcatOrder).label).toBe('486-489')
    expect(mapToBand(517, mcatOrder).label).toBe('514-517')
  })

  it('maps values just outside range edges to the open bands', () => {
    expect(mapToBand(485, mcatOrder).label).toBe('Less than 486')
    expect(mapToBand(518, mcatOrder).label).toBe('Greater than 517')
  })
})

describe('getNeighborLabel', () => {
  const gpaOrder = buildBandOrder(GPA_BANDS)

  it('returns the band one position up/down for a mid-list band', () => {
    const match = mapToBand(3.7, gpaOrder) // "3.60-3.79"
    expect(getNeighborLabel(gpaOrder, match.index, 1)).toBe('Greater than 3.79')
    expect(getNeighborLabel(gpaOrder, match.index, -1)).toBe('3.40-3.59')
  })

  it('returns null past the top edge', () => {
    const match = mapToBand(4.0, gpaOrder) // "Greater than 3.79", the top band
    expect(getNeighborLabel(gpaOrder, match.index, 1)).toBeNull()
  })

  it('returns null past the bottom edge', () => {
    const match = mapToBand(0, gpaOrder) // "Less than 2.00", the bottom band
    expect(getNeighborLabel(gpaOrder, match.index, -1)).toBeNull()
  })
})

describe('computeCellStats', () => {
  it('computes a rounded percentage rate for a normal row', () => {
    const row: FactsGridRow = {
      cycle_year: 2025,
      gpa_band: '3.60-3.79',
      mcat_band: '510-513',
      applicants: 100,
      applicants_suppressed: false,
      acceptees: 45,
      acceptees_suppressed: false,
    }
    const stats = computeCellStats(row, 2025, '3.60-3.79', '510-513')
    expect(stats.acceptance_rate).toBe(45.0)
    expect(stats.note).toBeNull()
  })

  it('rounds to one decimal place', () => {
    const row: FactsGridRow = {
      cycle_year: 2025,
      gpa_band: '3.60-3.79',
      mcat_band: '510-513',
      applicants: 3,
      applicants_suppressed: false,
      acceptees: 1,
      acceptees_suppressed: false,
    }
    expect(computeCellStats(row, 2025, '3.60-3.79', '510-513').acceptance_rate).toBe(33.3)
  })

  it('never fabricates a rate when acceptees is suppressed, even with a known applicants count', () => {
    const row: FactsGridRow = {
      cycle_year: 2025,
      gpa_band: '2.00-2.19',
      mcat_band: '510-513',
      applicants: 50,
      applicants_suppressed: false,
      acceptees: null,
      acceptees_suppressed: true,
    }
    const stats = computeCellStats(row, 2025, '2.00-2.19', '510-513')
    expect(stats.acceptance_rate).toBeNull()
    expect(stats.note).toMatch(/Fewer than 10 nationally/)
  })

  it('never fabricates a rate when applicants is suppressed', () => {
    const row: FactsGridRow = {
      cycle_year: 2025,
      gpa_band: '2.00-2.19',
      mcat_band: '510-513',
      applicants: null,
      applicants_suppressed: true,
      acceptees: null,
      acceptees_suppressed: true,
    }
    const stats = computeCellStats(row, 2025, '2.00-2.19', '510-513')
    expect(stats.acceptance_rate).toBeNull()
    expect(stats.applicants).toBeNull()
    expect(stats.acceptees).toBeNull()
  })

  it('flags a zero-applicant cell distinctly from a suppressed one', () => {
    const row: FactsGridRow = {
      cycle_year: 2025,
      gpa_band: 'Less than 2.00',
      mcat_band: 'Greater than 517',
      applicants: 0,
      applicants_suppressed: false,
      acceptees: 0,
      acceptees_suppressed: false,
    }
    const stats = computeCellStats(row, 2025, 'Less than 2.00', 'Greater than 517')
    expect(stats.acceptance_rate).toBeNull()
    expect(stats.note).toMatch(/No applicants/)
  })

  it('returns a "no data" note when no row exists for the cell/cycle', () => {
    const stats = computeCellStats(null, 2025, '3.60-3.79', '510-513')
    expect(stats.acceptance_rate).toBeNull()
    expect(stats.note).toMatch(/No pm_facts_grid data/)
  })
})

// ── analyzeProfile orchestration (fake Supabase client, no network) ──────────

type FakeChainState = { eq?: number; ins: Record<string, string[]> }

function makeChain(resolveFn: (state: FakeChainState) => { data: unknown; error: null }) {
  const state: FakeChainState = { ins: {} }
  const chain: any = {
    select() {
      return chain
    },
    eq(_col: string, val: number) {
      state.eq = val
      return chain
    },
    in(col: string, vals: string[]) {
      state.ins[col] = vals
      return chain
    },
    then(onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) {
      return Promise.resolve(resolveFn(state)).then(onFulfilled, onRejected)
    },
  }
  return chain
}

function createFakeSupabase(
  bandRows: { gpa_band: string; mcat_band: string }[],
  cellRowsByYear: Record<number, FactsGridRow[]>
) {
  return {
    from(_table: string) {
      return {
        select(_cols: string) {
          return makeChain(state => {
            if (state.eq === undefined) {
              return { data: bandRows, error: null }
            }
            const rows = (cellRowsByYear[state.eq] ?? []).filter(
              r =>
                (!state.ins.gpa_band || state.ins.gpa_band.includes(r.gpa_band)) &&
                (!state.ins.mcat_band || state.ins.mcat_band.includes(r.mcat_band))
            )
            return { data: rows, error: null }
          })
        },
      }
    },
  } as any
}

function fakeRow(
  cycleYear: number,
  gpaBand: string,
  mcatBand: string,
  applicants: number,
  acceptees: number
): FactsGridRow {
  return {
    cycle_year: cycleYear,
    gpa_band: gpaBand,
    mcat_band: mcatBand,
    applicants,
    applicants_suppressed: false,
    acceptees,
    acceptees_suppressed: false,
  }
}

describe('analyzeProfile', () => {
  const bandRows = GPA_BANDS.flatMap(gpa_band => MCAT_BANDS.map(mcat_band => ({ gpa_band, mcat_band })))

  it('maps the profile, fetches the matched cell + 4 neighbors per cycle, and computes a delta', async () => {
    const cellRowsByYear: Record<number, FactsGridRow[]> = {
      2023: [
        fakeRow(2023, '3.60-3.79', '506-509', 3000, 1200), // main cell (40.0%)
        fakeRow(2023, 'Greater than 3.79', '506-509', 6000, 3000), // gpa up
        fakeRow(2023, '3.40-3.59', '506-509', 4000, 1000), // gpa down
        fakeRow(2023, '3.60-3.79', '510-513', 4000, 2000), // mcat up
        fakeRow(2023, '3.60-3.79', '502-505', 3500, 1000), // mcat down
      ],
      2025: [
        fakeRow(2025, '3.60-3.79', '506-509', 3200, 1600), // main cell (50.0%)
        fakeRow(2025, 'Greater than 3.79', '506-509', 6200, 3200),
        fakeRow(2025, '3.40-3.59', '506-509', 4200, 1100),
        fakeRow(2025, '3.60-3.79', '510-513', 4200, 2200),
        fakeRow(2025, '3.60-3.79', '502-505', 3600, 1100),
      ],
    }
    const supabase = createFakeSupabase(bandRows, cellRowsByYear)

    const result = await analyzeProfile(supabase, { gpa: 3.7, mcat: 508 })

    expect(result.gpa_band).toBe('3.60-3.79')
    expect(result.mcat_band).toBe('506-509')
    expect(result.neighborBands).toEqual({
      gpaUp: 'Greater than 3.79',
      gpaDown: '3.40-3.59',
      mcatUp: '510-513',
      mcatDown: '502-505',
    })

    expect(result.cycles).toHaveLength(2)
    const [cycle2023, cycle2025] = result.cycles
    expect(cycle2023.mainCell.acceptance_rate).toBe(40.0)
    expect(cycle2025.mainCell.acceptance_rate).toBe(50.0)
    expect(cycle2023.neighbors.gpaUp?.acceptance_rate).toBe(50.0)
    expect(cycle2023.neighbors.mcatDown?.acceptance_rate).toBeCloseTo(28.6, 1)

    expect(result.delta).not.toBeNull()
    expect(result.delta?.from_cycle_year).toBe(2023)
    expect(result.delta?.to_cycle_year).toBe(2025)
    expect(result.delta?.acceptance_rate_delta).toBe(10.0)
  })

  it('rejects an out-of-range profile before touching the database', async () => {
    const supabase = createFakeSupabase(bandRows, {})
    await expect(analyzeProfile(supabase, { gpa: 4.5, mcat: 508 })).rejects.toThrow()
    await expect(analyzeProfile(supabase, { gpa: 3.6, mcat: 300 })).rejects.toThrow()
  })
})
