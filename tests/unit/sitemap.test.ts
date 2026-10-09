import { expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ env: { NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' } }))

test('sitemap lists every locale version as its own <url> entry', async () => {
  const { default: sitemap } = await import('@/app/sitemap')
  const urls = sitemap().map((e) => e.url)
  expect(urls).toContain('https://mariachielcuis.com/book')
  expect(urls).toContain('https://mariachielcuis.com/en/book')
  expect(urls).toContain('https://mariachielcuis.com/en')
  expect(urls.some((u) => u.includes('/es/') || u.endsWith('/es'))).toBe(false)
  expect(new Set(urls).size).toBe(urls.length)
})
