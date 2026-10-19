// tests/e2e/links.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

for (const path of ['/links', '/en/links']) {
  test(`${path} renders, is noindex, and passes a11y`, async ({ page, request }) => {
    await page.goto(path)
    await expect(page.locator('#main h1')).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    const res = await request.get(path)
    expect(res.headers()['x-robots-tag']).toMatch(/noindex/)
    await checkA11y(page)
  })
}

test('links page leads with the Google review and lists every social profile', async ({ page }) => {
  await page.goto('/links')
  await expect(page.getByRole('link', { name: /reseña en google/i })).toHaveAttribute(
    'href',
    'https://g.page/r/CRsrQJSvdFsUEBM/review',
  )
  for (const href of [
    'https://www.instagram.com/mariachielcuis',
    'https://www.tiktok.com/@mariachielcuis',
    'https://www.facebook.com/profile.php?id=61594009573154',
  ]) {
    await expect(page.locator(`#main a[href="${href}"]`)).toBeVisible()
  }
  await expect(page.locator('#main a[href="/book"]')).toBeVisible()

  await page.goto('/en/links')
  await expect(page.getByRole('link', { name: /google review/i })).toBeVisible()
})

test('links page is not in the sitemap or llms.txt', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).not.toContain('/links')
  const llms = await (await request.get('/llms.txt')).text()
  expect(llms).not.toContain('/links')
})
