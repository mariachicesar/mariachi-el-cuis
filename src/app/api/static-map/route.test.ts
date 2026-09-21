import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { maps: true }, env: { GOOGLE_MAPS_API_KEY: 'test-key' } }))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

function req(url: string) {
  return { nextUrl: new URL(url) } as unknown as Parameters<typeof import('./route').GET>[0]
}

test('proxies the upstream image without exposing the API key', async () => {
  const body = new ReadableStream()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, body, headers: new Headers({ 'content-type': 'image/png' }) }),
  )
  const { GET } = await import('./route')

  const res = await GET(req('https://example.com/api/static-map?lat=34.0074&lng=-118.2587'))

  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toBe('image/png')
  expect(res.headers.get('cache-control')).toContain('max-age')
  const fetchedUrl = decodeURIComponent(vi.mocked(fetch).mock.calls[0]![0] as string)
  expect(fetchedUrl).not.toContain('undefined')
  expect(fetchedUrl).toContain('34.0074,-118.2587')
})

test('rejects invalid coordinates', async () => {
  const { GET } = await import('./route')
  const res = await GET(req('https://example.com/api/static-map?lat=not-a-number&lng=-118'))
  expect(res.status).toBe(400)
})

test('returns 502 when the upstream request fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, body: null }))
  const { GET } = await import('./route')
  const res = await GET(req('https://example.com/api/static-map?lat=34&lng=-118'))
  expect(res.status).toBe(502)
})

// Kept last: vi.doMock's override of `@/lib/env` isn't undone by
// resetModules/unstubAllGlobals, so it would leak `maps: false` into
// later tests in this file.
test('returns 404 when maps is not configured', async () => {
  vi.doMock('@/lib/env', () => ({ features: { maps: false }, env: { GOOGLE_MAPS_API_KEY: 'test-key' } }))
  vi.resetModules()
  const { GET } = await import('./route')
  const res = await GET(req('https://example.com/api/static-map?lat=34&lng=-118'))
  expect(res.status).toBe(404)
})
