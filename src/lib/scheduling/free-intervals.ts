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
