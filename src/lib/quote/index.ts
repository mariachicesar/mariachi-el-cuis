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
