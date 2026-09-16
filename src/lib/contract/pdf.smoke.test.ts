import { expect, test } from 'vitest'
import { buildAgreementPdf } from './pdf'

test('buildAgreementPdf renders a PDF buffer for a signed booking', async () => {
  const pdf = await buildAgreementPdf(
    {
      name: 'Cesar Test',
      email: 'cesar@ogawastudio.com',
      phone: '6265551234',
      eventDate: '2026-09-18',
      startTime: '16:30',
      enforcedHours: 1,
      packageType: 'seven_songs',
      address: '1153 E 24th St, Los Angeles, CA 90011, USA',
      total: 380,
      deposit: 50,
      balanceDue: 330,
      locale: 'en',
      signatureName: 'Cesar Test',
      signedAt: '2026-09-16T05:00:00.000Z',
    },
    new Date().toISOString(),
  )
  expect(pdf.length).toBeGreaterThan(500)
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
}, 60_000)
