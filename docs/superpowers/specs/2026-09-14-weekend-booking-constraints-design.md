# Weekend Booking Constraints — Design

Status: approved by Cesar 2026-09-14, ready for implementation planning.

## Problem

Saturday and Sunday are the busiest days. The booking system currently only
enforces a flat "weekend bookings start at 3:00pm or later" rule
(`weekendEarliestStart` in `pricing.ts`) plus a distance-based hour minimum
(`minimumTable`). It has no concept of:

- A shorter minimum duration late in the evening (bookings after 9:30pm
  don't need the full peak-hours commitment).
- Multiple bookings landing on the same calendar day and leaving unusable
  gaps between them (e.g. a 5-7pm gig followed by an 8-9pm gig leaves an
  idle half hour nobody can fill).
- Steering the first customer to book a given Saturday toward a clean,
  on-the-hour start, so the rest of the day stays easy to fill.

This spec covers all three, replacing the boolean `checkAvailability` calendar
check with a free-interval simulation that can validate a candidate slot and
suggest alternates when it doesn't fit.

## Goals

- Weekend minimum booking duration depends on start time: 2 hours for starts
  in the 3:00pm–9:30pm peak window, 1 hour for starts at/after 9:30pm. No
  upper cap either way — bounded only by the existing 07:00–24:00 event
  window.
- The distance-based minimum (`minimumTable`) still applies; the enforced
  minimum is `max(time-based minimum, distance-based minimum)`. A 40-mile
  customer requesting 5pm still gets a 4-hour minimum, not 2 — the UI must
  keep surfacing that via the existing `minimumApplied` field.
- The *first* booking placed on a given Saturday or Sunday (i.e. the day
  currently has zero calendar events in the bookable window) must start
  exactly on the hour (4:00, 5:00, 6:00pm, etc — 3:00pm and 9:00pm count too,
  since they're on-hour marks within the window).
- Once a day has at least one booking, later same-day bookings are governed
  purely by free-interval math (no on-hour requirement) — they just need to
  fit within what's actually free, using the existing 30-minute travel
  buffer already applied before/after each calendar event.
- When a requested slot doesn't fit (conflicts, violates minimum duration
  for its start time, or fails the on-hour rule for a first booking), the
  system computes up to two alternate suggestions — nearest earlier-fitting
  slot and nearest later-fitting slot — so the customer/wizard can offer
  "how about 7:30–9:30pm instead?" rather than a bare rejection.

## Non-goals

- No change to weekday behavior, pricing, or the 7-songs package logic.
- No UI redesign beyond surfacing suggested alternate slots when a request
  is rejected — the existing `<input type="time">` free-entry field stays.
- No change to lead-time, deposit, or cancellation rules.
- No admin UI for editing these new constants — they land in `PRICING`
  alongside the existing weekend constants, same as today.

## Design

### 1. New pricing constants

Add to `PRICING` in `src/lib/data/pricing.ts`:

```ts
weekendPeakEnd: '21:30',       // 9:30pm cutover
weekendPeakMinHours: 2,
weekendLateMinHours: 1,
travelBufferMinutes: 30,       // currently hardcoded in availability.ts
```

`travelBufferMinutes` replaces the literal `30 * 60 * 1000` in
`availability.ts` and becomes the single source of truth used by both the
quote engine's `calendarBlockMinutes` math and the new free-interval
simulation.

### 2. Pure quote engine changes (`src/lib/quote/index.ts`)

`getQuote` has no calendar access and stays that way — it only knows about
the request itself, not other bookings that day. It changes to:

- Keep the existing `weekend_early_start` check (start ≥ 3:00pm).
- Compute `timeBasedMinimum = startTime < weekendPeakEnd ? weekendPeakMinHours : weekendLateMinHours` for weekend requests.
- Compute `enforcedHours = max(durationHours, timeBasedMinimum, distanceBasedMinimum)` (weekday logic unchanged).
- `minimumApplied` is set whenever `enforcedHours > durationHours`, same as today — the reason doesn't need to distinguish time-based vs distance-based, just report requested vs enforced.
- The on-the-hour rule is **not** enforced here, since it depends on whether other bookings exist that day. It's enforced in the calendar-aware layer (below).

### 3. Calendar adapter change (`src/lib/calendar/google.ts`)

Replace the boolean check with a busy-blocks fetch:

```ts
export type BusyBlock = { startUtc: Date; endUtc: Date }

export async function getBusyBlocks(dayStartUtc: Date, dayEndUtc: Date): Promise<BusyBlock[]>
```

Implemented via the same `freebusy.query` call, returning the raw busy
intervals instead of a boolean. `checkAvailability` is removed; its one
caller (`availability.ts`) moves to the new free-interval validator below.

### 4. Free-interval simulation (new pure module)

New file, e.g. `src/lib/scheduling/free-intervals.ts` — pure, unit-testable,
no calendar or network access:

```ts
export type Slot = { startTime: string; endTime: string } // "HH:mm" LA wall time

export function freeIntervals(
  dayWindow: { start: string; end: string }, // e.g. weekend bookable window
  busyBlocks: { startTime: string; endTime: string }[], // already LA wall time
  travelBufferMinutes: number,
): { start: string; end: string }[]

export function validateSlot(
  candidate: Slot,
  free: { start: string; end: string }[],
  isFirstBookingOfDay: boolean,
  minimumHoursForStart: (startTime: string) => number,
): { ok: true } | { ok: false; reason: 'conflict' | 'below_minimum' | 'not_on_hour'; suggestions: Slot[] }
```

Algorithm:

1. Pad each busy block by `travelBufferMinutes` on both sides, merge
   overlaps, subtract from `dayWindow` to get free intervals (all in minutes
   since midnight internally, formatted back to `"HH:mm"` at the boundary).
2. A candidate is valid if it's fully contained in one free interval, its
   duration meets `minimumHoursForStart(candidate.startTime)`, and — only
   when `isFirstBookingOfDay` — its start is exactly on the hour.
3. If invalid, generate suggestions by trying, for each free interval that
   could plausibly host the booking: (a) the interval's own start time
   (snapped to on-hour if `isFirstBookingOfDay`, otherwise used as-is —
   interval starts are already buffer-aligned), extended to that start's
   required minimum duration; (b) the customer's originally requested
   start, extended to its required minimum duration, if that still fits its
   containing interval. Keep only slots that independently pass step 2,
   dedupe, sort by start time, return at most two.
4. `isFirstBookingOfDay` is `true` when `busyBlocks` is empty for that day.

This module has zero I/O — feed it synthetic `busyBlocks` fixtures in tests
covering: empty day + off-hour request (rejected, on-hour suggestion
offered), empty day + on-hour request (accepted), 5-7pm booked + request for
8-9pm (rejected — fails 2h peak minimum at that start — suggestions land on
7:30-9:30 and 9:30-10:30), request landing exactly in a gap that satisfies
duration (accepted), 40-mile customer at 5pm (`minimumHoursForStart` isn't
enough alone — the distance minimum is applied upstream in `getQuote`, this
module only owns the time-based side, see integration below).

### 5. Integration

`checkAvailabilityAction` (`src/app/actions/availability.ts`):

- Fetch `getBusyBlocks` for the full calendar day (LA-local 00:00–24:00,
  converted to UTC).
- Convert busy blocks to LA wall-time `{startTime, endTime}` pairs.
- Call `freeIntervals` + `validateSlot`, using
  `minimumHoursForStart = (t) => max(weekendPeakMinHours/weekendLateMinHours by t, distanceBasedMinimum)` —
  distance minimum is passed in from the quote already computed client-side
  (or recomputed server-side from `distanceMi`), so this action's minimum
  check matches what `getQuote` already enforced.
- Return shape becomes
  `{ checked: true; available: boolean; suggestions?: Slot[] } | { checked: false }`.

`startCheckoutAction` (`src/app/actions/booking.ts`):

- Same validation, server-side, before creating the Stripe checkout session
  and calendar hold — this is the existing race-condition guard, just
  rebuilt on the new validator instead of the boolean check.

`booking-wizard.tsx`:

- When `checkAvailabilityAction` returns `available: false` with
  `suggestions`, render them as clickable alternate times instead of a bare
  "not available" message.

## Open assumption

This applies identically to Saturday and Sunday, matching how the rest of
the weekend logic (`hourlyWeekend`, `weekendEarliestStart`) already treats
both days the same. Flag if Sunday should be excluded.

## Testing

- Unit tests for `freeIntervals` / `validateSlot` with synthetic fixtures
  (no live calendar calls) — the scenarios listed in section 4.
- Unit tests for `getQuote`'s new `max(time-based, distance-based)` minimum,
  extending the existing `quote.test.ts`.
- Update `availability.test.ts` / `availability-disabled.test.ts` for the
  new return shape.
- Update `booking.test.ts` / `booking-maps-disabled.test.ts` for the
  server-side re-check using the new validator.
- E2E: extend the existing booking wizard e2e test with a same-day
  double-booking scenario asserting suggested slots render.
