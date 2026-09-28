import { afterEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/env', () => ({ env: {} }))

afterEach(() => {
  vi.useRealTimers()
})

async function run(path: string) {
  const { proxy } = await import('@/proxy')
  return proxy(new NextRequest(new URL(path, 'https://mariachielcuis.com')))
}

test('before the trip ends, /hawaii renders (rewritten to the es locale)', async () => {
  vi.useFakeTimers({ now: new Date('2026-12-01T00:00:00Z') })
  const res = await run('/hawaii')
  expect(res.headers.get('x-middleware-rewrite')).toContain('/es/hawaii')
})

test('after the trip ends, /hawaii and /en/hawaii redirect home in their language', async () => {
  vi.useFakeTimers({ now: new Date('2026-12-10T00:00:00Z') })
  const es = await run('/hawaii')
  expect(es.status).toBe(307)
  expect(new URL(es.headers.get('location')!).pathname).toBe('/')
  const en = await run('/en/hawaii')
  expect(en.status).toBe(307)
  expect(new URL(en.headers.get('location')!).pathname).toBe('/en')
})
