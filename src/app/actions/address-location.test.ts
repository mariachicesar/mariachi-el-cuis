import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { maps: true } }))
vi.mock('@/lib/geo/geocode', () => ({
  GeocodeConfigurationError: class GeocodeConfigurationError extends Error {},
  geocodeAddress: vi.fn(),
}))

afterEach(() => vi.resetAllMocks())

test('returns the geocoded location for a valid address', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Los Angeles County',
    state: 'CA',
  })
  const { getAddressLocationAction } = await import('./address-location')

  await expect(getAddressLocationAction({ address: '90011' })).resolves.toEqual({
    ok: true,
    location: { lat: 34.0074, lng: -118.2587 },
  })
})

test('rejects a too-short address without geocoding', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  const { getAddressLocationAction } = await import('./address-location')

  await expect(getAddressLocationAction({ address: '90' })).resolves.toEqual({
    ok: false,
    error: 'validation',
  })
  expect(geocodeAddress).not.toHaveBeenCalled()
})

test('returns address_not_found when geocoding finds nothing', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue(null)
  const { getAddressLocationAction } = await import('./address-location')

  await expect(getAddressLocationAction({ address: 'nowhere, nowhere' })).resolves.toEqual({
    ok: false,
    error: 'address_not_found',
  })
})
