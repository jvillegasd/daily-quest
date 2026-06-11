import { describe, it, expect } from 'vitest'
import {
  getLevelFromPoints,
  getPointsForLevel,
  getLevelName,
  DEFAULT_CATEGORIES,
} from '@/lib/types'

describe('getPointsForLevel', () => {
  it('returns 100 for level 1', () => expect(getPointsForLevel(1)).toBe(100))
  it('returns 400 for level 2', () => expect(getPointsForLevel(2)).toBe(400))
  it('returns 900 for level 3', () => expect(getPointsForLevel(3)).toBe(900))
  it('returns 250000 for level 50', () => expect(getPointsForLevel(50)).toBe(250000))
})

describe('getLevelFromPoints', () => {
  it('returns level 1 at 0 points', () => expect(getLevelFromPoints(0)).toBe(1))
  it('returns level 1 at 99 points (just below threshold)', () => expect(getLevelFromPoints(99)).toBe(1))
  it('returns level 1 at 399 points (just below level 2)', () => expect(getLevelFromPoints(399)).toBe(1))
  it('returns level 2 at exactly 400 points', () => expect(getLevelFromPoints(400)).toBe(2))
  it('returns level 2 at 899 points (just below level 3)', () => expect(getLevelFromPoints(899)).toBe(2))
  it('returns level 3 at exactly 900 points', () => expect(getLevelFromPoints(900)).toBe(3))
  it('caps at level 50', () => expect(getLevelFromPoints(999999)).toBe(50))
  it('returns level 50 at exactly 250000 points', () => expect(getLevelFromPoints(250000)).toBe(50))

  it('is consistent with getPointsForLevel (round-trip for all levels 1-50)', () => {
    for (let l = 1; l <= 50; l++) {
      expect(getLevelFromPoints(getPointsForLevel(l))).toBe(l)
    }
  })
})

describe('getLevelName', () => {
  it('returns Novice at level 1', () => expect(getLevelName(1)).toBe('Novice'))
  it('returns Apprentice at level 2', () => expect(getLevelName(2)).toBe('Apprentice'))
  it('returns Knight at level 10', () => expect(getLevelName(10)).toBe('Knight'))
  it('returns Knight at level 14 (between milestones)', () => expect(getLevelName(14)).toBe('Knight'))
  it('returns Ranger at level 15', () => expect(getLevelName(15)).toBe('Ranger'))
  it('returns Legendary Hero at level 50', () => expect(getLevelName(50)).toBe('Legendary Hero'))
  it('returns Overlord at level 45', () => expect(getLevelName(45)).toBe('Overlord'))
  it('returns Overlord at level 49 (just below 50)', () => expect(getLevelName(49)).toBe('Overlord'))
})

describe('DEFAULT_CATEGORIES', () => {
  it('has exactly 7 categories', () => expect(DEFAULT_CATEGORIES).toHaveLength(7))
  it('all categories have required fields', () => {
    for (const cat of DEFAULT_CATEGORIES) {
      expect(cat).toHaveProperty('name')
      expect(cat).toHaveProperty('icon')
      expect(cat).toHaveProperty('color')
      expect(cat).toHaveProperty('defaultPoints')
      expect(cat.defaultPoints).toBeGreaterThan(0)
    }
  })
  it('contains Chores, Health, Work, Kids, Finance, Self-care, Errands', () => {
    const names = DEFAULT_CATEGORIES.map((c) => c.name)
    expect(names).toContain('Chores')
    expect(names).toContain('Health')
    expect(names).toContain('Work')
    expect(names).toContain('Kids')
    expect(names).toContain('Finance')
    expect(names).toContain('Self-care')
    expect(names).toContain('Errands')
  })
})
