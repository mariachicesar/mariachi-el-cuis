import { expect, test } from 'vitest'
import { laWallTimeToUtc, weekdayIndexOf } from './timezone'

test('converts an LA summer (PDT, UTC-7) wall time to UTC', () => {
  expect(laWallTimeToUtc('2026-07-15', '15:00').toISOString()).toBe('2026-07-15T22:00:00.000Z')
})

test('converts an LA winter (PST, UTC-8) wall time to UTC', () => {
  expect(laWallTimeToUtc('2026-01-15', '15:00').toISOString()).toBe('2026-01-15T23:00:00.000Z')
})

test('weekdayIndexOf: 2026-01-01 is a Thursday', () => {
  // 2024-01-01 was a Monday (leap year, 366 days -> +2 weekdays to 2025-01-01 Wed);
  // 2025 has 365 days -> +1 weekday to 2026-01-01 Thursday.
  expect(weekdayIndexOf('2026-01-01')).toBe(4)
})

test('weekdayIndexOf: 2026-01-03/04 are Saturday/Sunday', () => {
  expect(weekdayIndexOf('2026-01-03')).toBe(6)
  expect(weekdayIndexOf('2026-01-04')).toBe(0)
})
