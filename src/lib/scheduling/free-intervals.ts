import { formatMinutes } from '@/lib/quote/time-of-day'
import { isSaturdayPeakStart } from './saturday-tiers'

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

function snapToHalfHour(startMin: number): number {
  return Math.ceil(startMin / 30) * 30
}

/**
 * Saturday suggestions. When the day already has a booking, prefer slots that
 * sit directly against the booked gaps (back-to-back), so the day packs as many
 * bookable hours as possible — e.g. with 3:00-5:00pm booked, suggest the slot
 * ending at 3:00pm rather than a distant tier boundary. On an empty day the
 * peak on-hour first-booking rule still applies to suggestions in the peak
 * window (to avoid fragmenting it). Each suggestion uses its own start's tier
 * minimum, so pre-3pm suggestions can be 1h.
 */
function buildSaturdaySuggestions(
  candidate: Interval,
  free: Interval[],
  isFirstBookingOfDay: boolean,
  minimumMinutesForStart: (startMin: number) => number,
): Slot[] {
  const requestedDuration = candidate.endMin - candidate.startMin

  const valid: Interval[] = []
  for (const interval of free) {
    for (let start = snapToHalfHour(interval.startMin); start < interval.endMin; start += 30) {
      if (isFirstBookingOfDay && isSaturdayPeakStart(start) && start % 60 !== 0) continue
      const end = start + Math.max(requestedDuration, minimumMinutesForStart(start))
      if (end > interval.endMin) continue
      valid.push({ startMin: start, endMin: end })
    }
  }

  // Nearest slot on each side of the request (gap-adjacent first), falling
  // back to the two nearest overall when only one side has room. Ties in
  // distance go to the earlier start.
  const before = valid
    .filter((v) => v.startMin < candidate.startMin)
    .sort(
      (a, b) =>
        Math.abs(a.startMin - candidate.startMin) - Math.abs(b.startMin - candidate.startMin) ||
        a.startMin - b.startMin,
    )
  const after = valid
    .filter((v) => v.startMin >= candidate.startMin)
    .sort(
      (a, b) =>
        Math.abs(a.startMin - candidate.startMin) - Math.abs(b.startMin - candidate.startMin) ||
        a.startMin - b.startMin,
    )
  const picked: Interval[] = []
  if (before.length) picked.push(before[0]!)
  if (after.length) picked.push(after[0]!)
  if (picked.length < 2) {
    const ranked = [...valid].sort(
      (a, b) =>
        Math.abs(a.startMin - candidate.startMin) - Math.abs(b.startMin - candidate.startMin) ||
        a.startMin - b.startMin,
    )
    for (const v of ranked) {
      if (picked.length >= 2) break
      if (!picked.includes(v)) picked.push(v)
    }
  }

  const unique = Array.from(new Map(picked.map((v) => [v.startMin, v])).values()).sort(
    (a, b) => a.startMin - b.startMin,
  )
  return unique.slice(0, 2).map((v) => ({ startTime: formatMinutes(v.startMin), endTime: formatMinutes(v.endMin) }))
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

function buildSimpleSuggestions(candidate: Interval, free: Interval[]): Slot[] {
  const duration = candidate.endMin - candidate.startMin
  const fits: Interval[] = []
  for (const interval of free) {
    const start = snapToHalfHour(interval.startMin)
    if (start + duration <= interval.endMin) fits.push({ startMin: start, endMin: start + duration })
  }
  if (fits.length === 0) return []

  const before = fits.filter((v) => v.endMin <= candidate.startMin)
  const after = fits.filter((v) => v.startMin >= candidate.endMin)
  const picked: Interval[] = []
  if (before.length) picked.push(before[before.length - 1]!)
  if (after.length) picked.push(after[0]!)
  const fallback = picked.length ? picked : fits.slice(0, 2)

  return fallback.map((v) => ({ startTime: formatMinutes(v.startMin), endTime: formatMinutes(v.endMin) }))
}

export function validateSimpleSlot(
  candidate: Interval,
  free: Interval[],
): { ok: true } | { ok: false; reason: 'conflict'; suggestions: Slot[] } {
  const host = free.find((i) => fitsWithin(candidate, i))
  if (host) return { ok: true }
  return { ok: false, reason: 'conflict', suggestions: buildSimpleSuggestions(candidate, free) }
}
