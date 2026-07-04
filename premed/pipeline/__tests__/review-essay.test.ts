import { describe, it, expect } from 'vitest'
import { parseReviewEssayArgs } from '../review-essay.js'

describe('parseReviewEssayArgs', () => {
  it('parses required --user and --file plus optional --school', () => {
    expect(parseReviewEssayArgs(['--user', 'abc', '--file', 'draft.txt', '--school', 'Tulane'])).toEqual({
      user: 'abc',
      file: 'draft.txt',
      school: 'Tulane',
      go: false,
    })
  })

  it('omits --school when not passed', () => {
    expect(parseReviewEssayArgs(['--user', 'abc', '--file', 'draft.txt'])).toEqual({
      user: 'abc',
      file: 'draft.txt',
      school: undefined,
      go: false,
    })
  })

  it('parses a trailing --go boolean flag', () => {
    expect(parseReviewEssayArgs(['--user', 'abc', '--file', 'draft.txt', '--go'])).toEqual({
      user: 'abc',
      file: 'draft.txt',
      school: undefined,
      go: true,
    })
  })

  it('throws when --user is missing', () => {
    expect(() => parseReviewEssayArgs(['--file', 'draft.txt'])).toThrow(/Missing required --user/)
  })

  it('throws when --file is missing', () => {
    expect(() => parseReviewEssayArgs(['--user', 'abc'])).toThrow(/Missing required --file/)
  })
})
