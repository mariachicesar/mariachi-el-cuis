// tests/e2e/services.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('services page: pricing copy + schema + a11y', async ({ page }) => {
  await page.goto('/en/services')
  await expect(page.locator('#main h1')).toBeVisible()
  // Each figure legitimately appears twice: in the rules list and in the
  // at-a-glance rate table.
  await expect(page.getByText('$380').first()).toBeVisible()
  await expect(page.getByText('$500').first()).toBeVisible()
  await expect(page.getByText('$550').first()).toBeVisible()
  await expect(page.getByText(/7 or more days/i).first()).toBeVisible()
  const types = await page.locator('script[type="application/ld+json"]').allTextContents()
  const parsed = types.map((t) => JSON.parse(t)['@type'])
  expect(parsed).toContain('Service')
  expect(parsed).toContain('FAQPage')
  expect(parsed).toContain('BreadcrumbList')
  // The FAQPage schema mirrors the three Q&A pairs rendered on the page.
  const servicesFaqLd = types.map((t) => JSON.parse(t)).find((o) => o['@type'] === 'FAQPage')
  expect(servicesFaqLd.mainEntity.length).toBe(3)
  await checkA11y(page)
})

test('faq page: full list + FAQPage schema + a11y', async ({ page }) => {
  await page.goto('/faq')
  await expect(page.locator('#main h1')).toBeVisible()
  // 9 questions rendered
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  const faqLd = ld.map((t) => JSON.parse(t)).find((o) => o['@type'] === 'FAQPage')
  expect(faqLd.mainEntity.length).toBe(9)
  await checkA11y(page)
})

test('services page: localized canonical + hreflang', async ({ page }) => {
  await page.goto('/en/services')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://mariachielcuis.com/en/services',
  )
  await expect(page.locator('link[hreflang="es"]')).toHaveAttribute(
    'href',
    'https://mariachielcuis.com/services',
  )
})
