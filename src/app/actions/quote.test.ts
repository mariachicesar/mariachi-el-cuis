import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { maps: true }, env: {} }))
vi.mock('@/lib/geo/geocode', () => ({ geocodeAddress: vi.fn() }))

afterEach(() => vi.resetAllMocks())

test('rejects malformed input without geocoding', async () => {
  const { getQuoteAction } = await import('./quote')
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  const result = await getQuoteAction({ eventDate: 'not-a-date' })
  expect(result).toEqual({ ok: false, error: 'validation' })
  expect(geocodeAddress).not.toHaveBeenCalled()
})

test('returns address_not_found when geocoding fails', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue(null)
  const { getQuoteAction } = await import('./quote')

  const result = await getQuoteAction({
    eventDate: '2026-06-01',
    startTime: '15:00',
    durationHours: 1,
    packageType: 'seven_songs',
    address: 'nowhere, nowhere',
  })
  expect(result).toEqual({ ok: false, error: 'address_not_found' })
})

test('runs the quote engine with the geocoded distance/county/state', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587, // same as siteConfig base -> distance 0
    county: 'Los Angeles County',
    state: 'CA',
  })
  const { getQuoteAction } = await import('./quote')

  const result = await getQuoteAction({
    eventDate: '2026-12-15',
    startTime: '15:00',
    durationHours: 1,
    packageType: 'seven_songs',
    address: '90011',
  })
  expect(result.ok).toBe(true)
  if (result.ok) expect(result.quote.status).toBe('ok')
})
