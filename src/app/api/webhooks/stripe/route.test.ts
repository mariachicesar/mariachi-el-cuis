import { afterEach, expect, test, vi } from 'vitest'

const send = vi.fn()
const confirmEvent = vi.fn()
const releaseHoldEvent = vi.fn()
const verifyStripeWebhook = vi.fn()

vi.mock('@/lib/payments/stripe', () => ({ verifyStripeWebhook }))
vi.mock('@/lib/calendar/google', () => ({ confirmEvent, releaseHoldEvent }))
vi.mock('resend', () => {
  const Resend = vi.fn(function () {
    return { emails: { send } }
  })
  return { Resend }
})
vi.mock('@/lib/env', () => ({
  features: { calendar: true, email: true },
  env: {
    RESEND_API_KEY: 're_x',
    CONTACT_TO_EMAIL: 'booking@mariachielcuis.com',
    NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com',
  },
}))

afterEach(() => vi.resetAllMocks())

function request(body: string): Request {
  return new Request('https://mariachielcuis.com/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': 'sig' },
  })
}

test('rejects a request with no stripe-signature header', async () => {
  const { POST } = await import('./route')
  const res = await POST(new Request('https://x', { method: 'POST', body: '{}' }))
  expect(res.status).toBe(400)
})

test('rejects a request whose signature fails verification', async () => {
  verifyStripeWebhook.mockImplementation(() => {
    throw new Error('bad signature')
  })
  const { POST } = await import('./route')
  const res = await POST(request('{}'))
  expect(res.status).toBe(400)
})

test('checkout.session.completed confirms the calendar event and emails both parties', async () => {
  verifyStripeWebhook.mockReturnValue({
    type: 'checkout.session.completed',
    data: {
      object: {
        metadata: {
          calendarEventId: 'evt-1',
          name: 'Test Customer',
          email: 'customer@example.com',
          locale: 'en',
          deposit: '50',
          balanceDue: '330',
          eventDate: '2026-06-01',
          startTime: '15:00',
          address: '90011',
        },
      },
    },
  })
  confirmEvent.mockResolvedValue({ alreadyConfirmed: false })
  send.mockResolvedValue({})

  const { POST } = await import('./route')
  const res = await POST(request('{}'))

  expect(res.status).toBe(200)
  expect(confirmEvent).toHaveBeenCalledWith('evt-1', expect.any(Object))
  expect(send).toHaveBeenCalledTimes(2) // customer + owner
})

test('checkout.session.completed is a no-op when already confirmed (retry-safe)', async () => {
  verifyStripeWebhook.mockReturnValue({
    type: 'checkout.session.completed',
    data: { object: { metadata: { calendarEventId: 'evt-1' } } },
  })
  confirmEvent.mockResolvedValue({ alreadyConfirmed: true })

  const { POST } = await import('./route')
  const res = await POST(request('{}'))

  expect(res.status).toBe(200)
  expect(send).not.toHaveBeenCalled()
})

test('checkout.session.expired releases the calendar hold', async () => {
  verifyStripeWebhook.mockReturnValue({
    type: 'checkout.session.expired',
    data: { object: { metadata: { calendarEventId: 'evt-1' } } },
  })
  releaseHoldEvent.mockResolvedValue(undefined)

  const { POST } = await import('./route')
  const res = await POST(request('{}'))

  expect(res.status).toBe(200)
  expect(releaseHoldEvent).toHaveBeenCalledWith('evt-1')
})
