import { expect, test } from 'vitest'
import { laDayBoundsUtc, laWallTimeToUtc, utcToLaMinutesOfDay, weekdayIndexOf } from './timezone'

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

test('utcToLaMinutesOfDay converts a UTC instant to LA minutes-since-midnight for a given date', () => {
  // 2026-01-03 17:00 PST (winter, UTC-8) = 2026-01-04T01:00:00Z
  expect(utcToLaMinutesOfDay(new Date('2026-01-04T01:00:00.000Z'), '2026-01-03')).toBe(17 * 60)
})

test('utcToLaMinutesOfDay clamps to [0, 1440] when the instant falls outside the given date', () => {
  expect(utcToLaMinutesOfDay(new Date('2026-01-02T00:00:00.000Z'), '2026-01-03')).toBe(0)
  expect(utcToLaMinutesOfDay(new Date('2026-01-06T00:00:00.000Z'), '2026-01-03')).toBe(1440)
})

test('laDayBoundsUtc returns the UTC instants bounding an LA-local calendar day', () => {
  const { startUtc, endUtc } = laDayBoundsUtc('2026-01-03')
  expect(startUtc.toISOString()).toBe('2026-01-03T08:00:00.000Z') // 2026-01-03 00:00 PST
  expect(endUtc.toISOString()).toBe('2026-01-04T08:00:00.000Z') // 2026-01-04 00:00 PST
})

test('laDayBoundsUtc handles a month rollover', () => {
  const { endUtc } = laDayBoundsUtc('2026-01-31')
  expect(endUtc.toISOString()).toBe('2026-02-01T08:00:00.000Z')
})
