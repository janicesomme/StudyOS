import { describe, it, expect } from 'vitest'
import { parseActivityAddArgs, parseAnalyzeArgs, parseCreateArgs, parseShowArgs } from '../profile-cli.js'

describe('parseCreateArgs', () => {
  it('parses required + optional flags', () => {
    expect(
      parseCreateArgs(['--user', 'abc', '--gpa', '3.6', '--mcat', '508', '--state', 'LA', '--grad-year', '2027', '--gap-years', '0'])
    ).toEqual({ user: 'abc', gpa: 3.6, mcat: 508, state: 'LA', gradYear: 2027, gapYears: 0 })
  })

  it('omits optional flags when not passed', () => {
    expect(parseCreateArgs(['--user', 'abc', '--gpa', '3.6', '--mcat', '508'])).toEqual({
      user: 'abc',
      gpa: 3.6,
      mcat: 508,
      state: undefined,
      gradYear: undefined,
      gapYears: undefined,
    })
  })

  it('throws when --user is missing', () => {
    expect(() => parseCreateArgs(['--gpa', '3.6', '--mcat', '508'])).toThrow(/Missing required --user/)
  })

  it('throws when --gpa is not a number', () => {
    expect(() => parseCreateArgs(['--user', 'abc', '--gpa', 'x', '--mcat', '508'])).toThrow(/--gpa must be a number/)
  })
})

describe('parseAnalyzeArgs', () => {
  it('parses --user', () => {
    expect(parseAnalyzeArgs(['--user', 'abc'])).toEqual({ user: 'abc' })
  })

  it('throws when --user is missing', () => {
    expect(() => parseAnalyzeArgs([])).toThrow(/Missing required --user/)
  })
})

describe('parseActivityAddArgs', () => {
  it('parses required + optional flags', () => {
    expect(
      parseActivityAddArgs(['--user', 'abc', '--category', 'clinical_volunteer', '--hours', '120', '--planned', '200', '--description', 'ER shifts'])
    ).toEqual({ user: 'abc', category: 'clinical_volunteer', hours: 120, planned: 200, description: 'ER shifts' })
  })

  it('throws when --category is missing', () => {
    expect(() => parseActivityAddArgs(['--user', 'abc', '--hours', '120'])).toThrow(/Missing required --category/)
  })

  it('throws when --hours is not a number', () => {
    expect(() => parseActivityAddArgs(['--user', 'abc', '--category', 'research', '--hours', 'x'])).toThrow(
      /--hours must be a number/
    )
  })
})

describe('parseShowArgs', () => {
  it('parses --user, defaulting --baselines to "static"', () => {
    expect(parseShowArgs(['--user', 'abc'])).toEqual({ user: 'abc', baselines: 'static' })
  })

  it('parses an explicit --baselines live', () => {
    expect(parseShowArgs(['--user', 'abc', '--baselines', 'live'])).toEqual({ user: 'abc', baselines: 'live' })
  })

  it('parses an explicit --baselines static', () => {
    expect(parseShowArgs(['--user', 'abc', '--baselines', 'static'])).toEqual({ user: 'abc', baselines: 'static' })
  })

  it('throws when --user is missing', () => {
    expect(() => parseShowArgs([])).toThrow(/Missing required --user/)
  })

  it('throws on an invalid --baselines value', () => {
    expect(() => parseShowArgs(['--user', 'abc', '--baselines', 'bogus'])).toThrow(/--baselines must be "live" or "static"/)
  })
})
