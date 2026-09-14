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
