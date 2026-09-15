import { afterEach, expect, test, vi } from 'vitest'
import { GeocodeConfigurationError, geocodeAddress, suggestAddresses } from './geocode'

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetchOnce(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) }),
  )
}

test('parses county and state from a successful geocode', async () => {
  mockFetchOnce({
    status: 'OK',
    results: [
      {
        geometry: { location: { lat: 34.0, lng: -118.25 } },
        address_components: [
          { long_name: 'Los Angeles County', short_name: 'Los Angeles County', types: ['administrative_area_level_2', 'political'] },
          { long_name: 'California', short_name: 'CA', types: ['administrative_area_level_1', 'political'] },
        ],
      },
    ],
  })

  const result = await geocodeAddress('123 Main St, Los Angeles, CA')
  expect(result).toEqual({ lat: 34.0, lng: -118.25, county: 'Los Angeles County', state: 'CA' })
})

test('returns null on ZERO_RESULTS', async () => {
  mockFetchOnce({ status: 'ZERO_RESULTS', results: [] })
  expect(await geocodeAddress('not a real address')).toBeNull()
})

test('returns formatted address suggestions from matching geocodes', async () => {
  mockFetchOnce({
    status: 'OK',
    results: [
      { formatted_address: '123 Main St, Los Angeles, CA 90011, USA', geometry: { location: { lat: 34, lng: -118 } }, address_components: [] },
      { formatted_address: '123 Main St, Bell, CA 90201, USA', geometry: { location: { lat: 34.1, lng: -118.2 } }, address_components: [] },
    ],
  })

  await expect(suggestAddresses('123 Main St')).resolves.toEqual([
    '123 Main St, Los Angeles, CA 90011, USA',
    '123 Main St, Bell, CA 90201, USA',
  ])
})

test('throws a configuration error when Google rejects the API key', async () => {
  mockFetchOnce({ status: 'REQUEST_DENIED', error_message: 'API key restriction mismatch', results: [] })
  await expect(geocodeAddress('90011')).rejects.toBeInstanceOf(GeocodeConfigurationError)
})

test('returns null on a non-OK HTTP response', async () => {
  mockFetchOnce({}, false)
  expect(await geocodeAddress('anything')).toBeNull()
})

test('county/state are null, not throwing, when components are missing', async () => {
  mockFetchOnce({
    status: 'OK',
    results: [{ geometry: { location: { lat: 1, lng: 2 } }, address_components: [] }],
  })
  expect(await geocodeAddress('somewhere')).toEqual({ lat: 1, lng: 2, county: null, state: null })
})
