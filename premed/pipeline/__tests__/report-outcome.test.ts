import { describe, it, expect } from 'vitest'
import { parseReportOutcomeArgs } from '../report-outcome.js'

describe('parseReportOutcomeArgs', () => {
  it('parses required flags plus a trailing --consent boolean flag', () => {
    expect(
      parseReportOutcomeArgs([
        '--user',
        'abc',
        '--cycle-year',
        '2026',
        '--schools-applied',
        '15',
        '--interviews',
        '4',
        '--acceptances',
        '2',
        '--consent',
      ])
    ).toEqual({
      user: 'abc',
      cycleYear: 2026,
      schoolsApplied: 15,
      interviews: 4,
      acceptances: 2,
      matriculatedSchoolId: null,
      consent: true,
    })
  })

  it('parses --consent in the middle without swallowing the next flag', () => {
    const args = parseReportOutcomeArgs([
      '--user',
      'abc',
      '--consent',
      '--cycle-year',
      '2026',
      '--schools-applied',
      '15',
      '--interviews',
      '4',
      '--acceptances',
      '2',
    ])
    expect(args.consent).toBe(true)
    expect(args.cycleYear).toBe(2026)
  })

  it('defaults consent to false when the flag is omitted', () => {
    const args = parseReportOutcomeArgs([
      '--user',
      'abc',
      '--cycle-year',
      '2026',
      '--schools-applied',
      '15',
      '--interviews',
      '4',
      '--acceptances',
      '2',
    ])
    expect(args.consent).toBe(false)
  })

  it('parses an optional --matriculated-school', () => {
    const args = parseReportOutcomeArgs([
      '--user',
      'abc',
      '--cycle-year',
      '2026',
      '--schools-applied',
      '15',
      '--interviews',
      '4',
      '--acceptances',
      '2',
      '--matriculated-school',
      'school-uuid',
      '--consent',
    ])
    expect(args.matriculatedSchoolId).toBe('school-uuid')
  })

  it('throws when --user is missing', () => {
    expect(() => parseReportOutcomeArgs(['--cycle-year', '2026'])).toThrow(/Missing required --user/)
  })
})
