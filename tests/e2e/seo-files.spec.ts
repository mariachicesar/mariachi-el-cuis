import { expect, test } from '@playwright/test'

test('robots.txt allows all + names AI bots + points to sitemap', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text()
  expect(txt).toMatch(/User-Agent: \*/i)
  expect(txt).toMatch(/ClaudeBot/)
  expect(txt).toMatch(/GPTBot/)
  expect(txt).toContain('Sitemap: https://mariachielcuis.com/sitemap.xml')
  expect(txt).toMatch(/Disallow: \/admin/)
})

test('sitemap lists home + a city + a guide with hreflang alternates', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  // `alternatesFor` (see src/lib/i18n/paths.ts, tested in tests/unit/paths.test.ts
  // and documented in tests/e2e/home.spec.ts) strips the root's trailing slash
  // when building the canonical URL — Next.js's own URL normalization.
  expect(xml).toContain('<loc>https://mariachielcuis.com</loc>')
  expect(xml).toContain('https://mariachielcuis.com/mariachi/downey')
  expect(xml).toContain('hreflang="en"')
})

test('llms.txt is plain text with pricing + cities', async ({ request }) => {
  const res = await request.get('/llms.txt')
  expect(res.headers()['content-type']).toContain('text/plain')
  const txt = await res.text()
  expect(txt).toContain('# Mariachi El Cuis')
  expect(txt).toContain('$550')
  expect(txt).toContain('/mariachi/downey')
})

test('404 route returns 404 with an h1', async ({ page }) => {
  const res = await page.goto('/definitely-not-a-page/deep')
  // proxy rewrites to /es/definitely-not-a-page/deep -> not-found
  expect(res?.status()).toBe(404)
  await expect(page.locator('#main h1')).toBeVisible()
})
