import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

// CI has none of GOOGLE_MAPS_API_KEY / calendar / stripe env vars set, so
// features.maps/calendar/stripe are all false — this exercises the
// graceful-degradation contract every integration must satisfy.
test('book page renders the wizard shell and stays accessible with no integrations configured', async ({
  page,
}) => {
  await page.goto('/book')
  await expect(page.locator('#main h1')).toBeVisible()
  await expect(page.getByLabel(/fecha del evento|event date/i)).toBeVisible()
  await checkA11y(page)
})

test('phone-only contact shows a Call Now link and no estimate form', async ({ page }) => {
  await page.goto('/en/book')
  await page.getByLabel(/i only have a phone/i).check()
  await expect(page.getByRole('link', { name: /call now/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /email me this estimate/i })).toHaveCount(0)
})

test('email contact shows the estimate button', async ({ page }) => {
  await page.goto('/en/book')
  await page.getByLabel(/^email$/i).fill('customer@example.com')
  await expect(page.getByRole('button', { name: /email me this estimate/i })).toBeVisible()
})

test('booking success page renders a thank-you message', async ({ page }) => {
  await page.goto('/en/book/success?session_id=cs_test_123')
  await expect(page.locator('#main h1')).toBeVisible()
  await checkA11y(page)
})
