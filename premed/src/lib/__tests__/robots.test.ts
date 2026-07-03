import { describe, it, expect } from 'vitest'
import { isPathAllowed, parseDisallowedPaths } from '../robots.js'

const SIMPLE_ROBOTS = `
User-agent: *
Disallow: /admin/
Disallow: /private
`

const MULTI_BLOCK_ROBOTS = `
User-agent: GoogleBot
Disallow: /google-only/

User-agent: *
Disallow: /everyone/
`

const ALLOW_ALL_ROBOTS = `
User-agent: *
Disallow:
`

describe('parseDisallowedPaths', () => {
  it('collects Disallow rules under a wildcard User-agent block', () => {
    expect(parseDisallowedPaths(SIMPLE_ROBOTS)).toEqual(['/admin/', '/private'])
  })

  it('only applies a specific agent block to that agent, not "*" lookups', () => {
    expect(parseDisallowedPaths(MULTI_BLOCK_ROBOTS, '*')).toEqual(['/everyone/'])
  })

  it('an empty Disallow value means nothing is blocked', () => {
    expect(parseDisallowedPaths(ALLOW_ALL_ROBOTS)).toEqual([])
  })

  it('returns an empty list for a blank robots.txt', () => {
    expect(parseDisallowedPaths('')).toEqual([])
  })
})

describe('isPathAllowed', () => {
  it('blocks a path under a disallowed prefix', () => {
    expect(isPathAllowed(SIMPLE_ROBOTS, '/admin/dashboard')).toBe(false)
    expect(isPathAllowed(SIMPLE_ROBOTS, '/private')).toBe(false)
  })

  it('allows a path outside any disallowed prefix', () => {
    expect(isPathAllowed(SIMPLE_ROBOTS, '/admissions/class-profile')).toBe(true)
  })

  it('allows everything when robots.txt has no rules at all', () => {
    expect(isPathAllowed('', '/anything')).toBe(true)
  })
})
