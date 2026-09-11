// tests/e2e/about-media.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

for (const path of ['/about', '/media', '/en/about', '/en/media']) {
  test(`${path} renders + a11y`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('#main h1')).toBeVisible()
    await checkA11y(page)
  })
}

test('media page ships no youtube iframe before interaction', async ({ request }) => {
  const html = await (await request.get('/media')).text()
  expect(html).not.toContain('youtube-nocookie.com/embed')
})
