import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

for (const { path, lang } of [
  { path: '/', lang: 'es' },
  { path: '/en', lang: 'en' },
]) {
  test(`shell renders + a11y (${path})`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.locator('#main h1')).toBeVisible()
    await checkA11y(page)
  })
}

test('locale switch preserves the path', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'en', exact: true }).click()
  await expect(page).toHaveURL('http://localhost:3000/en')
  await page.getByRole('link', { name: 'es', exact: true }).click()
  await expect(page).toHaveURL('http://localhost:3000/')
})
