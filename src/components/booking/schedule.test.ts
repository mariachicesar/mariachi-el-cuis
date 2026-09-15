import { expect, test } from 'vitest'
import {
  DEBOUNCE_MS,
  effectDelayMs,
  formatTime12Hour,
  weekendStartTimes,
  minimumDurationForTime,
  sevenSongsAvailableForTime,
  slotDurationHours,
} from './schedule'

test('debounces the fetch path but resets on the next tick, not after the debounce', () => {
  // Regression test for task-14's fix round: when a previously-valid quote
  // is showing and the input becomes invalid (e.g. the address is
  // cleared), the wizard must clear the stale quote/availability display
  // essentially immediately — not wait out the same debounce used for the
  // price-quote/availability fetch. `effectDelayMs(false)` (the reset path)
  // must return a materially shorter delay than `effectDelayMs(true)` (the
  // fetch path).
  expect(effectDelayMs(true)).toBe(DEBOUNCE_MS)
  expect(effectDelayMs(false)).toBe(0)
  expect(effectDelayMs(false)).toBeLessThan(effectDelayMs(true))
})

test('Saturday seven-song package is only offered from 7am to 10am', () => {
  expect(sevenSongsAvailableForTime('2026-01-03', '06:59')).toBe(false)
  expect(sevenSongsAvailableForTime('2026-01-03', '07:00')).toBe(true)
  expect(sevenSongsAvailableForTime('2026-01-03', '09:59')).toBe(true)
  expect(sevenSongsAvailableForTime('2026-01-03', '10:00')).toBe(false)
  expect(sevenSongsAvailableForTime('2026-01-04', '20:00')).toBe(true)
})

test('Saturday peak requires two hours and other Saturday bands require one', () => {
  expect(minimumDurationForTime('2026-01-03', '14:59')).toBe(1)
  expect(minimumDurationForTime('2026-01-03', '15:00')).toBe(2)
  expect(minimumDurationForTime('2026-01-03', '21:29')).toBe(2)
  expect(minimumDurationForTime('2026-01-03', '21:30')).toBe(1)
})

test('suggested slot duration is derived from its start and end', () => {
  expect(slotDurationHours('17:00', '19:00')).toBe(2)
  expect(slotDurationHours('21:30', '22:30')).toBe(1)
})

test('Saturday start choices use half-hour increments without arbitrary minutes', () => {
  const times = weekendStartTimes('2026-01-03')
  expect(times).toContain('07:00')
  expect(times).toContain('14:30')
  expect(times).toContain('15:00')
  expect(times).toContain('15:30')
  expect(times).toContain('21:00')
  expect(times).toContain('21:30')
  expect(times).toContain('23:00')
  expect(times).not.toContain('23:30')
  expect(times).not.toContain('17:01')
})

test('Sunday start choices run from 8am to 11pm in half-hour increments', () => {
  const times = weekendStartTimes('2026-01-04')
  expect(times[0]).toBe('08:00')
  expect(times).toContain('08:30')
  expect(times.at(-1)).toBe('23:00')
})

test('formats schedule times in a 12-hour clock', () => {
  expect(formatTime12Hour('07:00')).toBe('7:00 AM')
  expect(formatTime12Hour('12:30')).toBe('12:30 PM')
  expect(formatTime12Hour('17:30')).toBe('5:30 PM')
  expect(formatTime12Hour('00:00')).toBe('12:00 AM')
})
