// tests/e2e/repertoire.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('repertoire filter narrows the list and stays accessible', async ({ page }) => {
  await page.goto('/repertoire')
  const items = page.locator('#main ul li')
  const total = await items.count()
  expect(total).toBeGreaterThanOrEqual(40)
  await page.getByRole('searchbox').fill('bolero')
  await expect(items).not.toHaveCount(total)
  await checkA11y(page)
})

test('full list is in server HTML (crawlable)', async ({ request }) => {
  const html = await (await request.get('/repertoire')).text()
  expect(html).toContain('El Rey')
})
