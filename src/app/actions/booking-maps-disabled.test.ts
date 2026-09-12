import { expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  features: { stripe: true, calendar: true, maps: false },
  env: { NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' },
}))
vi.mock('@/lib/geo/geocode', () => ({ geocodeAddress: vi.fn() }))
// The maps-disabled path returns before reaching calendar/stripe, but `./booking` still
// statically imports the real `googleapis` and `stripe` SDKs. Mock them (as booking.test.ts
// does) so this test doesn't pay for transforming those heavy dependencies — unmocked, that
// transform intermittently exceeded the default test timeout under full-suite parallel load.
vi.mock('@/lib/calendar/google', () => ({ createHoldEvent: vi.fn() }))
vi.mock('@/lib/payments/stripe', () => ({ createDepositCheckoutSession: vi.fn() }))

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

test('returns not_configured and never geocodes when the maps feature is off', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  const { startCheckoutAction } = await import('./booking')

  const result = await startCheckoutAction({ ok: false }, formData(validFields))

  expect(result).toEqual({ ok: false, error: 'not_configured' })
  expect(geocodeAddress).not.toHaveBeenCalled()
})
