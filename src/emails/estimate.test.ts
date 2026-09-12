import { render } from '@react-email/render'
import { expect, test } from 'vitest'
import { EstimateEmail } from './estimate'
import type { QuoteResult } from '@/lib/quote/types'

test('renders the price breakdown for an ok quote', async () => {
  const quote: QuoteResult = {
    status: 'ok',
    currency: 'USD',
    lineItems: [{ key: 'seven_songs', amount: 380 }],
    enforcedHours: 1,
    total: 380,
    deposit: 50,
    balanceDue: 330,
    rush: false,
    calendarBlockMinutes: 120,
  }
  const html = await render(EstimateEmail({ locale: 'en', quote }))
  expect(html).toContain('380')
  expect(html).toContain('50')
  expect(html).toContain('330')
})

test('renders the call-us message for a call_required quote', async () => {
  const quote: QuoteResult = { status: 'call_required', reason: 'lead_time' }
  const html = await render(EstimateEmail({ locale: 'es', quote }))
  expect(html).toContain('(626) 922-0091')
})

test('renders the rush note only when the quote is rush', async () => {
  const rushQuote: QuoteResult = {
    status: 'ok',
    currency: 'USD',
    lineItems: [{ key: 'hourly_rate', amount: 500 }],
    enforcedHours: 1,
    total: 500,
    deposit: 150,
    balanceDue: 350,
    rush: true,
    calendarBlockMinutes: 120,
  }
  const html = await render(EstimateEmail({ locale: 'en', quote: rushQuote }))
  expect(html).toContain('150')
})
