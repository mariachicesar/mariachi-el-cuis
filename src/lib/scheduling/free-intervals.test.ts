import { expect, test } from 'vitest'
import { freeIntervals, validateSaturdaySlot, validateSimpleSlot } from './free-intervals'
import { saturdayMinimumMinutesForStart as minimumMinutesForStart } from './saturday-tiers'

const DAY_WINDOW = { startMin: 420, endMin: 1440 } // 07:00-24:00

test('freeIntervals with no busy blocks returns the whole day window', () => {
  expect(freeIntervals(DAY_WINDOW, [], 30)).toEqual([{ startMin: 420, endMin: 1440 }])
})

test('freeIntervals pads a busy block by the travel buffer on both sides', () => {
  const busy = [{ startMin: 1020, endMin: 1140 }] // 17:00-19:00
  expect(freeIntervals(DAY_WINDOW, busy, 30)).toEqual([
    { startMin: 420, endMin: 990 }, // 07:00-16:30
    { startMin: 1170, endMin: 1440 }, // 19:30-24:00
  ])
})

test('freeIntervals merges overlapping padded busy blocks', () => {
  const busy = [
    { startMin: 600, endMin: 660 }, // 10:00-11:00 -> padded 09:30-11:30
    { startMin: 700, endMin: 760 }, // 11:40-12:40 -> padded 11:10-13:10 (overlaps the first)
  ]
  expect(freeIntervals(DAY_WINDOW, busy, 30)).toEqual([
    { startMin: 420, endMin: 570 },
    { startMin: 790, endMin: 1440 },
  ])
})

test('validateSaturdaySlot: empty day, on-hour peak request is accepted', () => {
  const free = freeIntervals(DAY_WINDOW, [], 30)
  const result = validateSaturdaySlot({ startMin: 1020, endMin: 1140 }, free, true, minimumMinutesForStart) // 17:00-19:00
  expect(result).toEqual({ ok: true })
})

test('validateSaturdaySlot: empty day, off-hour peak request is rejected with on-hour suggestions', () => {
  const free = freeIntervals(DAY_WINDOW, [], 30)
  const result = validateSaturdaySlot({ startMin: 1035, endMin: 1155 }, free, true, minimumMinutesForStart) // 17:15-19:15
  expect(result).toMatchObject({ ok: false, reason: 'not_on_hour' })
  expect((result as { suggestions: unknown }).suggestions).toEqual([
    { startTime: '17:00', endTime: '19:00' },
    { startTime: '18:00', endTime: '20:00' },
  ])
})

test('validateSaturdaySlot: 5-7pm booked, 8-9pm request is rejected with gap-adjacent suggestions', () => {
  const free = freeIntervals(DAY_WINDOW, [{ startMin: 1020, endMin: 1140 }], 30) // 17:00-19:00 booked
  const result = validateSaturdaySlot({ startMin: 1200, endMin: 1260 }, free, false, minimumMinutesForStart) // 20:00-21:00
  expect(result).toMatchObject({ ok: false, reason: 'below_minimum' })
  // Nearest-after is the request's own start with the 2h peak minimum applied;
  // nearest-before hugs the padded booking.
  expect((result as { suggestions: unknown }).suggestions).toEqual([
    { startTime: '19:30', endTime: '21:30' },
    { startTime: '20:00', endTime: '22:00' },
  ])
})

// User scenario: 3:00-5:00pm booked (peak), request 3:00pm for 2h.
// Suggestions should pack around the booking: 12:30pm (ends 2:30pm, right at
// the padded block edge; its 15:00 peak minimum is why it's 2h long) and
// 5:30pm (right after the booking, 2h peak minimum).
test('validateSaturdaySlot: 3-5pm booked, 3pm request suggests adjacent slots', () => {
  const free = freeIntervals(DAY_WINDOW, [{ startMin: 900, endMin: 1020 }], 30) // 15:00-17:00 booked
  const result = validateSaturdaySlot({ startMin: 900, endMin: 1020 }, free, false, minimumMinutesForStart)
  expect(result).toMatchObject({ ok: false, reason: 'conflict' })
  expect((result as { suggestions: unknown }).suggestions).toEqual([
    { startTime: '12:30', endTime: '14:30' },
    { startTime: '17:30', endTime: '19:30' },
  ])
})

test('validateSaturdaySlot: 10am-3pm request below the 1h minimum is rejected', () => {
  const free = freeIntervals(DAY_WINDOW, [], 30)
  const result = validateSaturdaySlot({ startMin: 660, endMin: 690 }, free, true, minimumMinutesForStart) // 11:00-11:30
  expect(result).toMatchObject({ ok: false, reason: 'below_minimum' })
})

test('validateSaturdaySlot: a fully booked day is rejected without throwing', () => {
  const free = freeIntervals(DAY_WINDOW, [{ startMin: 420, endMin: 1440 }], 0)
  const result = validateSaturdaySlot({ startMin: 1020, endMin: 1140 }, free, false, minimumMinutesForStart)
  expect(result.ok).toBe(false)
})

test('validateSimpleSlot: fits a free interval', () => {
  const free = freeIntervals(DAY_WINDOW, [], 30)
  expect(validateSimpleSlot({ startMin: 480, endMin: 600 }, free)).toEqual({ ok: true })
})

test('validateSimpleSlot: conflicts with a padded busy block', () => {
  const free = freeIntervals(DAY_WINDOW, [{ startMin: 480, endMin: 600 }], 30)
  expect(validateSimpleSlot({ startMin: 510, endMin: 570 }, free)).toMatchObject({ ok: false, reason: 'conflict' })
})

test('validateSimpleSlot: conflict suggests the nearest windows before and after', () => {
  // 08:00-10:00 busy, padded to 07:30-10:30; request 10:00-12:00 (conflicts with the pad)
  const free = freeIntervals(DAY_WINDOW, [{ startMin: 480, endMin: 600 }], 30)
  const result = validateSimpleSlot({ startMin: 600, endMin: 720 }, free)
  expect(result).toEqual({
    ok: false,
    reason: 'conflict',
    suggestions: [{ startTime: '10:30', endTime: '12:30' }],
  })
})

test('validateSimpleSlot: conflict with no fitting window returns no suggestions', () => {
  const free = freeIntervals(DAY_WINDOW, [{ startMin: 420, endMin: 1440 }], 0)
  expect(validateSimpleSlot({ startMin: 480, endMin: 600 }, free)).toEqual({
    ok: false,
    reason: 'conflict',
    suggestions: [],
  })
})
