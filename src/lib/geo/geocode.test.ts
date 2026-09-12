import { afterEach, expect, test, vi } from 'vitest'
import { geocodeAddress } from './geocode'

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
