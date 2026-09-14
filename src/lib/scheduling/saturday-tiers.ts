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
