import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('a city page renders unique content + schema + a11y', async ({ page }) => {
  await page.goto('/mariachi/downey')
  await expect(page.locator('#main h1')).toContainText('Downey')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://mariachielcuis.com/mariachi/downey',
  )
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  const types = ld.map((t) => JSON.parse(t)['@type'])
  expect(types).toContainEqual(['LocalBusiness', 'MusicGroup'])
  expect(types).toContain('FAQPage')
  await checkA11y(page)
})

test('unknown city 404s', async ({ page }) => {
  const res = await page.goto('/mariachi/atlantis')
  expect(res?.status()).toBe(404)
})

test('en city page has hreflang back to es', async ({ page }) => {
  await page.goto('/en/mariachi/downey')
  await expect(page.locator('link[hreflang="es"]')).toHaveAttribute(
    'href',
    'https://mariachielcuis.com/mariachi/downey',
  )
})
