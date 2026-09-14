# Weekend Booking Constraints — Design

Status: approved by Cesar 2026-09-14, ready for implementation planning.

## Problem

The booking system currently treats Saturday and Sunday identically: a flat
"must start at 3:00pm or later" floor (`weekendEarliestStart` in
`pricing.ts`), a single $550/hr rate, and a distance-based hour minimum
(`minimumTable`). That doesn't match how the band actually wants to run
weekends:

- Saturday is the busy day and needs a full time-of-day schedule: an early
  "serenata" package, a relaxed midday minimum, a strict peak-hours minimum
  that steers the first booking of the day to a clean on-the-hour start, and
  a shorter late-night minimum.
- Sunday is simpler but still needs its earliest start moved from 3pm to
  8am, and a cheaper flat "serenata" package option available any time of
  day.
- Multiple bookings landing on the same Saturday can leave unusable gaps
  between them (a 5-7pm gig followed by an 8-9pm gig leaves an idle half
  hour nobody can fill). Nothing today detects or avoids this.

This spec replaces the boolean `checkAvailability` calendar check with a
free-interval simulation that validates a candidate slot against real busy
blocks and can suggest alternates when a request doesn't fit, and
restructures the weekend pricing/minimum-duration rules into the schedule
below.

## Goals

### Saturday schedule

| Time band | Package options | Duration rule |
|---|---|---|
| 7:00–10:00am ("serenata") | 7-songs flat **$470** (≤25mi only) or hourly $550/hr | 7-songs: fixed 1h block. Hourly: distance-based minimum only (unchanged from today) |
| 10:00am–3:00pm | Hourly only, $550/hr | `max(1h, distance-based minimum)` |
| 3:00–9:30pm ("peak") | Hourly only, $550/hr | `max(2h, distance-based minimum)`. If this is the **first booking placed on that Saturday** (zero existing calendar events that day), the start time must land exactly on the hour |
| 9:30pm–midnight | Hourly only, $550/hr | `max(1h, distance-based minimum)` |

Saturday's earliest bookable start moves from 3:00pm to the general
7:00am floor (`hoursWindow.start`).

### Sunday schedule

| Time band | Package options | Duration rule |
|---|---|---|
| 8:00am–midnight | 7-songs flat **$470** (≤25mi only, available any time of day — no morning-only restriction) or hourly $550/hr | 7-songs: fixed 1h block. Hourly: distance-based minimum only, same as today — no time-of-day tiers, no on-hour rule |

Sunday's earliest bookable start moves from 3:00pm to 8:00am. Nothing else
about Sunday changes.

### Fragmentation avoidance

Across all of Saturday (7am–midnight), a new free-interval simulation
validates that a candidate slot fits within what's actually free — existing
bookings each padded by the existing 30-minute travel buffer on both sides —
and, when it doesn't fit (conflict, or fails the duration minimum for its
start time, or fails the on-hour rule for a first booking), returns up to
two suggested alternate slots (nearest earlier-fitting, nearest
later-fitting) instead of a bare rejection.

Sunday keeps a simple overlap check against the same buffered busy blocks —
reject on conflict, no tier logic, no suggestions.

## Non-goals

- No change to weekday pricing or the weekday 7-songs package/rules.
- No UI redesign beyond surfacing Saturday's suggested alternate slots when
  a request is rejected — the existing `<input type="time">` free-entry
  field stays as-is.
- No change to lead-time, deposit, or cancellation rules.
- No admin UI for editing these constants — they land in `PRICING` like the
  existing weekend constants.
- The Sunday "serenata any time of day" flat package is taken literally as
  stated — no morning-only restriction on Sunday, unlike Saturday.

## Design

### 1. New pricing constants (`src/lib/data/pricing.ts`)

```ts
weekendSevenSongsFlat: 470,       // shared Sat + Sun serenata package price
saturdayEarliestStart: '07:00',
sundayEarliestStart: '08:00',
saturdaySerenataEnd: '10:00',     // 07:00–10:00 serenata window (Saturday only)
saturdayMidDayEnd: '15:00',       // 10:00–15:00 midday tier
saturdayPeakEnd: '21:30',         // 15:00–21:30 peak tier; >=21:30 is late tier
saturdayMidDayMinHours: 1,
saturdayPeakMinHours: 2,
saturdayLateMinHours: 1,
travelBufferMinutes: 30,          // replaces the literal 30*60*1000 in availability.ts
```

`weekdayRadiusMi` (already 25mi) is reused as the distance restriction for
the weekend serenata package — same radius, no new constant needed.
`weekendEarliestStart` is removed; `saturdayEarliestStart` /
`sundayEarliestStart` replace it.

### 2. Pure quote engine changes (`src/lib/quote/index.ts`)

`getQuote` stays pure (no calendar access) and gains:

- Per-day earliest-start check: Saturday uses `saturdayEarliestStart`,
  Sunday uses `sundayEarliestStart`, weekday keeps `hoursWindow.start`
  (existing `outside_hours` check already covers weekday).
- `effectivePackage` extended: `seven_songs` is now also allowed when
  `distanceMi <= weekdayRadiusMi` and either (a) it's Sunday, or (b) it's
  Saturday with `startTime` inside the 7:00–10:00 serenata window. The
  weekday condition (`weekdayLocalRate`) is unchanged. Otherwise falls back
  to `hourly`, same as today.
- Weekend `seven_songs` prices at `weekendSevenSongsFlat` ($470) instead of
  `sevenSongsFlat` ($380); weekday pricing unchanged.
- For `hourly` weekend bookings, `enforcedHours = max(durationHours,
  distanceBasedMinimum, saturdayTimeTierMinimum)`, where
  `saturdayTimeTierMinimum` is 0 for Saturday 7-10am and all of Sunday
  (distance table is the only floor), 1 for Saturday 10am-3pm, 2 for
  Saturday 3-9:30pm, 1 for Saturday 9:30pm-midnight.
- `minimumApplied` is set whenever `enforcedHours > durationHours`, exactly
  as today — the reason doesn't distinguish which floor (distance vs. time
  tier) triggered it, just requested vs. enforced.
- The on-the-hour rule is **not** enforced here — it depends on whether
  other bookings exist that day, which this pure function has no access to.
  It's enforced in the calendar-aware layer below.

### 3. Calendar adapter change (`src/lib/calendar/google.ts`)

Replace the boolean check with a busy-blocks fetch:

```ts
export type BusyBlock = { startUtc: Date; endUtc: Date }

export async function getBusyBlocks(dayStartUtc: Date, dayEndUtc: Date): Promise<BusyBlock[]>
```

Implemented via the same `freebusy.query` call, returning the raw busy
intervals instead of a boolean. `checkAvailability` is removed; both
Saturday and Sunday validation move to the new layer below, which now owns
the 30-minute buffer math (`travelBufferMinutes`) previously inlined in
`availability.ts`.

### 4. Free-interval simulation (new pure module)

New file, e.g. `src/lib/scheduling/free-intervals.ts` — pure,
unit-testable, no calendar or network access:

```ts
export type Slot = { startTime: string; endTime: string } // "HH:mm" LA wall time

export function freeIntervals(
  dayWindow: { start: string; end: string },
  busyBlocks: { startTime: string; endTime: string }[], // already LA wall time
  travelBufferMinutes: number,
): { start: string; end: string }[]

export function validateSaturdaySlot(
  candidate: Slot,
  free: { start: string; end: string }[],
  isFirstBookingOfDay: boolean,
  minimumHoursForStart: (startTime: string) => number,
): { ok: true } | { ok: false; reason: 'conflict' | 'below_minimum' | 'not_on_hour'; suggestions: Slot[] }

export function validateSundaySlot(
  candidate: Slot,
  free: { start: string; end: string }[],
): { ok: true } | { ok: false; reason: 'conflict' }
```

Algorithm for `freeIntervals`: pad each busy block by `travelBufferMinutes`
on both sides, merge overlaps, subtract from `dayWindow` to get free
intervals (computed in minutes-since-midnight, formatted back to `"HH:mm"`
at the boundary).

Algorithm for `validateSaturdaySlot`:

1. Candidate is valid if fully contained in one free interval, its duration
   meets `minimumHoursForStart(candidate.startTime)` (the same time-tier +
   distance logic as `getQuote`, passed in so both layers agree), and — only
   when `isFirstBookingOfDay` and the start falls in the 3:00–9:30pm peak
   window — the start is exactly on the hour.
2. If invalid, generate suggestions: for free intervals that could plausibly
   host the booking, try (a) the interval's own start time (snapped to
   on-hour when the peak/first-booking rule applies), extended to that
   start's required minimum duration, and (b) the customer's originally
   requested start extended to its required minimum, if it still fits its
   containing interval. Keep only slots that independently pass step 1,
   dedupe, sort by start time, return at most two.
3. `isFirstBookingOfDay` is `true` when `busyBlocks` is empty for that
   Saturday.

`validateSundaySlot` just checks containment in a free interval — no tiers,
no on-hour rule, no suggestions.

This module has zero I/O — tests feed synthetic `busyBlocks` fixtures.

### 5. Integration

`checkAvailabilityAction` (`src/app/actions/availability.ts`):

- Fetch `getBusyBlocks` for the full LA-local calendar day (converted to
  UTC), convert to LA wall-time `{startTime, endTime}` pairs.
- Saturday: call `freeIntervals` + `validateSaturdaySlot`, with
  `minimumHoursForStart` mirroring the tier logic in `getQuote` (needs the
  already-computed `distanceMi` for the distance floor).
- Sunday: call `freeIntervals` + `validateSundaySlot`.
- Return shape becomes
  `{ checked: true; available: boolean; suggestions?: Slot[] } | { checked: false }`.

`startCheckoutAction` (`src/app/actions/booking.ts`):

- Same validation, server-side, before creating the Stripe checkout session
  and calendar hold — this is the existing race-condition guard, rebuilt on
  the new validators instead of the boolean check.

`booking-wizard.tsx`:

- When `checkAvailabilityAction` returns `available: false` with
  `suggestions` (Saturday only — Sunday never returns suggestions), render
  them as clickable alternate times instead of a bare "not available"
  message.

## Testing

- Unit tests for `freeIntervals` / `validateSaturdaySlot` /
  `validateSundaySlot` with synthetic fixtures (no live calendar calls):
  empty Saturday + off-hour peak request (rejected, on-hour suggestion),
  empty Saturday + on-hour peak request (accepted), 5-7pm booked + 8-9pm
  request (rejected — fails 2h peak minimum at that start — suggestions
  land on 7:30-9:30 and 9:30-10:30), serenata-window booking at 8am with a
  40-mile distance (7-songs unavailable beyond 25mi, falls back to hourly
  with the distance minimum), 10am-3pm request below 1h (raised to 1h),
  Sunday conflict (rejected, no suggestions), Sunday 8am request (accepted,
  previously blocked by the old 3pm floor).
- Unit tests for `getQuote`'s new package eligibility and
  `max(time-tier, distance)` minimum, extending `quote.test.ts`.
- Update `availability.test.ts` / `availability-disabled.test.ts` for the
  new return shape.
- Update `booking.test.ts` / `booking-maps-disabled.test.ts` for the
  server-side re-check using the new validators.
- E2E: extend the existing booking wizard e2e test with a same-day
  Saturday double-booking scenario asserting suggested slots render.
