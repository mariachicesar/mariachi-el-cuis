import { render } from '@react-email/render'
import { expect, test } from 'vitest'
import { BookingConfirmedEmail } from './booking-confirmed'

const metadata = {
  eventDate: '2026-09-19',
  startTime: '15:00',
  enforcedHours: '2',
  address: '1153 E 24th St, Los Angeles, CA 90011',
  deposit: '100',
  balanceDue: '450',
  name: 'Test Customer',
  packageType: 'hourly',
}

test('renders an Add to Google Calendar button with the correct dates (en)', async () => {
  const html = await render(BookingConfirmedEmail({ locale: 'en', metadata }))
  expect(html).toContain('Add to Google Calendar')
  expect(html).toContain('calendar.google.com/calendar/render')
  expect(html).toContain('action=TEMPLATE')
  // 2026-09-19 15:00 LA (PDT, UTC-7) = 22:00Z; +2h = 2026-09-20 00:00Z
  expect(html).toContain('20260919T220000Z')
  expect(html).toContain('20260920T000000Z')
})

test('renders the Spanish CTA label (es)', async () => {
  const html = await render(BookingConfirmedEmail({ locale: 'es', metadata }))
  expect(html).toContain('Agregar a Google Calendar')
  expect(html).toContain('calendar.google.com/calendar/render')
})

test('omits the calendar button when the schedule metadata is missing', async () => {
  const html = await render(
    BookingConfirmedEmail({
      locale: 'en',
      metadata: { deposit: '50', balanceDue: '330' },
    }),
  )
  expect(html).not.toContain('calendar.google.com/calendar/render')
})
