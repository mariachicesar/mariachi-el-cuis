import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('home: metadata, h1, json-ld, a11y', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Mariachi El Cuis/)
  // Next.js normalizes the canonical URL and strips the root trailing slash
  // (next.config has no `trailingSlash: true`).
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://mariachielcuis.com',
  )
  await expect(page.locator('link[hreflang="x-default"]')).toHaveCount(1)
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    'href',
    'https://mariachielcuis.com/en',
  )
  await expect(page.locator('#main h1')).toContainText('Mariachi El Cuis')
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(JSON.parse(ld!)['@type']).toContain('LocalBusiness')
  await checkA11y(page)
})

test('home links to key routes', async ({ page }) => {
  await page.goto('/')
  for (const p of ['/book', '/services', '/repertoire']) {
    await expect(page.locator(`a[href="${p}"]`).first()).toBeVisible()
  }
  await expect(page.locator('a[href^="/mariachi/"]').first()).toBeVisible()
})
