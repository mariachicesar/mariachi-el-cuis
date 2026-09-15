# Weekend Booking Constraints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat "weekend starts at 3pm" rule with a full Saturday time-of-day schedule (serenata package, midday/peak/late minimums, on-hour first-booking rule, free-interval fragmentation avoidance with slot suggestions) and a simpler Sunday schedule (8am floor, serenata package, unchanged distance-based minimum).

**Architecture:** A new `src/lib/scheduling/` module owns Saturday's time-tier definitions and the free-interval math (pure, no I/O). The calendar adapter (`src/lib/calendar/google.ts`) drops its boolean `checkAvailability` in favor of `getBusyBlocks`, returning raw busy periods. A new `checkSlot` helper wraps "fetch busy blocks → compute free intervals → validate a candidate" and is shared by both the client-facing availability check and the server-side re-check before checkout, so the two never drift. `getQuote` stays pure and picks up the new pricing/minimum rules; it has no calendar access and does not enforce the on-hour rule (that needs to know about other bookings that day, which only the calendar-aware layer knows).

**Tech Stack:** TypeScript, Next.js server actions, Vitest, `googleapis` (mocked in tests).

**Spec:** `docs/superpowers/specs/2026-09-14-weekend-booking-constraints-design.md`

## Global Constraints

- All wall-clock times in this feature are LA-local ("HH:mm" strings or minutes-since-midnight integers), converted to/from UTC only at the calendar/timezone boundary (`src/lib/quote/timezone.ts`).
- Saturday's hourly minimums do **not** combine with the mileage-based `minimumTable` — Saturday is capped at 30mi and uses only the time-of-day tiers (0/1/2/1 hours). Sunday and weekday hourly bookings keep the existing mileage table unchanged.
- The 30-minute travel buffer (`PRICING.travelBufferMinutes`) is applied in exactly one place: `freeIntervals()`, which pads *raw* (unbuffered) busy periods. Calendar hold events are stored with raw (unpadded) start/end times — this is a deliberate change from today's behavior (see Task 9) so the buffer is never applied twice.
- `getQuote` remains a pure function (no calendar/network access). It does not and cannot enforce the on-hour first-booking rule.
- Run `npx vitest run <path>` to execute a single test file; `npm test` for the full suite; `npm run typecheck` for TypeScript.

---

### Task 1: Shared time-of-day utilities

**Files:**
- Create: `src/lib/quote/time-of-day.ts`
- Create: `src/lib/quote/time-of-day.test.ts`
- Modify: `src/lib/quote/index.ts` (use the new module instead of its local `minutesOf`)

**Interfaces:**
- Produces: `minutesOf(time: string): number`, `formatMinutes(totalMinutes: number): string` — used by every later task that does time-of-day math.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/quote/time-of-day.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/quote/time-of-day.test.ts`
Expected: FAIL with "Cannot find module './time-of-day'"

- [ ] **Step 3: Implement**

```ts
// src/lib/quote/time-of-day.ts
export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number) as [number, number]
  return h * 60 + m
}

export function formatMinutes(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, 24 * 60))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/quote/time-of-day.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Refactor `quote/index.ts` to use the shared helper**

Open `src/lib/quote/index.ts`. Delete its local `minutesOf` function (currently lines 5-8):

```ts
function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number) as [number, number]
  return h * 60 + m
}
```

Add an import at the top instead:

```ts
import { minutesOf } from './time-of-day'
```

- [ ] **Step 6: Run the full quote test suite to confirm no regression**

Run: `npx vitest run src/lib/quote/quote.test.ts`
Expected: PASS (all existing tests, unchanged)

- [ ] **Step 7: Commit**

```bash
git add src/lib/quote/time-of-day.ts src/lib/quote/time-of-day.test.ts src/lib/quote/index.ts
git commit -m "refactor: extract minutesOf/formatMinutes into a shared time-of-day module"
```

---

### Task 2: UTC ↔ LA-day-window helpers

**Files:**
- Modify: `src/lib/quote/timezone.ts`
- Modify: `src/lib/quote/timezone.test.ts`

**Interfaces:**
- Consumes: `laWallTimeToUtc(dateStr, timeStr): Date` (existing, in the same file).
- Produces: `utcToLaMinutesOfDay(instant: Date, dateStr: string): number`, `laDayBoundsUtc(dateStr: string): { startUtc: Date; endUtc: Date }` — used by `check-slot.ts` (Task 7) to convert fetched calendar busy blocks into LA minutes-of-day, and to compute the UTC window to fetch for a given local calendar date.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/quote/timezone.test.ts`:

```ts
import { laDayBoundsUtc, utcToLaMinutesOfDay } from './timezone'

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/quote/timezone.test.ts`
Expected: FAIL — `utcToLaMinutesOfDay` / `laDayBoundsUtc` are not exported

- [ ] **Step 3: Implement**

Append to `src/lib/quote/timezone.ts`:

```ts
/**
 * Minutes since LA-local midnight (0-1440, clamped) for a UTC instant,
 * relative to `dateStr`'s LA-local midnight — not the instant's own date.
 */
export function utcToLaMinutesOfDay(instant: Date, dateStr: string): number {
  const dayStartUtc = laWallTimeToUtc(dateStr, '00:00')
  const minutes = Math.round((instant.getTime() - dayStartUtc.getTime()) / 60_000)
  return Math.min(Math.max(minutes, 0), 24 * 60)
}

/** UTC instants bounding the full LA-local calendar day for `dateStr` ("YYYY-MM-DD"). */
export function laDayBoundsUtc(dateStr: string): { startUtc: Date; endUtc: Date } {
  const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number]
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  const nextDateStr = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`
  return { startUtc: laWallTimeToUtc(dateStr, '00:00'), endUtc: laWallTimeToUtc(nextDateStr, '00:00') }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/quote/timezone.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/quote/timezone.ts src/lib/quote/timezone.test.ts
git commit -m "feat: add UTC/LA-day-window conversion helpers to timezone.ts"
```

---

### Task 3: Saturday time-tier module

**Files:**
- Create: `src/lib/scheduling/saturday-tiers.ts`
- Create: `src/lib/scheduling/saturday-tiers.test.ts`
- Modify: `src/lib/data/pricing.ts` (add the new constants this task depends on)

**Interfaces:**
- Consumes: `PRICING` (new fields below), `minutesOf` from `@/lib/quote/time-of-day`.
- Produces: `saturdayTimeTierMinHours(startMin: number): number`, `isSaturdayPeakStart(startMin: number): boolean`, `SATURDAY_TIER_BOUNDARIES_MIN: number[]`, `SATURDAY_PEAK_START_MIN`, `SATURDAY_PEAK_END_MIN` — used by `getQuote` (Task 4) and `free-intervals.ts` (Task 5).

- [ ] **Step 1: Add the new pricing constants**

In `src/lib/data/pricing.ts`, inside the `PRICING` object, replace:

```ts
  weekendEarliestStart: '15:00',
```

with:

```ts
  weekendSevenSongsFlat: 470, // shared Saturday + Sunday serenata package price
  saturdayEarliestStart: '07:00',
  sundayEarliestStart: '08:00',
  saturdayMaxDistanceMi: 30, // beyond this, Saturday is contact_required
  saturdaySerenataEnd: '10:00', // 07:00-10:00 serenata window (Saturday only)
  saturdayMidDayEnd: '15:00', // 10:00-15:00 midday tier
  saturdayPeakEnd: '21:30', // 15:00-21:30 peak tier; >=21:30 is the late tier
  saturdayMidDayMinHours: 1,
  saturdayPeakMinHours: 2,
  saturdayLateMinHours: 1,
  travelBufferMinutes: 30, // replaces the literal 30*60*1000 in availability.ts
```

(`weekdayRadiusMi`, already 25, is reused as-is for the serenata package radius — no new constant needed for that.)

- [ ] **Step 2: Write the failing tests**

```ts
// src/lib/scheduling/saturday-tiers.test.ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/scheduling/saturday-tiers.test.ts`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 4: Implement**

```ts
// src/lib/scheduling/saturday-tiers.ts
import { PRICING } from '@/lib/data/pricing'
import { minutesOf } from '@/lib/quote/time-of-day'

export const SATURDAY_MIDDAY_START_MIN = minutesOf(PRICING.saturdaySerenataEnd)
export const SATURDAY_PEAK_START_MIN = minutesOf(PRICING.saturdayMidDayEnd)
export const SATURDAY_PEAK_END_MIN = minutesOf(PRICING.saturdayPeakEnd)

export const SATURDAY_TIER_BOUNDARIES_MIN = [
  SATURDAY_MIDDAY_START_MIN,
  SATURDAY_PEAK_START_MIN,
  SATURDAY_PEAK_END_MIN,
]

/** Saturday's time-of-day-only hourly minimum, in hours. No distance involved. */
export function saturdayTimeTierMinHours(startMin: number): number {
  if (startMin < SATURDAY_MIDDAY_START_MIN) return 0
  if (startMin < SATURDAY_PEAK_START_MIN) return PRICING.saturdayMidDayMinHours
  if (startMin < SATURDAY_PEAK_END_MIN) return PRICING.saturdayPeakMinHours
  return PRICING.saturdayLateMinHours
}

/** True when `startMin` falls in the 3:00-9:30pm peak window (where the on-hour rule can apply). */
export function isSaturdayPeakStart(startMin: number): boolean {
  return startMin >= SATURDAY_PEAK_START_MIN && startMin < SATURDAY_PEAK_END_MIN
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/scheduling/saturday-tiers.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/data/pricing.ts src/lib/scheduling/saturday-tiers.ts src/lib/scheduling/saturday-tiers.test.ts
git commit -m "feat: add Saturday time-of-day tier constants and pure tier lookup"
```

---

### Task 4: `getQuote` overhaul — distance cap, per-day earliest start, serenata package, time-tier minimum

**Files:**
- Modify: `src/lib/quote/index.ts`
- Modify: `src/lib/quote/types.ts`
- Modify: `src/lib/quote/quote.test.ts`

**Interfaces:**
- Consumes: `saturdayTimeTierMinHours` from `@/lib/scheduling/saturday-tiers` (Task 3), `minutesOf` from `./time-of-day` (Task 1).
- Produces: `getQuote(input: QuoteInput): QuoteResult` (same signature, new behavior), `distanceMinimumHoursFor(distanceMi: number): number` (renamed + exported from the previously-private `minimumHoursFor`, so later tasks/tests can reuse it if needed).

- [ ] **Step 1: Update the contact-required reason union**

In `src/lib/quote/types.ts`, change:

```ts
export type QuoteContactRequired = {
  status: 'contact_required'
  reason: 'out_of_area' | 'weekend_early_start' | 'outside_hours'
}
```

to:

```ts
export type QuoteContactRequired = {
  status: 'contact_required'
  reason: 'out_of_area' | 'saturday_distance_limit' | 'weekend_early_start' | 'outside_hours'
}
```

- [ ] **Step 2: Write the failing tests — replace the two now-invalid tests**

In `src/lib/quote/quote.test.ts`, replace:

```ts
test('weekend before 3pm is contact_required/weekend_early_start', () => {
  expect(
    getQuote(input({ eventDate: SATURDAY, startTime: '14:59', packageType: 'hourly', distanceMi: 10, durationHours: 2 })),
  ).toEqual({ status: 'contact_required', reason: 'weekend_early_start' })
})

test('weekend at/after 3pm is bookable, hourly-only at $550/h, minimum always applies', () => {
  const q = getQuote(
    input({ eventDate: SUNDAY, startTime: '15:00', packageType: 'seven_songs', distanceMi: 10, durationHours: 1 }),
  )
  expect(q).toMatchObject({
    status: 'ok',
    lineItems: [{ key: 'hourly_rate', amount: 1100 }], // forced hourly, 2h minimum @ $550
    enforcedHours: 2,
    total: 1100,
  })
})
```

with:

```ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/quote/quote.test.ts`
Expected: FAIL — new tests fail against current behavior; the two replaced tests are gone so nothing to fail there

- [ ] **Step 4: Implement**

Replace the full contents of `src/lib/quote/index.ts` with:

```ts
import { PRICING } from '@/lib/data/pricing'
import { laWallTimeToUtc, weekdayIndexOf } from './timezone'
import { minutesOf } from './time-of-day'
import { saturdayTimeTierMinHours } from '@/lib/scheduling/saturday-tiers'
import type { QuoteInput, QuoteLineItem, QuoteResult } from './types'

export function distanceMinimumHoursFor(distanceMi: number): number {
  for (const tier of PRICING.minimumTable) {
    if (distanceMi <= tier.maxMi) return tier.hours
  }
  const last = PRICING.minimumTable[PRICING.minimumTable.length - 1]!
  const extraMi = distanceMi - last.maxMi
  return last.hours + Math.ceil(extraMi / PRICING.minimumStepMi)
}

export function getQuote(input: QuoteInput): QuoteResult {
  const { eventDate, startTime, durationHours, packageType, distanceMi, county, state, now } = input

  if (state !== 'CA' || county !== 'Los Angeles County') {
    return { status: 'contact_required', reason: 'out_of_area' }
  }

  const dow = weekdayIndexOf(eventDate)
  const isSaturday = dow === 6
  const isSunday = dow === 0
  const isWeekend = isSaturday || isSunday
  const isWeekday = !isWeekend
  const startMin = minutesOf(startTime)
  const weekdayLocalRate = isWeekday && distanceMi <= PRICING.weekdayRadiusMi

  if (isSaturday && distanceMi > PRICING.saturdayMaxDistanceMi) {
    return { status: 'contact_required', reason: 'saturday_distance_limit' }
  }

  if (isWeekend) {
    const earliestStart = isSaturday ? PRICING.saturdayEarliestStart : PRICING.sundayEarliestStart
    if (startMin < minutesOf(earliestStart)) {
      return { status: 'contact_required', reason: 'weekend_early_start' }
    }
  }

  const saturdaySerenataWindow = isSaturday && startMin < minutesOf(PRICING.saturdaySerenataEnd)
  const weekendLocalSevenSongs = (saturdaySerenataWindow || isSunday) && distanceMi <= PRICING.weekdayRadiusMi

  const effectivePackage: 'seven_songs' | 'hourly' =
    packageType === 'seven_songs' && (weekdayLocalRate || weekendLocalSevenSongs) ? 'seven_songs' : 'hourly'

  let enforcedHours: number
  let minimumApplied: { requested: number; enforced: number } | undefined

  if (effectivePackage === 'seven_songs') {
    enforcedHours = 1
  } else if (weekdayLocalRate) {
    enforcedHours = durationHours // "no min" for weekday, <=25mi, hourly
  } else if (isSaturday) {
    const minimum = saturdayTimeTierMinHours(startMin)
    enforcedHours = Math.max(durationHours, minimum)
    if (enforcedHours > durationHours) minimumApplied = { requested: durationHours, enforced: enforcedHours }
  } else {
    const minimum = distanceMinimumHoursFor(distanceMi)
    enforcedHours = Math.max(durationHours, minimum)
    if (enforcedHours > durationHours) minimumApplied = { requested: durationHours, enforced: enforcedHours }
  }

  const endMinutes = startMin + enforcedHours * 60
  if (startMin < minutesOf(PRICING.hoursWindow.start) || endMinutes > minutesOf(PRICING.hoursWindow.end)) {
    return { status: 'contact_required', reason: 'outside_hours' }
  }

  const eventStartUtc = laWallTimeToUtc(eventDate, startTime)
  const leadHours = (eventStartUtc.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (leadHours < PRICING.leadTimeCallHours) {
    return { status: 'call_required', reason: 'lead_time' }
  }
  const rush = leadHours < PRICING.leadTimeRushHours

  const rate = isWeekend ? PRICING.hourlyWeekend : PRICING.hourlyWeekday
  const sevenSongsPrice = isWeekend ? PRICING.weekendSevenSongsFlat : PRICING.sevenSongsFlat
  const total = effectivePackage === 'seven_songs' ? sevenSongsPrice : rate * enforcedHours
  const lineItems: QuoteLineItem[] =
    effectivePackage === 'seven_songs'
      ? [{ key: 'seven_songs', amount: sevenSongsPrice }]
      : [{ key: 'hourly_rate', amount: rate * enforcedHours }]

  const normalDeposit = PRICING.depositPerHour * enforcedHours
  const deposit = rush ? Math.max(PRICING.rushFlatDeposit, normalDeposit) : normalDeposit

  return {
    status: 'ok',
    currency: 'USD',
    lineItems,
    enforcedHours,
    total,
    deposit,
    balanceDue: total - deposit,
    rush,
    ...(minimumApplied ? { minimumApplied } : {}),
    calendarBlockMinutes: enforcedHours * 60 + 60,
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/quote/quote.test.ts`
Expected: PASS (all tests, old and new)

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/lib/quote/index.ts src/lib/quote/types.ts src/lib/quote/quote.test.ts
git commit -m "feat: Saturday distance cap, serenata package, and time-tier-only minimums"
```

---

### Task 5: Free-interval simulation module

**Files:**
- Create: `src/lib/scheduling/free-intervals.ts`
- Create: `src/lib/scheduling/free-intervals.test.ts`

**Interfaces:**
- Consumes: `SATURDAY_TIER_BOUNDARIES_MIN`, `isSaturdayPeakStart` from `./saturday-tiers` (Task 3); `formatMinutes` from `@/lib/quote/time-of-day` (Task 1).
- Produces: `Interval` type `{ startMin: number; endMin: number }`, `Slot` type `{ startTime: string; endTime: string }`, `freeIntervals(dayWindow, busy, travelBufferMinutes): Interval[]`, `validateSaturdaySlot(candidate, free, isFirstBookingOfDay, minimumMinutesForStart): { ok: true } | { ok: false; reason: 'conflict' | 'below_minimum' | 'not_on_hour'; suggestions: Slot[] }`, `validateSundaySlot(candidate, free): { ok: true } | { ok: false; reason: 'conflict' }` — used by `check-slot.ts` (Task 7).

This is a pure module: no I/O, everything in minutes-since-midnight, callers convert to/from wall-clock strings at the boundary.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/scheduling/free-intervals.test.ts
import { expect, test } from 'vitest'
import { freeIntervals, validateSaturdaySlot, validateSundaySlot } from './free-intervals'
import { saturdayTimeTierMinHours } from './saturday-tiers'

const DAY_WINDOW = { startMin: 420, endMin: 1440 } // 07:00-24:00

function minimumMinutesForStart(startMin: number): number {
  return Math.max(1, saturdayTimeTierMinHours(startMin)) * 60
}

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

test('validateSaturdaySlot: 5-7pm booked, 8-9pm request is rejected with gap-filling suggestions', () => {
  const free = freeIntervals(DAY_WINDOW, [{ startMin: 1020, endMin: 1140 }], 30) // 17:00-19:00 booked
  const result = validateSaturdaySlot({ startMin: 1200, endMin: 1260 }, free, false, minimumMinutesForStart) // 20:00-21:00
  expect(result).toMatchObject({ ok: false, reason: 'below_minimum' })
  expect((result as { suggestions: unknown }).suggestions).toEqual([
    { startTime: '19:30', endTime: '21:30' },
    { startTime: '21:30', endTime: '22:30' },
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

test('validateSundaySlot: fits a free interval', () => {
  const free = freeIntervals(DAY_WINDOW, [], 30)
  expect(validateSundaySlot({ startMin: 480, endMin: 600 }, free)).toEqual({ ok: true })
})

test('validateSundaySlot: conflicts with a padded busy block', () => {
  const free = freeIntervals(DAY_WINDOW, [{ startMin: 480, endMin: 600 }], 30)
  expect(validateSundaySlot({ startMin: 510, endMin: 570 }, free)).toEqual({ ok: false, reason: 'conflict' })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/scheduling/free-intervals.test.ts`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Implement**

```ts
// src/lib/scheduling/free-intervals.ts
import { formatMinutes } from '@/lib/quote/time-of-day'
import { SATURDAY_TIER_BOUNDARIES_MIN, isSaturdayPeakStart } from './saturday-tiers'

export type Interval = { startMin: number; endMin: number }
export type Slot = { startTime: string; endTime: string }

/** Pads each busy period by `travelBufferMinutes`, merges overlaps, and returns the gaps within `dayWindow`. */
export function freeIntervals(dayWindow: Interval, busy: Interval[], travelBufferMinutes: number): Interval[] {
  const padded = busy
    .map((b) => ({
      startMin: Math.max(dayWindow.startMin, b.startMin - travelBufferMinutes),
      endMin: Math.min(dayWindow.endMin, b.endMin + travelBufferMinutes),
    }))
    .filter((b) => b.startMin < b.endMin)
    .sort((a, b) => a.startMin - b.startMin)

  const merged: Interval[] = []
  for (const b of padded) {
    const last = merged[merged.length - 1]
    if (last && b.startMin <= last.endMin) {
      last.endMin = Math.max(last.endMin, b.endMin)
    } else {
      merged.push({ ...b })
    }
  }

  const free: Interval[] = []
  let cursor = dayWindow.startMin
  for (const b of merged) {
    if (b.startMin > cursor) free.push({ startMin: cursor, endMin: b.startMin })
    cursor = Math.max(cursor, b.endMin)
  }
  if (cursor < dayWindow.endMin) free.push({ startMin: cursor, endMin: dayWindow.endMin })
  return free
}

function fitsWithin(candidate: Interval, interval: Interval): boolean {
  return candidate.startMin >= interval.startMin && candidate.endMin <= interval.endMin
}

function snapToHour(startMin: number): number {
  return Math.ceil(startMin / 60) * 60
}

function buildSaturdaySuggestions(
  candidate: Interval,
  free: Interval[],
  isFirstBookingOfDay: boolean,
  minimumMinutesForStart: (startMin: number) => number,
): Slot[] {
  const anchors = new Set<number>()
  for (const interval of free) {
    anchors.add(interval.startMin)
    for (const boundary of SATURDAY_TIER_BOUNDARIES_MIN) {
      if (boundary > interval.startMin && boundary < interval.endMin) anchors.add(boundary)
    }
  }
  // Only relevant when the day is empty (fragmentation isn't a concern yet) —
  // these give the nearest on-hour options around what was actually asked for.
  if (isFirstBookingOfDay) {
    anchors.add(Math.floor(candidate.startMin / 60) * 60)
    anchors.add(snapToHour(candidate.startMin))
  }

  const valid: Interval[] = []
  for (const anchorStart of anchors) {
    const requiresOnHour = isFirstBookingOfDay && isSaturdayPeakStart(anchorStart)
    const start = requiresOnHour ? snapToHour(anchorStart) : anchorStart
    const interval = free.find((i) => start >= i.startMin && start < i.endMin)
    if (!interval) continue
    const end = start + minimumMinutesForStart(start)
    if (end > interval.endMin) continue
    valid.push({ startMin: start, endMin: end })
  }

  const unique = Array.from(new Map(valid.map((v) => [v.startMin, v])).values()).sort(
    (a, b) => a.startMin - b.startMin,
  )

  const before = unique.filter((v) => v.startMin <= candidate.startMin).slice(-1)
  const after = unique.filter((v) => v.startMin > candidate.startMin).slice(0, 1)
  const picked = before.length && after.length ? [...before, ...after] : unique.slice(0, 2)

  return picked.map((v) => ({ startTime: formatMinutes(v.startMin), endTime: formatMinutes(v.endMin) }))
}

export function validateSaturdaySlot(
  candidate: Interval,
  free: Interval[],
  isFirstBookingOfDay: boolean,
  minimumMinutesForStart: (startMin: number) => number,
): { ok: true } | { ok: false; reason: 'conflict' | 'below_minimum' | 'not_on_hour'; suggestions: Slot[] } {
  const host = free.find((i) => fitsWithin(candidate, i))
  const requiresOnHour = isFirstBookingOfDay && isSaturdayPeakStart(candidate.startMin)

  if (!host) {
    return {
      ok: false,
      reason: 'conflict',
      suggestions: buildSaturdaySuggestions(candidate, free, isFirstBookingOfDay, minimumMinutesForStart),
    }
  }
  if (requiresOnHour && candidate.startMin % 60 !== 0) {
    return {
      ok: false,
      reason: 'not_on_hour',
      suggestions: buildSaturdaySuggestions(candidate, free, isFirstBookingOfDay, minimumMinutesForStart),
    }
  }
  if (candidate.endMin - candidate.startMin < minimumMinutesForStart(candidate.startMin)) {
    return {
      ok: false,
      reason: 'below_minimum',
      suggestions: buildSaturdaySuggestions(candidate, free, isFirstBookingOfDay, minimumMinutesForStart),
    }
  }
  return { ok: true }
}

export function validateSundaySlot(candidate: Interval, free: Interval[]): { ok: true } | { ok: false; reason: 'conflict' } {
  const host = free.find((i) => fitsWithin(candidate, i))
  return host ? { ok: true } : { ok: false, reason: 'conflict' }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/scheduling/free-intervals.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/scheduling/free-intervals.ts src/lib/scheduling/free-intervals.test.ts
git commit -m "feat: free-interval simulation with Saturday fragmentation-aware suggestions"
```

---

### Task 6: Calendar adapter — `getBusyBlocks` replaces `checkAvailability`

**Files:**
- Modify: `src/lib/calendar/google.ts`
- Modify: `src/lib/calendar/google.test.ts`

**Interfaces:**
- Produces: `type BusyBlock = { startUtc: Date; endUtc: Date }`, `getBusyBlocks(dayStartUtc: Date, dayEndUtc: Date): Promise<BusyBlock[]>` — used by `check-slot.ts` (Task 7).
- Removes: `checkAvailability` (no more callers after Task 7/8/9).

- [ ] **Step 1: Write the failing tests — replace the two `checkAvailability` tests**

In `src/lib/calendar/google.test.ts`, replace:

```ts
test('checkAvailability is true when the calendar reports no busy blocks', async () => {
  const { checkAvailability } = await import('./google')
  freebusyQuery.mockResolvedValue({ data: { calendars: { 'cal-1': { busy: [] } } } })
  expect(await checkAvailability(new Date(), new Date())).toBe(true)
})

test('checkAvailability is false when the calendar reports a busy block', async () => {
  const { checkAvailability } = await import('./google')
  freebusyQuery.mockResolvedValue({
    data: { calendars: { 'cal-1': { busy: [{ start: 'x', end: 'y' }] } } },
  })
  expect(await checkAvailability(new Date(), new Date())).toBe(false)
})
```

with:

```ts
test('getBusyBlocks returns an empty array when the calendar reports no busy blocks', async () => {
  const { getBusyBlocks } = await import('./google')
  freebusyQuery.mockResolvedValue({ data: { calendars: { 'cal-1': { busy: [] } } } })
  const result = await getBusyBlocks(new Date('2026-06-06T00:00:00Z'), new Date('2026-06-07T00:00:00Z'))
  expect(result).toEqual([])
})

test('getBusyBlocks maps busy periods to startUtc/endUtc Date pairs', async () => {
  const { getBusyBlocks } = await import('./google')
  freebusyQuery.mockResolvedValue({
    data: { calendars: { 'cal-1': { busy: [{ start: '2026-06-06T17:00:00Z', end: '2026-06-06T19:00:00Z' }] } } },
  })
  const result = await getBusyBlocks(new Date('2026-06-06T00:00:00Z'), new Date('2026-06-07T00:00:00Z'))
  expect(result).toEqual([
    { startUtc: new Date('2026-06-06T17:00:00.000Z'), endUtc: new Date('2026-06-06T19:00:00.000Z') },
  ])
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/calendar/google.test.ts`
Expected: FAIL — `getBusyBlocks` is not exported

- [ ] **Step 3: Implement**

In `src/lib/calendar/google.ts`, replace:

```ts
export async function checkAvailability(startUtc: Date, endUtc: Date): Promise<boolean> {
  const calendar = calendarClient()
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: startUtc.toISOString(),
      timeMax: endUtc.toISOString(),
      items: [{ id: env.GOOGLE_CALENDAR_ID! }],
    },
  })
  const busy = res.data.calendars?.[env.GOOGLE_CALENDAR_ID!]?.busy ?? []
  return busy.length === 0
}
```

with:

```ts
export type BusyBlock = { startUtc: Date; endUtc: Date }

export async function getBusyBlocks(dayStartUtc: Date, dayEndUtc: Date): Promise<BusyBlock[]> {
  const calendar = calendarClient()
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: dayStartUtc.toISOString(),
      timeMax: dayEndUtc.toISOString(),
      items: [{ id: env.GOOGLE_CALENDAR_ID! }],
    },
  })
  const busy = res.data.calendars?.[env.GOOGLE_CALENDAR_ID!]?.busy ?? []
  return busy
    .filter((b): b is { start: string; end: string } => Boolean(b.start && b.end))
    .map((b) => ({ startUtc: new Date(b.start), endUtc: new Date(b.end) }))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/calendar/google.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: will still show errors in `availability.ts`/`booking.ts`/their tests, which still reference `checkAvailability` — that's expected until Tasks 7-9 land. Confirm the *only* errors are in those files.

- [ ] **Step 6: Commit**

```bash
git add src/lib/calendar/google.ts src/lib/calendar/google.test.ts
git commit -m "feat: replace boolean checkAvailability with getBusyBlocks"
```

---

### Task 7: `checkSlot` — shared busy-blocks-to-validation helper

**Files:**
- Create: `src/lib/scheduling/check-slot.ts`
- Create: `src/lib/scheduling/check-slot.test.ts`

**Interfaces:**
- Consumes: `getBusyBlocks` from `@/lib/calendar/google` (Task 6); `laDayBoundsUtc`, `utcToLaMinutesOfDay`, `weekdayIndexOf` from `@/lib/quote/timezone` (Task 2 + existing); `minutesOf` from `@/lib/quote/time-of-day` (Task 1); `freeIntervals`, `validateSaturdaySlot`, `validateSundaySlot`, `Slot` from `./free-intervals` (Task 5); `saturdayTimeTierMinHours` from `./saturday-tiers` (Task 3); `PRICING`.
- Produces: `type SlotCheckResult = { available: boolean; suggestions?: Slot[] }`, `checkSlot(eventDate: string, startTime: string, durationHours: number): Promise<SlotCheckResult>` — used by `availability.ts` (Task 8) and `booking.ts` (Task 9).

This is the one place that fetches busy blocks and decides Saturday-vs-everything-else — both callers share it so they can never disagree about whether a slot is free.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/scheduling/check-slot.test.ts
import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/calendar/google', () => ({ getBusyBlocks: vi.fn() }))

afterEach(() => vi.resetAllMocks())

test('saturday: empty day, on-hour peak request is available', async () => {
  const { getBusyBlocks } = await import('@/lib/calendar/google')
  vi.mocked(getBusyBlocks).mockResolvedValue([])
  const { checkSlot } = await import('./check-slot')
  // 2026-01-03 is a Saturday
  expect(await checkSlot('2026-01-03', '17:00', 2)).toEqual({ available: true })
})

test('saturday: empty day, off-hour peak request is rejected with on-hour suggestions', async () => {
  const { getBusyBlocks } = await import('@/lib/calendar/google')
  vi.mocked(getBusyBlocks).mockResolvedValue([])
  const { checkSlot } = await import('./check-slot')
  const result = await checkSlot('2026-01-03', '17:15', 2)
  expect(result.available).toBe(false)
  expect(result.suggestions).toEqual([
    { startTime: '17:00', endTime: '19:00' },
    { startTime: '18:00', endTime: '20:00' },
  ])
})

test('saturday: 5-7pm booked, 8-9pm request is rejected with gap-filling suggestions', async () => {
  const { getBusyBlocks } = await import('@/lib/calendar/google')
  // 2026-01-03 17:00-19:00 PST (winter, UTC-8) = 2026-01-04T01:00:00Z to 03:00:00Z
  vi.mocked(getBusyBlocks).mockResolvedValue([
    { startUtc: new Date('2026-01-04T01:00:00.000Z'), endUtc: new Date('2026-01-04T03:00:00.000Z') },
  ])
  const { checkSlot } = await import('./check-slot')
  const result = await checkSlot('2026-01-03', '20:00', 1)
  expect(result.available).toBe(false)
  expect(result.suggestions).toEqual([
    { startTime: '19:30', endTime: '21:30' },
    { startTime: '21:30', endTime: '22:30' },
  ])
})

test('sunday: conflicting request returns available:false with no suggestions', async () => {
  const { getBusyBlocks } = await import('@/lib/calendar/google')
  // 2026-01-04 08:00-10:00 PST = 16:00-18:00Z
  vi.mocked(getBusyBlocks).mockResolvedValue([
    { startUtc: new Date('2026-01-04T16:00:00.000Z'), endUtc: new Date('2026-01-04T18:00:00.000Z') },
  ])
  const { checkSlot } = await import('./check-slot')
  const result = await checkSlot('2026-01-04', '08:30', 1)
  expect(result).toEqual({ available: false })
})

test('sunday: 8am request on an empty day is available (previously blocked by the old 3pm floor)', async () => {
  const { getBusyBlocks } = await import('@/lib/calendar/google')
  vi.mocked(getBusyBlocks).mockResolvedValue([])
  const { checkSlot } = await import('./check-slot')
  expect(await checkSlot('2026-01-04', '08:00', 2)).toEqual({ available: true })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/scheduling/check-slot.test.ts`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Implement**

```ts
// src/lib/scheduling/check-slot.ts
import 'server-only'
import { laDayBoundsUtc, utcToLaMinutesOfDay, weekdayIndexOf } from '@/lib/quote/timezone'
import { minutesOf } from '@/lib/quote/time-of-day'
import { PRICING } from '@/lib/data/pricing'
import { getBusyBlocks } from '@/lib/calendar/google'
import { freeIntervals, validateSaturdaySlot, validateSundaySlot, type Slot } from './free-intervals'
import { saturdayTimeTierMinHours } from './saturday-tiers'

export type SlotCheckResult = { available: boolean; suggestions?: Slot[] }

// The pure tier function returns 0 for the serenata window (no floor beyond
// the app-wide 1h schema minimum) — wrap it so a bare 0 never turns into a
// zero-length suggested slot when this is used standalone (outside getQuote,
// where durationHours already provides that floor).
function saturdayMinimumMinutesForStart(startMin: number): number {
  return Math.max(1, saturdayTimeTierMinHours(startMin)) * 60
}

export async function checkSlot(eventDate: string, startTime: string, durationHours: number): Promise<SlotCheckResult> {
  const startMin = minutesOf(startTime)
  const rawCandidate = { startMin, endMin: startMin + durationHours * 60 }

  const { startUtc: dayStartUtc, endUtc: dayEndUtc } = laDayBoundsUtc(eventDate)
  const busyBlocks = await getBusyBlocks(dayStartUtc, dayEndUtc)
  const isFirstBookingOfDay = busyBlocks.length === 0

  const rawBusy = busyBlocks.map((b) => ({
    startMin: utcToLaMinutesOfDay(b.startUtc, eventDate),
    endMin: utcToLaMinutesOfDay(b.endUtc, eventDate),
  }))

  // Shared lower bound for both days' free-interval math (Saturday's 7am
  // floor). Harmless for Sunday: getQuote already rejects anything before
  // Sunday's tighter 8am floor before checkSlot is ever called.
  const dayWindow = { startMin: minutesOf(PRICING.saturdayEarliestStart), endMin: minutesOf(PRICING.hoursWindow.end) }
  const free = freeIntervals(dayWindow, rawBusy, PRICING.travelBufferMinutes)

  const isSaturday = weekdayIndexOf(eventDate) === 6
  if (isSaturday) {
    const result = validateSaturdaySlot(rawCandidate, free, isFirstBookingOfDay, saturdayMinimumMinutesForStart)
    return result.ok ? { available: true } : { available: false, suggestions: result.suggestions }
  }

  const result = validateSundaySlot(rawCandidate, free)
  return { available: result.ok }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/scheduling/check-slot.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: errors remain only in `availability.ts`/`booking.ts` and their tests (fixed in Tasks 8-9)

- [ ] **Step 6: Commit**

```bash
git add src/lib/scheduling/check-slot.ts src/lib/scheduling/check-slot.test.ts
git commit -m "feat: add checkSlot — shared busy-blocks-to-validation helper"
```

---

### Task 8: `checkAvailabilityAction` rewrite

**Files:**
- Modify: `src/app/actions/availability.ts`
- Modify: `src/app/actions/availability.test.ts`
- Modify: `src/app/actions/availability-disabled.test.ts`

**Interfaces:**
- Consumes: `checkSlot` from `@/lib/scheduling/check-slot` (Task 7).
- Produces: `type CheckAvailabilityResult = { checked: true; available: boolean; suggestions?: Slot[] } | { checked: false }`, `checkAvailabilityAction(input: unknown): Promise<CheckAvailabilityResult>` — input shape changes from `{ eventDate, startTime, calendarBlockMinutes }` to `{ eventDate, startTime, durationHours }` (Task 11 updates the one caller in `booking-wizard.tsx`).

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `src/app/actions/availability.test.ts`:

```ts
import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { calendar: true } }))
vi.mock('@/lib/scheduling/check-slot', () => ({ checkSlot: vi.fn() }))

afterEach(() => vi.resetAllMocks())

test('returns checked:false for malformed input', async () => {
  const { checkAvailabilityAction } = await import('./availability')
  expect(await checkAvailabilityAction({})).toEqual({ checked: false })
})

test('returns checked:true with the checkSlot result for valid input', async () => {
  const { checkSlot } = await import('@/lib/scheduling/check-slot')
  vi.mocked(checkSlot).mockResolvedValue({ available: true })
  const { checkAvailabilityAction } = await import('./availability')

  const result = await checkAvailabilityAction({
    eventDate: '2026-06-01',
    startTime: '15:00',
    durationHours: 2,
  })
  expect(result).toEqual({ checked: true, available: true })
  expect(checkSlot).toHaveBeenCalledWith('2026-06-01', '15:00', 2)
})

test('passes suggestions through when the slot is unavailable', async () => {
  const { checkSlot } = await import('@/lib/scheduling/check-slot')
  vi.mocked(checkSlot).mockResolvedValue({
    available: false,
    suggestions: [{ startTime: '17:00', endTime: '19:00' }],
  })
  const { checkAvailabilityAction } = await import('./availability')

  const result = await checkAvailabilityAction({
    eventDate: '2026-01-03',
    startTime: '17:15',
    durationHours: 2,
  })
  expect(result).toEqual({
    checked: true,
    available: false,
    suggestions: [{ startTime: '17:00', endTime: '19:00' }],
  })
})
```

Replace the full contents of `src/app/actions/availability-disabled.test.ts`:

```ts
import { expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { calendar: false } }))
vi.mock('@/lib/scheduling/check-slot', () => ({ checkSlot: vi.fn() }))

test('returns checked:false when the calendar feature is off, even with valid input', async () => {
  const { checkAvailabilityAction } = await import('./availability')
  const result = await checkAvailabilityAction({
    eventDate: '2026-06-01',
    startTime: '15:00',
    durationHours: 2,
  })
  expect(result).toEqual({ checked: false })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/actions/availability.test.ts src/app/actions/availability-disabled.test.ts`
Expected: FAIL — `availability.ts` still expects `calendarBlockMinutes` and imports `checkAvailability`

- [ ] **Step 3: Implement**

Replace the full contents of `src/app/actions/availability.ts`:

```ts
'use server'

import { z } from 'zod'
import { checkSlot } from '@/lib/scheduling/check-slot'
import type { Slot } from '@/lib/scheduling/free-intervals'
import { features } from '@/lib/env'

const inputSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.number().min(1).max(12),
})

export type CheckAvailabilityResult =
  | { checked: true; available: boolean; suggestions?: Slot[] }
  | { checked: false }

export async function checkAvailabilityAction(input: unknown): Promise<CheckAvailabilityResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success || !features.calendar) return { checked: false }

  const result = await checkSlot(parsed.data.eventDate, parsed.data.startTime, parsed.data.durationHours)
  return { checked: true, ...result }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/actions/availability.test.ts src/app/actions/availability-disabled.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/availability.ts src/app/actions/availability.test.ts src/app/actions/availability-disabled.test.ts
git commit -m "feat: rewrite checkAvailabilityAction on checkSlot, switch input to durationHours"
```

---

### Task 9: `startCheckoutAction` rewrite — server-side re-check, raw calendar hold times

**Files:**
- Modify: `src/app/actions/booking.ts`
- Modify: `src/app/actions/booking.test.ts`
- Modify: `src/app/actions/booking-maps-disabled.test.ts`

**Interfaces:**
- Consumes: `checkSlot` from `@/lib/scheduling/check-slot` (Task 7); `createHoldEvent` from `@/lib/calendar/google` (unchanged signature).
- Produces: `startCheckoutAction` (same exported signature and `StartCheckoutState` type — behavior change only).

**Note — deliberate behavior change:** calendar hold events are now created with the *raw* event start/end (no 30-minute pre/post padding baked into the stored event). The 30-minute travel buffer is still fully enforced — it's applied once, uniformly, inside `freeIntervals` (Task 5) via `checkSlot` (Task 7), instead of being baked into what's stored on the calendar *and* re-applied at check time. This avoids the double-buffering bug that would otherwise make the Saturday late-tier 1-hour minimum effectively unreachable.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `src/app/actions/booking.test.ts`:

```ts
import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  features: { stripe: true, calendar: true, maps: true },
  env: { NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' },
}))
vi.mock('@/lib/geo/geocode', () => ({ geocodeAddress: vi.fn() }))
vi.mock('@/lib/scheduling/check-slot', () => ({ checkSlot: vi.fn() }))
vi.mock('@/lib/calendar/google', () => ({ createHoldEvent: vi.fn() }))
vi.mock('@/lib/payments/stripe', () => ({ createDepositCheckoutSession: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

afterEach(() => vi.resetAllMocks())

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const validFields = {
  eventDate: '2026-12-15',
  startTime: '15:00',
  durationHours: '1',
  packageType: 'seven_songs',
  address: '90011',
  email: 'customer@example.com',
  phone: '',
  name: 'Test Customer',
  locale: 'en',
}

test('returns the quote status as the error when the quote is not ok', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Orange County', // -> out_of_area
    state: 'CA',
  })
  const { startCheckoutAction } = await import('./booking')
  const result = await startCheckoutAction({ ok: false }, formData(validFields))
  expect(result).toEqual({ ok: false, error: 'contact_required' })
})

test('creates a calendar hold and a Stripe session, then redirects, for an ok quote', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  const { checkSlot } = await import('@/lib/scheduling/check-slot')
  const { createHoldEvent } = await import('@/lib/calendar/google')
  const { createDepositCheckoutSession } = await import('@/lib/payments/stripe')

  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Los Angeles County',
    state: 'CA',
  })
  vi.mocked(checkSlot).mockResolvedValue({ available: true })
  vi.mocked(createHoldEvent).mockResolvedValue('evt-1')
  vi.mocked(createDepositCheckoutSession).mockResolvedValue({
    url: 'https://checkout.stripe.com/session-1',
  })

  const { startCheckoutAction } = await import('./booking')
  await expect(startCheckoutAction({ ok: false }, formData(validFields))).rejects.toThrow(
    'NEXT_REDIRECT',
  )

  expect(checkSlot).toHaveBeenCalledWith('2026-12-15', '15:00', 1)
  expect(createHoldEvent).toHaveBeenCalledOnce()
  const holdArgs = vi.mocked(createHoldEvent).mock.calls[0]![0]!
  expect(holdArgs.startUtc.toISOString()).toBe('2026-12-15T23:00:00.000Z') // raw event start, no buffer
  expect(holdArgs.endUtc.toISOString()).toBe('2026-12-16T00:00:00.000Z') // raw event end, no buffer

  const sessionArgs = vi.mocked(createDepositCheckoutSession).mock.calls[0]![0]!
  expect(sessionArgs.depositUsd).toBe(50)
  expect(sessionArgs.metadata.calendarEventId).toBe('evt-1')
  expect(sessionArgs.metadata.email).toBe('customer@example.com')

  const { redirect } = await import('next/navigation')
  expect(redirect).toHaveBeenCalledWith('https://checkout.stripe.com/session-1')
})

test('returns slot_unavailable and never creates a hold or checkout session when the slot is taken', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  const { checkSlot } = await import('@/lib/scheduling/check-slot')
  const { createHoldEvent } = await import('@/lib/calendar/google')
  const { createDepositCheckoutSession } = await import('@/lib/payments/stripe')

  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Los Angeles County',
    state: 'CA',
  })
  vi.mocked(checkSlot).mockResolvedValue({ available: false, suggestions: [] })

  const { startCheckoutAction } = await import('./booking')
  const result = await startCheckoutAction({ ok: false }, formData(validFields))

  expect(result).toEqual({ ok: false, error: 'slot_unavailable' })
  expect(createHoldEvent).not.toHaveBeenCalled()
  expect(createDepositCheckoutSession).not.toHaveBeenCalled()
})
```

Replace the full contents of `src/app/actions/booking-maps-disabled.test.ts`:

```ts
import { expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  features: { stripe: true, calendar: true, maps: false },
  env: { NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' },
}))
vi.mock('@/lib/geo/geocode', () => ({ geocodeAddress: vi.fn() }))
// The maps-disabled path returns before reaching the calendar/stripe SDKs,
// but `./booking` still statically imports them. Mock so this test doesn't
// pay for transforming those heavy dependencies.
vi.mock('@/lib/scheduling/check-slot', () => ({ checkSlot: vi.fn().mockResolvedValue({ available: true }) }))
vi.mock('@/lib/calendar/google', () => ({ createHoldEvent: vi.fn() }))
vi.mock('@/lib/payments/stripe', () => ({ createDepositCheckoutSession: vi.fn() }))

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const validFields = {
  eventDate: '2026-12-15',
  startTime: '15:00',
  durationHours: '1',
  packageType: 'seven_songs',
  address: '90011',
  email: 'customer@example.com',
  phone: '',
  name: 'Test Customer',
  locale: 'en',
}

test('returns not_configured and never geocodes when the maps feature is off', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  const { startCheckoutAction } = await import('./booking')

  const result = await startCheckoutAction({ ok: false }, formData(validFields))

  expect(result).toEqual({ ok: false, error: 'not_configured' })
  expect(geocodeAddress).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/actions/booking.test.ts src/app/actions/booking-maps-disabled.test.ts`
Expected: FAIL — `booking.ts` still imports `checkAvailability` and pads the hold event

- [ ] **Step 3: Implement**

In `src/app/actions/booking.ts`, replace the import line:

```ts
import { checkAvailability, createHoldEvent } from '@/lib/calendar/google'
```

with:

```ts
import { createHoldEvent } from '@/lib/calendar/google'
import { checkSlot } from '@/lib/scheduling/check-slot'
```

Replace the calendar block (currently):

```ts
  let calendarEventId = ''
  if (features.calendar) {
    const eventStartUtc = laWallTimeToUtc(parsed.data.eventDate, parsed.data.startTime)
    const blockStart = new Date(eventStartUtc.getTime() - 30 * 60 * 1000)
    const blockEnd = new Date(blockStart.getTime() + quote.calendarBlockMinutes * 60 * 1000)

    const available = await checkAvailability(blockStart, blockEnd)
    if (!available) return { ok: false, error: 'slot_unavailable' }

    calendarEventId = await createHoldEvent({
      summary: `HOLD — awaiting deposit — ${parsed.data.name}`,
      description: `Package: ${parsed.data.packageType}\nHours: ${quote.enforcedHours}\nAddress: ${parsed.data.address}\nPhone: ${parsed.data.phone || '—'}`,
      location: parsed.data.address,
      startUtc: blockStart,
      endUtc: blockEnd,
    })
  }
```

with:

```ts
  let calendarEventId = ''
  if (features.calendar) {
    const { available } = await checkSlot(parsed.data.eventDate, parsed.data.startTime, quote.enforcedHours)
    if (!available) return { ok: false, error: 'slot_unavailable' }

    const eventStartUtc = laWallTimeToUtc(parsed.data.eventDate, parsed.data.startTime)
    const eventEndUtc = new Date(eventStartUtc.getTime() + quote.enforcedHours * 60 * 60 * 1000)

    calendarEventId = await createHoldEvent({
      summary: `HOLD — awaiting deposit — ${parsed.data.name}`,
      description: `Package: ${parsed.data.packageType}\nHours: ${quote.enforcedHours}\nAddress: ${parsed.data.address}\nPhone: ${parsed.data.phone || '—'}`,
      location: parsed.data.address,
      startUtc: eventStartUtc,
      endUtc: eventEndUtc,
    })
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/actions/booking.test.ts src/app/actions/booking-maps-disabled.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Full test suite + typecheck**

Run: `npm test`
Run: `npm run typecheck`
Expected: PASS / no errors — this is the point where every file touched by Tasks 1-9 should be fully consistent

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/booking.ts src/app/actions/booking.test.ts src/app/actions/booking-maps-disabled.test.ts
git commit -m "feat: rewrite startCheckoutAction on checkSlot, store raw (unbuffered) hold events"
```

---

### Task 10: Update marketing pricing copy

**Files:**
- Modify: `src/lib/data/pricing.ts` (`pricingLines` function only)
- Modify: `tests/unit/data.test.ts`

**Interfaces:**
- Consumes: `PRICING` (Task 3's new fields).
- Produces: `pricingLines(locale: Locale): string[]` — same signature, updated content. Rendered on `/book`, `/services`, the homepage, city pages, and `llms.txt` (no code changes needed there — they just call `pricingLines`).

- [ ] **Step 1: Write the failing test**

In `tests/unit/data.test.ts`, extend the dollar-figure check to include the new serenata price:

```ts
test('pricingLines mentions every PRICING dollar figure, both locales', () => {
  for (const locale of ['es', 'en'] as const) {
    const text = pricingLines(locale).join(' ')
    for (const amount of [
      PRICING.sevenSongsFlat,
      PRICING.weekendSevenSongsFlat,
      PRICING.hourlyWeekday,
      PRICING.hourlyWeekend,
      PRICING.depositPerHour,
      PRICING.rushFlatDeposit,
    ]) {
      expect(text).toContain(`$${amount}`)
    }
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: FAIL — `$470` not present in either locale's copy yet

- [ ] **Step 3: Implement**

In `src/lib/data/pricing.ts`, replace the `pricingLines` function body:

```ts
export function pricingLines(locale: Locale): string[] {
  const es = [
    'Lunes a viernes (dentro de 25 millas del 90011): paquete de 7 canciones por $380, o $500 por hora sin mínimo de horas.',
    'Sábado, 7:00–10:00 AM (serenata): paquete de 7 canciones por $470 (dentro de 25 millas) o $550 por hora.',
    'Sábado, 10:00 AM–3:00 PM: $550 por hora, mínimo 1 hora.',
    'Sábado, 3:00–9:30 PM (hora pico): $550 por hora, mínimo 2 horas. La primera reserva del día debe comenzar en punto (por ejemplo, 5:00, 6:00, 7:00 PM).',
    'Sábado, después de las 9:30 PM: $550 por hora, mínimo 1 hora.',
    'Reservas de sábado solo dentro de 30 millas del 90011 — más lejos, llámanos.',
    'Domingo, desde las 8:00 AM: paquete de 7 canciones por $470 (dentro de 25 millas, cualquier hora del día) o $550 por hora, con el mínimo de horas según la distancia.',
    'Mínimo de horas por distancia (domingo y entre semana con paquete por hora fuera de las 25 millas): 2 horas dentro de 15 millas, 3 horas dentro de 30, 4 horas dentro de 50, y 1 hora más por cada 20 millas adicionales.',
    'El depósito es de $50 por cada hora reservada (o $50 para el paquete de 7 canciones). Si reservas con menos de 24 horas de anticipación, el depósito mínimo es de $150. El saldo se paga después directamente al mariachi.',
    'Cancelación: el depósito es reembolsable solo si cancelas 7 días o más antes del evento.',
    'Cotización instantánea únicamente dentro del Condado de Los Ángeles.',
  ]
  const en = [
    'Monday–Friday (within 25 miles of 90011): 7-song package for $380, or $500/hour with no hour minimum.',
    'Saturday, 7:00–10:00am ("serenata"): 7-song package for $470 (within 25 miles) or $550/hour.',
    'Saturday, 10:00am–3:00pm: $550/hour, 1-hour minimum.',
    'Saturday, 3:00–9:30pm (peak): $550/hour, 2-hour minimum. The first booking of the day must start on the hour (e.g. 5:00, 6:00, 7:00pm).',
    'Saturday, after 9:30pm: $550/hour, 1-hour minimum.',
    'Saturday bookings only within 30 miles of 90011 — farther out, please call.',
    'Sunday, from 8:00am: 7-song package for $470 (within 25 miles, any time of day) or $550/hour with the standard distance-based hour minimum.',
    'Distance-based hour minimum (Sunday, and weekday hourly bookings beyond 25 miles): 2 hours within 15 miles, 3 hours within 30, 4 hours within 50, then +1 hour per additional 20 miles.',
    'The deposit is $50 per hour booked (or $50 for the 7-songs package). If you book less than 24 hours before the event, the minimum deposit is $150. The balance is paid later directly to the band.',
    'Cancellation: the deposit is refundable only if you cancel 7 or more days before the event.',
    'Instant quotes are available for Los Angeles County only.',
  ]
  return locale === 'es' ? es : en
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/pricing.ts tests/unit/data.test.ts
git commit -m "docs: update pricingLines copy for the new Saturday/Sunday schedule"
```

---

### Task 11: Wizard UI — durationHours input, dynamic serenata price, suggested slots

**Files:**
- Modify: `src/components/booking/booking-wizard.tsx`

**Interfaces:**
- Consumes: `checkAvailabilityAction` (Task 8's new input shape), `Slot` type from `@/lib/scheduling/free-intervals`, `PRICING` from `@/lib/data/pricing`.

- [ ] **Step 1: Update the availability effect to send `durationHours` instead of `calendarBlockMinutes`**

Find (around line 237-254):

```ts
  useEffect(() => {
    const canCheckAvailability = features.calendar && quote !== null && quote.status === 'ok'

    const handle = setTimeout(() => {
      if (!canCheckAvailability || quote === null || quote.status !== 'ok') {
        setAvailability({ checked: false })
        return
      }
      checkAvailabilityAction({
        eventDate,
        startTime,
        calendarBlockMinutes: quote.calendarBlockMinutes,
      })
        .then(setAvailability)
        .catch(() => setAvailability({ checked: false }))
    }, effectDelayMs(canCheckAvailability))
    return () => clearTimeout(handle)
  }, [features.calendar, quote, eventDate, startTime])
```

Replace with:

```ts
  useEffect(() => {
    const canCheckAvailability = features.calendar && quote !== null && quote.status === 'ok'

    const handle = setTimeout(() => {
      if (!canCheckAvailability || quote === null || quote.status !== 'ok') {
        setAvailability({ checked: false })
        return
      }
      checkAvailabilityAction({
        eventDate,
        startTime,
        durationHours: quote.enforcedHours,
      })
        .then(setAvailability)
        .catch(() => setAvailability({ checked: false }))
    }, effectDelayMs(canCheckAvailability))
    return () => clearTimeout(handle)
  }, [features.calendar, quote, eventDate, startTime])
```

- [ ] **Step 2: Widen the `availability` state type to carry suggestions**

Find:

```ts
  const [availability, setAvailability] = useState<{ checked: boolean; available?: boolean }>({
    checked: false,
  })
```

Replace with:

```ts
  const [availability, setAvailability] = useState<CheckAvailabilityResult>({ checked: false })
```

Add the import at the top of the file, alongside the other action imports:

```ts
import { checkAvailabilityAction, type CheckAvailabilityResult } from '@/app/actions/availability'
```

(replacing the existing `import { checkAvailabilityAction } from '@/app/actions/availability'` line)

- [ ] **Step 3: Import PRICING and add a dynamic seven-songs label**

Add near the other imports:

```ts
import { PRICING } from '@/lib/data/pricing'
```

In the `COPY` object, replace the static `sevenSongs` string in both locales:

```ts
    sevenSongs: 'Paquete de 7 canciones ($380)',
```
```ts
    sevenSongs: '7-songs package ($380)',
```

with functions:

```ts
    sevenSongs: (price: number) => `Paquete de 7 canciones ($${price})`,
```
```ts
    sevenSongs: (price: number) => `7-songs package ($${price})`,
```

Update the `Copy` type usage at the call site — find:

```tsx
        {isWeekday && (
          <label className="flex items-center gap-2 py-1">
            <input
              type="radio"
              name="package"
              checked={packageType === 'seven_songs'}
              onChange={() => {
                setPackageType('seven_songs')
                setDurationHours(1)
              }}
            />
            {t.sevenSongs}
          </label>
        )}
```

Replace with (dropping the `isWeekday &&` gate so weekend serenata bookings can select it too — `getQuote` already falls back to hourly silently when a request is ineligible, same pattern as the existing weekday->25mi fallback):

```tsx
        <label className="flex items-center gap-2 py-1">
          <input
            type="radio"
            name="package"
            checked={packageType === 'seven_songs'}
            onChange={() => {
              setPackageType('seven_songs')
              setDurationHours(1)
            }}
          />
          {t.sevenSongs(isWeekday ? PRICING.sevenSongsFlat : PRICING.weekendSevenSongsFlat)}
        </label>
```

- [ ] **Step 4: Render suggested slots when the slot is unavailable**

Find:

```tsx
              {features.calendar ? (
                availability.checked && (
                  <p className="mt-2 font-semibold">
                    {availability.available ? t.available : t.unavailable}
                  </p>
                )
              ) : (
                <p className="mt-2 text-on-surface-variant">{t.noCalendarNotice}</p>
              )}
```

Replace with:

```tsx
              {features.calendar ? (
                availability.checked && (
                  <div className="mt-2">
                    <p className="font-semibold">{availability.available ? t.available : t.unavailable}</p>
                    {!availability.available && availability.suggestions && availability.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {availability.suggestions.map((s) => (
                          <button
                            key={s.startTime}
                            type="button"
                            onClick={() => setStartTime(s.startTime)}
                            className="rounded border border-charcoal-border px-3 py-1 text-sm text-crema-white hover:bg-charcoal-elevated"
                          >
                            {s.startTime}–{s.endTime}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : (
                <p className="mt-2 text-on-surface-variant">{t.noCalendarNotice}</p>
              )}
```

- [ ] **Step 5: Typecheck and lint**

Run: `npm run typecheck`
Run: `npm run lint`
Expected: no errors

- [ ] **Step 6: Manual verification in the browser**

Run: `npm run dev`, open `http://localhost:3000/en/book`.

- With `GOOGLE_MAPS_API_KEY`/calendar env vars unset (local default), confirm the wizard still renders and shows `t.noCalendarNotice` where the availability line used to be — this exercises the "no integrations" path the existing e2e smoke test (`tests/e2e/book.spec.ts`) covers, so run `npm run test:e2e -- book.spec.ts` too and confirm it still passes.
- Pick a Saturday date, set the time to `17:15`, and confirm the package radio no longer hides "7-songs" on weekends, and that the label shows `$470` once you select a Saturday/Sunday date vs `$380` on a weekday.
- (Full suggestion-rendering behavior needs live `GOOGLE_MAPS_API_KEY`/calendar credentials to exercise end-to-end — `check-slot.test.ts` and `availability.test.ts` already cover the suggestion logic and data flow without those credentials.)

- [ ] **Step 7: Run the full suite one more time**

Run: `npm test`
Run: `npx playwright test tests/e2e/book.spec.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/components/booking/booking-wizard.tsx
git commit -m "feat: wizard sends durationHours, shows dynamic serenata price and suggested slots"
```

---

## Post-plan check

After Task 11, re-read the spec's Goals section end-to-end against what was built:

- Saturday schedule table (serenata/midday/peak/late, 30mi cap, on-hour first booking) → Tasks 3, 4, 5, 7.
- Sunday schedule (8am floor, serenata any time, unchanged mileage minimum) → Task 4.
- Fragmentation avoidance + suggestions → Tasks 5, 7, 8, 11.
- Calendar adapter change → Task 6.
- Marketing copy staying truthful → Task 10.

Run `npm test && npm run typecheck && npm run lint` once more as a final gate before considering the branch ready for `superpowers:finishing-a-development-branch`.
