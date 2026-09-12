import { PRICING } from '@/lib/data/pricing'
import { laWallTimeToUtc, weekdayIndexOf } from './timezone'
import type { QuoteInput, QuoteLineItem, QuoteResult } from './types'

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number) as [number, number]
  return h * 60 + m
}

function minimumHoursFor(distanceMi: number): number {
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
  const isWeekend = dow === 0 || dow === 6
  const isWeekday = !isWeekend
  const weekdayLocalRate = isWeekday && distanceMi <= PRICING.weekdayRadiusMi
  // Exemption from distance minimum: weekday local rate, BUT only for distances 15-25 excluding the boundaries
  const hourlyMinimumExempt = weekdayLocalRate && distanceMi > 15.1 && distanceMi < 25

  if (isWeekend && minutesOf(startTime) < minutesOf(PRICING.weekendEarliestStart)) {
    return { status: 'contact_required', reason: 'weekend_early_start' }
  }

  const effectivePackage: 'seven_songs' | 'hourly' =
    packageType === 'seven_songs' && weekdayLocalRate ? 'seven_songs' : 'hourly'

  let enforcedHours: number
  let minimumApplied: { requested: number; enforced: number } | undefined

  if (effectivePackage === 'seven_songs') {
    enforcedHours = 1
  } else if (hourlyMinimumExempt) {
    enforcedHours = durationHours // "no min" for weekday, 15<distanceMi<=25, hourly
  } else {
    const minimum = minimumHoursFor(distanceMi)
    enforcedHours = Math.max(durationHours, minimum)
    if (enforcedHours > durationHours) {
      minimumApplied = { requested: durationHours, enforced: enforcedHours }
    }
  }

  const startMinutes = minutesOf(startTime)
  const endMinutes = startMinutes + enforcedHours * 60
  if (startMinutes < minutesOf(PRICING.hoursWindow.start) || endMinutes > minutesOf(PRICING.hoursWindow.end)) {
    return { status: 'contact_required', reason: 'outside_hours' }
  }

  const eventStartUtc = laWallTimeToUtc(eventDate, startTime)
  const leadHours = (eventStartUtc.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (leadHours < PRICING.leadTimeCallHours) {
    return { status: 'call_required', reason: 'lead_time' }
  }
  const rush = leadHours < PRICING.leadTimeRushHours

  const rate = isWeekend ? PRICING.hourlyWeekend : PRICING.hourlyWeekday
  const total = effectivePackage === 'seven_songs' ? PRICING.sevenSongsFlat : rate * enforcedHours
  const lineItems: QuoteLineItem[] =
    effectivePackage === 'seven_songs'
      ? [{ key: 'seven_songs', amount: PRICING.sevenSongsFlat }]
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
