// tests/unit/cities.test.ts
import { expect, test } from 'vitest'
import { CITIES, cityDistanceMi, getCity } from '@/lib/data/cities'

test('15-25 cities, all fields present, slugs unique', () => {
  expect(CITIES.length).toBeGreaterThanOrEqual(15)
  expect(CITIES.length).toBeLessThanOrEqual(25)
  const slugs = new Set(CITIES.map((c) => c.slug))
  expect(slugs.size).toBe(CITIES.length)
  for (const c of CITIES) {
    expect(c.slug).toMatch(/^[a-z-]+$/)
    expect(c.name.length).toBeGreaterThan(1)
    expect(c.blurb.es.length).toBeGreaterThan(40)
    expect(c.blurb.en.length).toBeGreaterThan(40)
    expect(Math.abs(c.lat)).toBeGreaterThan(0)
  }
})

test('every city is within ~35 miles of base (sanity)', () => {
  for (const c of CITIES) expect(cityDistanceMi(c)).toBeLessThan(35)
})

test('getCity', () => {
  expect(getCity('downey')?.name).toBe('Downey')
  expect(getCity('nope')).toBeUndefined()
})
