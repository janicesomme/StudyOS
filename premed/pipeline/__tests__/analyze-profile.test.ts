import { describe, it, expect } from 'vitest'
import { parseCliArgs } from '../analyze-profile.js'

describe('parseCliArgs', () => {
  it('parses space-separated flags', () => {
    expect(parseCliArgs(['--gpa', '3.6', '--mcat', '508'])).toEqual({ gpa: 3.6, mcat: 508 })
  })

  it('parses "=" flags', () => {
    expect(parseCliArgs(['--gpa=3.6', '--mcat=508'])).toEqual({ gpa: 3.6, mcat: 508 })
  })

  it('throws when --gpa is missing', () => {
    expect(() => parseCliArgs(['--mcat', '508'])).toThrow(/Missing required --gpa/)
  })

  it('throws when --mcat is missing', () => {
    expect(() => parseCliArgs(['--gpa', '3.6'])).toThrow(/Missing required --mcat/)
  })

  it('throws when a value is not a number', () => {
    expect(() => parseCliArgs(['--gpa', 'abc', '--mcat', '508'])).toThrow(/--gpa must be a number/)
  })
})
