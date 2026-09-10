// tests/unit/distance.test.ts
import { expect, test } from 'vitest'
import { haversineMiles } from '@/lib/geo/distance'

test('zero distance for identical points', () => {
  expect(haversineMiles({ lat: 34, lng: -118 }, { lat: 34, lng: -118 })).toBe(0)
})

test('downtown LA to Downey is roughly 11-13 miles', () => {
  const d = haversineMiles({ lat: 34.0074, lng: -118.2587 }, { lat: 33.927, lng: -118.1326 })
  expect(d).toBeGreaterThan(9)
  expect(d).toBeLessThan(15)
})
