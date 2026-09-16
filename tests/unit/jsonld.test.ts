import { expect, test } from 'vitest'
import { breadcrumb, faqPage, localBusiness, service } from '@/lib/seo/jsonld'

test('localBusiness has required fields', () => {
  const ld = localBusiness({ areaServed: ['Los Angeles', 'Downey'] }) as Record<string, unknown>
  expect(ld['@context']).toBe('https://schema.org')
  expect(ld['@type']).toEqual(['LocalBusiness', 'MusicGroup'])
  expect(ld.name).toBe('Mariachi El Cuis')
  expect(ld.telephone).toBe('+16269220091')
  expect((ld.areaServed as string[]).length).toBe(2)
})

test('faqPage maps items to Question/Answer', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ld = faqPage([{ q: 'How much?', a: '$500/hr' }]) as any
  expect(ld['@type']).toBe('FAQPage')
  expect(ld.mainEntity[0]['@type']).toBe('Question')
  expect(ld.mainEntity[0].acceptedAnswer.text).toBe('$500/hr')
})

test('breadcrumb positions are 1-indexed', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ld = breadcrumb([{ name: 'Home', url: 'https://x/' }, { name: 'Services', url: 'https://x/services' }]) as any
  expect(ld.itemListElement[1].position).toBe(2)
})

test('service references the business', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ld = service({ locale: 'en', url: 'https://mariachielcuis.com/en/services' }) as any
  expect(ld['@type']).toBe('Service')
  expect(ld.provider.name).toBe('Mariachi El Cuis')
})

test('localBusiness declares opening hours matching the booking windows', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ld = localBusiness({ areaServed: [] }) as any
  const specs = ld.openingHoursSpecification
  expect(specs).toHaveLength(3)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weekday = specs.find((s: any) => Array.isArray(s.dayOfWeek))
  expect(weekday.dayOfWeek).toContain('Monday')
  expect(weekday.opens).toBe('07:00')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(specs.find((s: any) => s.dayOfWeek === 'Saturday').opens).toBe('07:00')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(specs.find((s: any) => s.dayOfWeek === 'Sunday').opens).toBe('08:00')
})

test('service offer catalog mirrors PRICING constants', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ld = service({ locale: 'en', url: 'https://mariachielcuis.com/en/services' }) as any
  const offers = ld.hasOfferCatalog.itemListElement
  expect(offers).toHaveLength(3)
  expect(offers[0].priceSpecification.price).toBe(380)
  expect(offers[1].priceSpecification).toMatchObject({
    price: 500,
    priceCurrency: 'USD',
    unitCode: 'HUR',
  })
  expect(offers[2].priceSpecification.price).toBe(550)
})
