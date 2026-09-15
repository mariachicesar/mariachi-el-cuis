import { PRICING } from '@/lib/data/pricing'
import { formatMinutes, minutesOf } from '@/lib/quote/time-of-day'
import { weekdayIndexOf } from '@/lib/quote/timezone'

/**
 * Debounce delay (ms) for the booking wizard's price-quote and
 * availability-check effects.
 *
 * Fetching (geocoding + pricing, or the calendar availability check) is
 * debounced by `DEBOUNCE_MS` so a request isn't fired on every keystroke.
 * Clearing an already-shown quote/availability result when inputs become
 * invalid must NOT wait out that same debounce — otherwise a stale
 * price/availability status lingers on screen for up to `DEBOUNCE_MS` after,
 * say, the address is cleared. `effectDelayMs` picks the right delay for
 * each case: the fetch path still waits `DEBOUNCE_MS`, but the reset path
 * fires on the next tick (delay 0) instead. Both paths run inside a
 * `setTimeout` callback either way (never synchronously in the effect
 * body), so `react-hooks/set-state-in-effect` stays satisfied regardless of
 * which delay is chosen.
 */
export const DEBOUNCE_MS = 500

export function effectDelayMs(shouldDebounce: boolean): number {
  return shouldDebounce ? DEBOUNCE_MS : 0
}

export function sevenSongsAvailableForTime(eventDate: string, startTime: string): boolean {
  if (!eventDate) return true
  const day = weekdayIndexOf(eventDate)
  if (day === 0) return true
  if (day !== 6) return true

  const startMin = minutesOf(startTime)
  return (
    startMin >= minutesOf(PRICING.saturdayEarliestStart) &&
    startMin < minutesOf(PRICING.saturdaySerenataEnd)
  )
}

export function minimumDurationForTime(eventDate: string, startTime: string): number {
  if (!eventDate || weekdayIndexOf(eventDate) !== 6) return 1
  const startMin = minutesOf(startTime)
  return startMin >= minutesOf(PRICING.saturdayMidDayEnd) &&
    startMin < minutesOf(PRICING.saturdayPeakEnd)
    ? PRICING.saturdayPeakMinHours
    : 1
}

export function slotDurationHours(startTime: string, endTime: string): number {
  return Math.max(1, (minutesOf(endTime) - minutesOf(startTime)) / 60)
}

export function weekendStartTimes(eventDate: string): string[] {
  const day = weekdayIndexOf(eventDate)
  if (day !== 0 && day !== 6) return []

  const firstStart = minutesOf(day === 6 ? PRICING.saturdayEarliestStart : PRICING.sundayEarliestStart)
  const latestStart = minutesOf(PRICING.hoursWindow.end) - 60
  const times: string[] = []
  for (let startMin = firstStart; startMin <= latestStart; startMin += 30) {
    times.push(formatMinutes(startMin))
  }
  return times
}

export function formatTime12Hour(time: string): string {
  const [hour, minute] = time.split(':').map(Number) as [number, number]
  const period = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
}
