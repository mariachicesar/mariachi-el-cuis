import { expect, test } from 'vitest'
import { isMauiTripOver, MAUI_PATHS } from '@/lib/data/maui'

test('the Maui page stays up through the end of Dec 8 in Hawaii time', () => {
  // 23:59 HST on Dec 8 = 09:59 UTC on Dec 9
  expect(isMauiTripOver(new Date('2026-12-09T09:59:00Z'))).toBe(false)
  expect(isMauiTripOver(new Date('2026-12-05T20:00:00Z'))).toBe(false)
})

test('the Maui page is over from midnight Dec 9 in Hawaii time', () => {
  expect(isMauiTripOver(new Date('2026-12-09T10:00:00Z'))).toBe(true)
  expect(isMauiTripOver(new Date('2027-01-15T00:00:00Z'))).toBe(true)
})

test('Maui paths cover both locales', () => {
  expect(MAUI_PATHS).toEqual({ es: '/hawaii', en: '/en/hawaii' })
})
