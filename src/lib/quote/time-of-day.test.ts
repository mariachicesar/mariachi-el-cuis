import { expect, test } from 'vitest'
import { minutesOf, formatMinutes } from './time-of-day'

test('minutesOf converts "HH:mm" to minutes since midnight', () => {
  expect(minutesOf('00:00')).toBe(0)
  expect(minutesOf('07:00')).toBe(420)
  expect(minutesOf('15:30')).toBe(930)
  expect(minutesOf('24:00')).toBe(1440)
})

test('formatMinutes converts minutes since midnight back to "HH:mm"', () => {
  expect(formatMinutes(0)).toBe('00:00')
  expect(formatMinutes(420)).toBe('07:00')
  expect(formatMinutes(930)).toBe('15:30')
  expect(formatMinutes(1440)).toBe('24:00')
})

test('formatMinutes clamps out-of-range input to the day bounds', () => {
  expect(formatMinutes(-5)).toBe('00:00')
  expect(formatMinutes(1500)).toBe('24:00')
})
