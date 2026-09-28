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

test('header shows the real logo image, not text', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('banner').getByRole('img', { name: 'Mariachi El Cuis' })).toBeVisible()
})

test('locale switch preserves the path', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'English', exact: true }).first().click()
  await expect(page).toHaveURL(/\/en$/)
  await page.getByRole('link', { name: 'Español', exact: true }).first().click()
  await expect(page).toHaveURL(/:\d+\/$/)
})

test('locale switch is a full page load (no client re-render of the root layout)', async ({
  page,
}) => {
  const scriptWarnings: string[] = []
  page.on('console', (m) => {
    if (/script tag while rendering/i.test(m.text())) scriptWarnings.push(m.text())
  })
  await page.goto('/services')
  await page.getByRole('link', { name: 'English', exact: true }).first().click()
  await expect(page).toHaveURL(/\/en\/services$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect(scriptWarnings).toEqual([])
})
