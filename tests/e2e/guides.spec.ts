import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('guides listing + an article render with Article schema', async ({ page }) => {
  await page.goto('/guides')
  await expect(page.locator('#main h1')).toBeVisible()
  await page.locator('a[href^="/guides/"]').first().click()
  await expect(page.locator('article')).toBeVisible()
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(ld.map((t) => JSON.parse(t)['@type'])).toContain('Article')
  await checkA11y(page)
})

test('cost article states the real prices', async ({ page }) => {
  await page.goto('/en/guides/mariachi-cost-los-angeles')
  await expect(page.getByText('$380')).toBeVisible()
  await expect(page.getByText('$550')).toBeVisible()
})
