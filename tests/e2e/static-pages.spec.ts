import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

for (const path of ['/terms', '/privacy', '/book', '/en/terms', '/en/privacy', '/en/book']) {
  test(`${path} renders + a11y + canonical`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('#main h1')).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await checkA11y(page)
  })
}

test('terms states the 7-day cancellation rule', async ({ page }) => {
  await page.goto('/en/terms')
  await expect(page.getByText(/7 or more days/i)).toBeVisible()
})

test('terms states the new tiered deposit', async ({ page }) => {
  await page.goto('/en/terms')
  await expect(page.getByText('$50', { exact: false })).toBeVisible()
  await expect(page.getByText('$150', { exact: false })).toBeVisible()
})
