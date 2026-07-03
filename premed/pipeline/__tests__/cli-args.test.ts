import { describe, it, expect } from 'vitest'
import { flagPresent, optionalNumber, parseFlags, requireNumber, requireString } from '../cli-args.js'

describe('parseFlags — boolean flags', () => {
  it('treats a flag with no following value as boolean true, without swallowing the next flag', () => {
    const flags = parseFlags(['--consent', '--user', 'abc'])
    expect(flags.get('consent')).toBe('true')
    expect(flags.get('user')).toBe('abc')
  })

  it('treats a trailing flag with nothing after it as boolean true', () => {
    const flags = parseFlags(['--user', 'abc', '--consent'])
    expect(flags.get('consent')).toBe('true')
  })

  it('still parses a normal "--flag value" pair correctly', () => {
    const flags = parseFlags(['--gpa', '3.6'])
    expect(flags.get('gpa')).toBe('3.6')
  })

  it('still parses "--flag=value" form correctly', () => {
    const flags = parseFlags(['--gpa=3.6'])
    expect(flags.get('gpa')).toBe('3.6')
  })
})

describe('flagPresent', () => {
  it('is true for a bare boolean flag', () => {
    expect(flagPresent(parseFlags(['--consent']), 'consent')).toBe(true)
  })

  it('is true for --flag=true', () => {
    expect(flagPresent(parseFlags(['--consent=true']), 'consent')).toBe(true)
  })

  it('is false for --flag=false', () => {
    expect(flagPresent(parseFlags(['--consent=false']), 'consent')).toBe(false)
  })

  it('is false when the flag is absent', () => {
    expect(flagPresent(parseFlags([]), 'consent')).toBe(false)
  })
})

describe('requireString / requireNumber / optionalNumber — unaffected by the boolean-flag fix', () => {
  it('requireString still throws when missing', () => {
    expect(() => requireString(parseFlags([]), 'user')).toThrow(/Missing required --user/)
  })

  it('requireNumber still parses a normal value', () => {
    expect(requireNumber(parseFlags(['--mcat', '512']), 'mcat')).toBe(512)
  })

  it('optionalNumber returns undefined when absent', () => {
    expect(optionalNumber(parseFlags([]), 'grad-year')).toBeUndefined()
  })
})
