import { describe, it, expect } from 'vitest'
import { RUBRIC_DIMENSIONS, RUBRIC_DIMENSION_KEYS, RED_FLAGS, RED_FLAG_KEYS, getRubricDimensions } from '../rubrics.js'

describe('RUBRIC_DIMENSIONS', () => {
  it('has one entry per declared key, each with 5 anchors and adcom notes', () => {
    for (const key of RUBRIC_DIMENSION_KEYS) {
      const dim = RUBRIC_DIMENSIONS[key]
      expect(dim).toBeDefined()
      expect(dim.key).toBe(key)
      expect(dim.anchors).toHaveLength(5)
      expect(dim.name.length).toBeGreaterThan(0)
      expect(dim.description.length).toBeGreaterThan(0)
      expect(dim.adcomNotes.length).toBeGreaterThan(0)
      for (const anchor of dim.anchors) expect(anchor.length).toBeGreaterThan(0)
    }
  })

  it('marks mission_fit as the only optional dimension', () => {
    const optionalKeys = RUBRIC_DIMENSION_KEYS.filter(k => RUBRIC_DIMENSIONS[k].optional)
    expect(optionalKeys).toEqual(['mission_fit'])
  })
})

describe('getRubricDimensions', () => {
  it('excludes mission_fit when includeMissionFit is false', () => {
    const dims = getRubricDimensions(false)
    expect(dims.some(d => d.key === 'mission_fit')).toBe(false)
    expect(dims).toHaveLength(RUBRIC_DIMENSION_KEYS.length - 1)
  })

  it('includes mission_fit when includeMissionFit is true', () => {
    const dims = getRubricDimensions(true)
    expect(dims.some(d => d.key === 'mission_fit')).toBe(true)
    expect(dims).toHaveLength(RUBRIC_DIMENSION_KEYS.length)
  })
})

describe('RED_FLAGS', () => {
  it('has one entry per declared key, each with a non-empty name and description', () => {
    for (const key of RED_FLAG_KEYS) {
      const flag = RED_FLAGS[key]
      expect(flag).toBeDefined()
      expect(flag.name.length).toBeGreaterThan(0)
      expect(flag.description.length).toBeGreaterThan(0)
    }
  })
})
