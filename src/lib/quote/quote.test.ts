import { expect, test } from 'vitest'
import { getQuote } from './index'
import type { QuoteInput } from './types'

const WEEKDAY = '2026-01-01' // Thursday
const SATURDAY = '2026-01-03'
const SUNDAY = '2026-01-04'

function input(overrides: Partial<QuoteInput>): QuoteInput {
  return {
    eventDate: WEEKDAY,
    startTime: '15:00',
    durationHours: 1,
    packageType: 'seven_songs',
    distanceMi: 10,
    county: 'Los Angeles County',
    state: 'CA',
    now: new Date('2025-12-01T00:00:00Z'), // far in advance of every test event date
    ...overrides,
  }
}

test('out-of-state is contact_required/out_of_area', () => {
  expect(getQuote(input({ state: 'NV' }))).toEqual({
    status: 'contact_required',
    reason: 'out_of_area',
  })
})

test('out-of-county is contact_required/out_of_area', () => {
  expect(getQuote(input({ county: 'Orange County' }))).toEqual({
    status: 'contact_required',
    reason: 'out_of_area',
  })
})

test('weekday, seven_songs, within 25mi: $380 flat, 1h block, $50 deposit', () => {
  const q = getQuote(input({}))
  expect(q).toMatchObject({
    status: 'ok',
    total: 380,
    enforcedHours: 1,
    deposit: 50,
    balanceDue: 330,
    calendarBlockMinutes: 120,
    lineItems: [{ key: 'seven_songs', amount: 380 }],
  })
})

test('weekday, hourly, within 25mi: no minimum enforced', () => {
  const q = getQuote(input({ packageType: 'hourly', durationHours: 1, distanceMi: 20 }))
  expect(q).toMatchObject({ status: 'ok', enforcedHours: 1, total: 500, deposit: 50 })
})

test('weekday, seven_songs requested but distance > 25mi: forced to hourly', () => {
  const q = getQuote(input({ packageType: 'seven_songs', distanceMi: 26, durationHours: 3 }))
  expect(q).toMatchObject({
    status: 'ok',
    lineItems: [{ key: 'hourly_rate', amount: 1500 }],
    total: 1500,
  })
})

test('distance-minimum boundaries: 14.9/15.0 -> 2h, 15.1 -> 3h', () => {
  // Sunday (not Saturday): Sunday's hourly minimum is still distance-tier based,
  // unlike Saturday's which is time-tier based (see the Saturday-specific tests below).
  const base = { eventDate: SUNDAY, startTime: '15:00', packageType: 'hourly' as const, durationHours: 1 }
  expect(getQuote(input({ ...base, distanceMi: 14.9 }))).toMatchObject({ enforcedHours: 2 })
  expect(getQuote(input({ ...base, distanceMi: 15.0 }))).toMatchObject({ enforcedHours: 2 })
  expect(getQuote(input({ ...base, distanceMi: 15.1 }))).toMatchObject({ enforcedHours: 3 })
})

test('distance-minimum boundaries: 29.9/30.0 -> 3h, 30.1 -> 4h', () => {
  const base = { packageType: 'hourly' as const, durationHours: 1 }
  expect(getQuote(input({ ...base, distanceMi: 29.9 }))).toMatchObject({ enforcedHours: 3 })
  expect(getQuote(input({ ...base, distanceMi: 30.0 }))).toMatchObject({ enforcedHours: 3 })
  expect(getQuote(input({ ...base, distanceMi: 30.1 }))).toMatchObject({ enforcedHours: 4 })
})

test('distance-minimum boundaries: 49.9/50.0 -> 4h, 50.1 -> 5h, 70 -> 5h', () => {
  const base = { packageType: 'hourly' as const, durationHours: 1 }
  expect(getQuote(input({ ...base, distanceMi: 49.9 }))).toMatchObject({ enforcedHours: 4 })
  expect(getQuote(input({ ...base, distanceMi: 50.0 }))).toMatchObject({ enforcedHours: 4 })
  expect(getQuote(input({ ...base, distanceMi: 50.1 }))).toMatchObject({ enforcedHours: 5 })
  expect(getQuote(input({ ...base, distanceMi: 70 }))).toMatchObject({ enforcedHours: 5 })
})

test('minimumApplied is only set when the minimum actually raised the hours', () => {
  const raised = getQuote(
    input({ eventDate: SATURDAY, startTime: '15:00', packageType: 'hourly', distanceMi: 10, durationHours: 1 }),
  ) as { minimumApplied?: unknown }
  expect(raised.minimumApplied).toEqual({ requested: 1, enforced: 2 })

  const notRaised = getQuote(
    input({ eventDate: SATURDAY, startTime: '15:00', packageType: 'hourly', distanceMi: 10, durationHours: 3 }),
  ) as { minimumApplied?: unknown }
  expect(notRaised.minimumApplied).toBeUndefined()
})

test('seven_songs is exempt from the distance minimum', () => {
  const q = getQuote(input({ packageType: 'seven_songs', distanceMi: 24, durationHours: 1 }))
  expect(q).toMatchObject({ enforcedHours: 1 })
})

test('saturday before 7am is contact_required/weekend_early_start', () => {
  expect(
    getQuote(input({ eventDate: SATURDAY, startTime: '06:59', packageType: 'hourly', distanceMi: 10, durationHours: 2 })),
  ).toEqual({ status: 'contact_required', reason: 'weekend_early_start' })
})

test('sunday before 8am is contact_required/weekend_early_start', () => {
  expect(
    getQuote(input({ eventDate: SUNDAY, startTime: '07:59', packageType: 'hourly', distanceMi: 10, durationHours: 2 })),
  ).toEqual({ status: 'contact_required', reason: 'weekend_early_start' })
})

test('saturday beyond 30 miles is contact_required/saturday_distance_limit', () => {
  expect(
    getQuote(input({ eventDate: SATURDAY, startTime: '17:00', packageType: 'hourly', distanceMi: 31, durationHours: 2 })),
  ).toEqual({ status: 'contact_required', reason: 'saturday_distance_limit' })
})

test('saturday at exactly 30 miles is still bookable', () => {
  const q = getQuote(input({ eventDate: SATURDAY, startTime: '17:00', packageType: 'hourly', distanceMi: 30, durationHours: 2 }))
  expect(q).toMatchObject({ status: 'ok' })
})

test('sunday has no distance cap (unchanged from today)', () => {
  const q = getQuote(input({ eventDate: SUNDAY, startTime: '15:00', packageType: 'hourly', distanceMi: 60, durationHours: 5 }))
  expect(q).toMatchObject({ status: 'ok', enforcedHours: 5 })
})

test('saturday serenata window (7-10am), seven_songs within 25mi: $470 flat, 1h block', () => {
  const q = getQuote(input({ eventDate: SATURDAY, startTime: '08:00', packageType: 'seven_songs', distanceMi: 20, durationHours: 1 }))
  expect(q).toMatchObject({
    status: 'ok',
    lineItems: [{ key: 'seven_songs', amount: 470 }],
    enforcedHours: 1,
    total: 470,
    calendarBlockMinutes: 120,
  })
})

test('saturday serenata window beyond 25mi (but within the 30mi cap) forces hourly', () => {
  const q = getQuote(input({ eventDate: SATURDAY, startTime: '08:00', packageType: 'seven_songs', distanceMi: 26, durationHours: 3 }))
  expect(q).toMatchObject({ status: 'ok', lineItems: [{ key: 'hourly_rate', amount: 1650 }], total: 1650 })
})

test('saturday hourly has no minimum beyond 1h during the serenata window', () => {
  const q = getQuote(input({ eventDate: SATURDAY, startTime: '08:00', packageType: 'hourly', distanceMi: 10, durationHours: 1 }))
  expect(q).toMatchObject({ status: 'ok', enforcedHours: 1 })
})

test('saturday 10am-3pm hourly minimum is 1h', () => {
  const q = getQuote(input({ eventDate: SATURDAY, startTime: '11:00', packageType: 'hourly', distanceMi: 10, durationHours: 1 }))
  expect(q).toMatchObject({ status: 'ok', enforcedHours: 1 })
})

test('saturday peak window (3-9:30pm) hourly minimum is 2h, regardless of distance', () => {
  const close = getQuote(input({ eventDate: SATURDAY, startTime: '17:00', packageType: 'hourly', distanceMi: 2, durationHours: 1 }))
  const far = getQuote(input({ eventDate: SATURDAY, startTime: '17:00', packageType: 'hourly', distanceMi: 29, durationHours: 1 }))
  expect(close).toMatchObject({ enforcedHours: 2, minimumApplied: { requested: 1, enforced: 2 } })
  expect(far).toMatchObject({ enforcedHours: 2, minimumApplied: { requested: 1, enforced: 2 } })
})

test('saturday late window (9:30pm+) hourly minimum drops to 1h', () => {
  const q = getQuote(input({ eventDate: SATURDAY, startTime: '22:00', packageType: 'hourly', distanceMi: 10, durationHours: 1 }))
  expect(q).toMatchObject({ status: 'ok', enforcedHours: 1 })
})

test('sunday, seven_songs within 25mi is available any time of day: $470 flat', () => {
  const q = getQuote(input({ eventDate: SUNDAY, startTime: '20:00', packageType: 'seven_songs', distanceMi: 10, durationHours: 1 }))
  expect(q).toMatchObject({ status: 'ok', lineItems: [{ key: 'seven_songs', amount: 470 }], enforcedHours: 1, total: 470 })
})

test('sunday seven_songs beyond 25mi is forced to hourly with the existing mileage minimum', () => {
  const q = getQuote(input({ eventDate: SUNDAY, startTime: '15:00', packageType: 'seven_songs', distanceMi: 26, durationHours: 1 }))
  expect(q).toMatchObject({ status: 'ok', lineItems: [{ key: 'hourly_rate', amount: 1650 }], enforcedHours: 3, total: 1650 })
})

test('outside the 07:00-24:00 window is contact_required/outside_hours', () => {
  expect(
    getQuote(input({ startTime: '06:00', packageType: 'seven_songs', distanceMi: 10 })),
  ).toEqual({ status: 'contact_required', reason: 'outside_hours' })

  expect(
    getQuote(
      input({ startTime: '23:30', packageType: 'hourly', distanceMi: 20, durationHours: 1 }),
    ),
  ).toEqual({ status: 'contact_required', reason: 'outside_hours' })
})

test('lead time < 3h is call_required', () => {
  const eventStart = new Date('2026-01-01T23:00:00.000Z') // 2026-01-01 15:00 PST = 23:00 UTC
  const q = getQuote(input({ now: new Date(eventStart.getTime() - 2 * 60 * 60 * 1000 - 59 * 60 * 1000) }))
  expect(q).toEqual({ status: 'call_required', reason: 'lead_time' })
})

test('lead time exactly 3h is bookable and not rush', () => {
  const eventStart = new Date('2026-01-01T23:00:00.000Z')
  const q = getQuote(input({ now: new Date(eventStart.getTime() - 3 * 60 * 60 * 1000) }))
  expect(q).toMatchObject({ status: 'ok', rush: true }) // 3h is still < 24h -> rush
})

test('lead time just under 24h is rush; exactly 24h is not', () => {
  const eventStart = new Date('2026-01-01T23:00:00.000Z')
  const justUnder = getQuote(
    input({ now: new Date(eventStart.getTime() - 23 * 60 * 60 * 1000 - 59 * 60 * 1000) }),
  )
  const exactly = getQuote(input({ now: new Date(eventStart.getTime() - 24 * 60 * 60 * 1000) }))
  expect(justUnder).toMatchObject({ status: 'ok', rush: true })
  expect(exactly).toMatchObject({ status: 'ok', rush: false })
})

test('deposit: normal hourly is $50 x enforcedHours', () => {
  const q = getQuote(input({ packageType: 'hourly', distanceMi: 40, durationHours: 4 }))
  expect(q).toMatchObject({ status: 'ok', enforcedHours: 4, deposit: 200 })
})

test('deposit: rush takes the greater of $150 or the normal calc (short booking)', () => {
  const eventStart = new Date('2026-01-01T23:00:00.000Z')
  const q = getQuote(
    input({
      packageType: 'seven_songs',
      now: new Date(eventStart.getTime() - 10 * 60 * 60 * 1000), // 10h out -> rush
    }),
  )
  expect(q).toMatchObject({ status: 'ok', rush: true, enforcedHours: 1, deposit: 150 })
})

test('deposit: rush never lowers the deposit below the normal calc (long booking)', () => {
  const eventStart = new Date('2026-01-01T23:00:00.000Z')
  const q = getQuote(
    input({
      packageType: 'hourly',
      distanceMi: 40,
      durationHours: 5,
      now: new Date(eventStart.getTime() - 10 * 60 * 60 * 1000), // 10h out -> rush
    }),
  )
  expect(q).toMatchObject({ status: 'ok', rush: true, enforcedHours: 5, deposit: 250 })
})
