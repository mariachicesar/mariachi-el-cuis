import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  features: { stripe: true, calendar: true },
  env: { NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' },
}))
vi.mock('@/lib/geo/geocode', () => ({ geocodeAddress: vi.fn() }))
vi.mock('@/lib/calendar/google', () => ({ createHoldEvent: vi.fn() }))
vi.mock('@/lib/payments/stripe', () => ({ createDepositCheckoutSession: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

afterEach(() => vi.resetAllMocks())

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const validFields = {
  eventDate: '2026-12-15',
  startTime: '15:00',
  durationHours: '1',
  packageType: 'seven_songs',
  address: '90011',
  email: 'customer@example.com',
  phone: '',
  name: 'Test Customer',
  locale: 'en',
}

test('returns the quote status as the error when the quote is not ok', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Orange County', // -> out_of_area
    state: 'CA',
  })
  const { startCheckoutAction } = await import('./booking')
  const result = await startCheckoutAction({ ok: false }, formData(validFields))
  expect(result).toEqual({ ok: false, error: 'contact_required' })
})

test('creates a calendar hold and a Stripe session, then redirects, for an ok quote', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  const { createHoldEvent } = await import('@/lib/calendar/google')
  const { createDepositCheckoutSession } = await import('@/lib/payments/stripe')

  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Los Angeles County',
    state: 'CA',
  })
  vi.mocked(createHoldEvent).mockResolvedValue('evt-1')
  vi.mocked(createDepositCheckoutSession).mockResolvedValue({
    url: 'https://checkout.stripe.com/session-1',
  })

  const { startCheckoutAction } = await import('./booking')
  await expect(startCheckoutAction({ ok: false }, formData(validFields))).rejects.toThrow(
    'NEXT_REDIRECT',
  )

  expect(createHoldEvent).toHaveBeenCalledOnce()
  const sessionArgs = vi.mocked(createDepositCheckoutSession).mock.calls[0]![0]!
  expect(sessionArgs.depositUsd).toBe(50)
  expect(sessionArgs.metadata.calendarEventId).toBe('evt-1')
  expect(sessionArgs.metadata.email).toBe('customer@example.com')

  const { redirect } = await import('next/navigation')
  expect(redirect).toHaveBeenCalledWith('https://checkout.stripe.com/session-1')
})
