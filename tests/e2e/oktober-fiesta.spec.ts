// tests/e2e/oktober-fiesta.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

const PATHS = { es: '/eventos/oktober-fiesta-2026', en: '/en/eventos/oktober-fiesta-2026' }

for (const [lang, path] of Object.entries(PATHS)) {
  test(`${path} renders with hreflang, event JSON-LD, and passes a11y`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.locator('#main h1')).toBeVisible()
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute('href', /\/eventos\/oktober-fiesta-2026$/)
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/eventos\/oktober-fiesta-2026$/)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /oktober-fiesta-2026-og\.jpg$/)
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(ld.some((s) => s.includes('"MusicEvent"') && s.includes('2026-10-17T15:15:00-07:00'))).toBe(true)
    await expect(page.locator('#main a[href="https://vecinosdesouthpasadena.org"]')).toBeVisible()
    await checkA11y(page)
  })
}

test('English event page shows the brand promise, booking CTA and share buttons, no hourly minimum', async ({ page }) => {
  await page.goto(PATHS.en)
  await expect(page.getByText('If you hire Mariachi El Cuis, you get Mariachi El Cuis. No subs, no surprises.')).toBeVisible()
  await expect(page.locator('#main a[href="/en/book"]')).toBeVisible()
  await expect(page.getByRole('button', { name: /copy link/i })).toBeVisible()
  await expect(page.locator('#main a[href^="https://www.facebook.com/sharer/"]')).toBeVisible()
  await expect(page.locator('#main a[href^="https://api.whatsapp.com/send"]')).toBeVisible()
  await expect(page.locator('#main')).not.toContainText(/minimum/i)
})

test('event page is in the sitemap and linked from the home page', async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('/eventos/oktober-fiesta-2026')
  expect(sitemap).toContain('/en/eventos/oktober-fiesta-2026')
  await page.goto('/en')
  await expect(page.locator('#main a[href="/en/eventos/oktober-fiesta-2026"]')).toBeVisible()
})
