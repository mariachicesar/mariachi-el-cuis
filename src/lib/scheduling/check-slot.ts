import 'server-only'
import { laDayBoundsUtc, utcToLaMinutesOfDay, weekdayIndexOf } from '@/lib/quote/timezone'
import { minutesOf } from '@/lib/quote/time-of-day'
import { PRICING } from '@/lib/data/pricing'
import { getBusyBlocks } from '@/lib/calendar/google'
import { freeIntervals, validateSaturdaySlot, validateSimpleSlot, type Slot } from './free-intervals'
import { saturdayMinimumMinutesForStart } from './saturday-tiers'

export type SlotCheckResult =
  | { available: true }
  | { available: false; reason: 'conflict' | 'below_minimum' | 'not_on_hour'; suggestions: Slot[] }

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

  // General lower bound for the app's bookable hours (7am). This is not a
  // day-specific floor: Saturday's and Sunday's own, tighter per-day floors
  // are already enforced upstream by getQuote before checkSlot is ever
  // reached, so this only needs to be the app-wide earliest bound.
  const dayWindow = { startMin: minutesOf(PRICING.hoursWindow.start), endMin: minutesOf(PRICING.hoursWindow.end) }
  const free = freeIntervals(dayWindow, rawBusy, PRICING.travelBufferMinutes)

  const isSaturday = weekdayIndexOf(eventDate) === 6
  if (isSaturday) {
    const result = validateSaturdaySlot(rawCandidate, free, isFirstBookingOfDay, saturdayMinimumMinutesForStart)
    return result.ok ? { available: true } : { available: false, reason: result.reason, suggestions: result.suggestions }
  }

  const result = validateSimpleSlot(rawCandidate, free)
  if (result.ok) return { available: true }
  return { available: false, reason: 'conflict', suggestions: result.suggestions }
}
