import { expect, test } from 'vitest'
import { PRICING, pricingLines } from '@/lib/data/pricing'
import { SERVICES } from '@/lib/data/services'
import { FAQ } from '@/lib/data/faq'
import { REPERTOIRE } from '@/lib/data/repertoire'

test('pricing matches the spec', () => {
  expect(PRICING.hourlyWeekday).toBe(500)
  expect(PRICING.hourlyWeekend).toBe(550)
  expect(PRICING.sevenSongsFlat).toBe(380)
  expect(PRICING.weekdayRadiusMi).toBe(25)
  expect(PRICING.deposit).toBe(100)
  expect(PRICING.cancellationRefundDays).toBe(7)
  expect(PRICING.minimumTable).toEqual([
    { maxMi: 15, hours: 2 },
    { maxMi: 30, hours: 3 },
    { maxMi: 50, hours: 4 },
  ])
})

test('pricingLines returns non-empty localized bullets', () => {
  expect(pricingLines('es').length).toBeGreaterThan(4)
  expect(pricingLines('en').every((l) => l.length > 0)).toBe(true)
})

test('services + faq + repertoire have content', () => {
  expect(SERVICES.length).toBe(6)
  expect(FAQ.length).toBeGreaterThanOrEqual(8)
  expect(REPERTOIRE.length).toBeGreaterThanOrEqual(40)
})

test('pricingLines mentions every PRICING dollar figure, both locales', () => {
  for (const locale of ['es', 'en'] as const) {
    const text = pricingLines(locale).join(' ')
    for (const amount of [
      PRICING.sevenSongsFlat,
      PRICING.hourlyWeekday,
      PRICING.hourlyWeekend,
      PRICING.deposit,
    ]) {
      expect(text).toContain(`$${amount}`)
    }
  }
})
