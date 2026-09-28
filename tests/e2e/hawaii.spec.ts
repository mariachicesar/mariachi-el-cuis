// tests/e2e/hawaii.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

for (const path of ['/hawaii', '/en/hawaii']) {
  test(`${path} renders, is noindex, and passes a11y`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('#main h1')).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await checkA11y(page)
  })
}

test('Maui page shows dates, Tiffany, and a tagged quote form', async ({ page }) => {
  await page.goto('/en/hawaii')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/maui/i)
  await expect(page.getByText(/booked/i).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /tiffany/i })).toBeVisible()
  await expect(page.getByText(/méxico canta/i).first()).toBeVisible()
  await expect(page.getByText(/ángela aguilar/i).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /play: tiffany on youtube/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /watch tiffany on youtube/i })).toHaveAttribute(
    'href',
    'https://www.youtube.com/shorts/zFWdHvblkFo',
  )
  await expect(page.getByRole('img', { name: /five musicians/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /play: música para bailar/i })).toBeVisible()
  // Only Tiffany's clip is a real <video>; the rest wait for a tap.
  await expect(page.locator('#main video')).toHaveCount(1)
  await expect(page.locator('#main iframe')).toHaveCount(0)
})

test("Tiffany's clip autoplays muted and looping once scrolled into view", async ({ page }) => {
  await page.goto('/en/hawaii')
  const video = page.getByLabel(/tiffany singing live/i)
  await expect(video).toHaveJSProperty('paused', true)
  await video.scrollIntoViewIfNeeded()
  await expect(video).toHaveJSProperty('muted', true)
  await expect(video).toHaveJSProperty('loop', true)
  await expect(video).toHaveJSProperty('paused', false)
})

test("Tiffany's clip stays paused for visitors who prefer reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en/hawaii')
  const video = page.getByLabel(/tiffany singing live/i)
  await video.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  await expect(video).toHaveJSProperty('paused', true)
  await expect(page.locator('form input[name="source"]')).toHaveValue('maui')
  await expect(page.getByRole('link', { name: /\(626\) 922-0091/ }).first()).toHaveAttribute(
    'href',
    /^tel:/,
  )
})

test('Maui page is not in the sitemap or the site nav', async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).not.toContain('/hawaii')
  await page.goto('/en')
  await expect(page.locator('header a[href*="hawaii"], footer a[href*="hawaii"]')).toHaveCount(0)
})
