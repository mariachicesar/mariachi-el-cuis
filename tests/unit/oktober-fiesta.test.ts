import { expect, test } from 'vitest'
import { isOktoberFiestaOver, OKTOBER_FIESTA, OKTOBER_FIESTA_PATH } from '@/lib/data/oktober-fiesta'
import { musicEvent } from '@/lib/seo/jsonld'
import { allIndexablePaths } from '@/lib/seo/routes'

test('the event page stays in its upcoming state through the end of Oct 17 Pacific', () => {
  // 23:59 PDT on Oct 17 = 06:59 UTC on Oct 18
  expect(isOktoberFiestaOver(new Date('2026-10-18T06:59:00Z'))).toBe(false)
  expect(isOktoberFiestaOver(new Date('2026-10-17T22:15:00Z'))).toBe(false)
})

test('the event page switches to "thank you" from midnight Oct 18 Pacific', () => {
  expect(isOktoberFiestaOver(new Date('2026-10-18T07:00:00Z'))).toBe(true)
  expect(isOktoberFiestaOver(new Date('2027-03-01T00:00:00Z'))).toBe(true)
})

test('the event page is in the sitemap', () => {
  expect(allIndexablePaths()).toContain(OKTOBER_FIESTA_PATH)
})

test('MusicEvent JSON-LD carries the required event fields', () => {
  const ld = musicEvent({
    name: 'Mariachi El Cuis at Oktober-Fiesta 2026',
    description: 'd',
    url: 'https://example.com/en/eventos/oktober-fiesta-2026',
    image: 'https://example.com/og.jpg',
    startDate: OKTOBER_FIESTA.startDate,
    endDate: OKTOBER_FIESTA.endDate,
    location: {
      name: OKTOBER_FIESTA.venueName,
      streetAddress: OKTOBER_FIESTA.streetAddress,
      addressLocality: OKTOBER_FIESTA.city,
      addressRegion: OKTOBER_FIESTA.region,
      postalCode: OKTOBER_FIESTA.postalCode,
    },
    organizer: { name: OKTOBER_FIESTA.hostName, url: OKTOBER_FIESTA.hostUrl },
  })
  expect(ld.startDate).toBe('2026-10-17T15:15:00-07:00')
  expect(ld.endDate).toBe('2026-10-17T15:45:00-07:00')
  expect(ld.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode')
  expect(ld.isAccessibleForFree).toBe(true)
  expect(ld.location.address.addressLocality).toBe('South Pasadena')
  expect(ld.organizer.name).toBe('Vecinos de South Pasadena')
  expect(ld.performer).toMatchObject({ '@type': 'MusicGroup', name: 'Mariachi El Cuis' })
})
