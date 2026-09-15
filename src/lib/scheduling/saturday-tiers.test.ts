import { expect, test } from 'vitest'
import {
  saturdayTimeTierMinHours,
  isSaturdayPeakStart,
  SATURDAY_TIER_BOUNDARIES_MIN,
} from './saturday-tiers'

test('serenata window (before 10am) has no tier minimum', () => {
  expect(saturdayTimeTierMinHours(0)).toBe(0)
  expect(saturdayTimeTierMinHours(420)).toBe(0) // 07:00
  expect(saturdayTimeTierMinHours(599)).toBe(0) // 09:59
})

test('midday tier (10am-3pm) is a 1h minimum', () => {
  expect(saturdayTimeTierMinHours(600)).toBe(1) // 10:00
  expect(saturdayTimeTierMinHours(899)).toBe(1) // 14:59
})

test('peak tier (3pm-9:30pm) is a 2h minimum', () => {
  expect(saturdayTimeTierMinHours(900)).toBe(2) // 15:00
  expect(saturdayTimeTierMinHours(1289)).toBe(2) // 21:29
})

test('late tier (9:30pm+) is a 1h minimum', () => {
  expect(saturdayTimeTierMinHours(1290)).toBe(1) // 21:30
  expect(saturdayTimeTierMinHours(1439)).toBe(1) // 23:59
})

test('isSaturdayPeakStart is true only within [15:00, 21:30)', () => {
  expect(isSaturdayPeakStart(899)).toBe(false)
  expect(isSaturdayPeakStart(900)).toBe(true)
  expect(isSaturdayPeakStart(1289)).toBe(true)
  expect(isSaturdayPeakStart(1290)).toBe(false)
})

test('tier boundaries are 10am/3pm/9:30pm in minutes', () => {
  expect(SATURDAY_TIER_BOUNDARIES_MIN).toEqual([600, 900, 1290])
})
