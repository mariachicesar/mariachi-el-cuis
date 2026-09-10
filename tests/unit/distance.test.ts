// tests/unit/distance.test.ts
import { expect, test } from 'vitest'
import { haversineMiles } from '@/lib/geo/distance'

test('zero distance for identical points', () => {
  expect(haversineMiles({ lat: 34, lng: -118 }, { lat: 34, lng: -118 })).toBe(0)
})

test('90011 base to Downey is roughly 8 miles', () => {
  const d = haversineMiles({ lat: 34.0074, lng: -118.2587 }, { lat: 33.9401, lng: -118.1332 })
  expect(d).toBeGreaterThan(7)
  expect(d).toBeLessThan(11)
})
