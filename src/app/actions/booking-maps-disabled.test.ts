import { expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  features: { stripe: true, calendar: true, maps: false },
  env: { NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' },
}))
vi.mock('@/lib/geo/geocode', () => ({ geocodeAddress: vi.fn() }))

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
