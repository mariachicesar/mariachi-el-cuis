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

test('media page lists 12 direct video clips with posters, no <video> before interaction', async ({
  page,
}) => {
  await page.goto('/media')
  const items = page.locator('#main ul li')
  await expect(items).toHaveCount(12)
  // Posters are plain <img> thumbnails; the real <video> only mounts on click.
  await expect(page.locator('#main video')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /toma 1|take 1/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /toma 2|take 2/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /ay amigo/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /sihualteco/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /guanajuato/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /una pura/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /17 años/i })).toBeVisible()
})

test('media page shows a visible title per clip, newest first', async ({ page }) => {
  await page.goto('/media')
  const titles = page.locator('#main ul li h3')
  await expect(titles).toHaveCount(12)
  await expect(titles.first()).toHaveText('Música para Bailar')
  await expect(titles.last()).toHaveText('Sihualteco')
})

test('about page shows the group photo and featured reel facade', async ({ page }) => {
  await page.goto('/en/about')
  await expect(page.getByRole('img', { name: /five musicians/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /hablando claro/i })).toBeVisible()
  await expect(page.locator('#main video')).toHaveCount(0)
})

test('media page: clicking a poster mounts a native video element', async ({ page }) => {
  await page.goto('/media')
  await page.getByRole('button', { name: /sihualteco/i }).click()
  await expect(page.locator('#main video')).toHaveCount(1)
})
