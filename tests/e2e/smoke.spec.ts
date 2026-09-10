// tests/e2e/smoke.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('home renders and is accessible', async ({ page }) => {
  await page.goto('/es')
  await expect(page.locator('body')).toBeVisible()
  await checkA11y(page)
})
