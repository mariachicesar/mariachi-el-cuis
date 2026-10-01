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

test('book page sells before the form: hero, guarantee, talk options, and FAQ', async ({ page }) => {
  await page.goto('/en/book')
  await expect(page.locator('#main h1')).toHaveText(/see your price in 60 seconds/i)
  await expect(page.getByText(/hire mariachi el cuis, get mariachi el cuis\. no subs\./i)).toBeVisible()
  await expect(page.getByRole('heading', { name: /our guarantee/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /sayra/i })).toHaveAttribute('href', '/en/about/sayra')

  const whatsapp = page.locator('[data-track-location="book_talk"] a[href*="wa.me"]')
  await expect(whatsapp).toHaveAttribute('href', /text=Hi%2C%20I'd%20like%20a%20mariachi%20quote/)
  await expect(page.locator('[data-track-location="book_talk"] a[href^="tel:"]')).toBeVisible()

  await page.getByText(/can i change the date\?/i).click()
  await expect(page.getByText(/may carry an extra charge/i)).toBeVisible()

  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
  const faq = jsonLd.map((s) => JSON.parse(s)).find((d) => d['@type'] === 'FAQPage')
  expect(faq.mainEntity.map((q: { name: string }) => q.name)).toContain('Is the price final?')
})

test('the first form field is on the first screen of a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 })
  await page.goto('/book')
  // The fixed bottom tab bar covers the bottom of the screen.
  const bar = await page.getByRole('navigation', { name: 'Bottom' }).boundingBox()
  const box = await page.getByLabel(/fecha del evento/i).boundingBox()
  expect(box!.y + box!.height).toBeLessThan(bar!.y)
  await checkA11y(page)
})

test('the talk buttons fire whatsapp_click and phone_click', async ({ page, context }) => {
  await context.route(/wa\.me/, (route) => route.abort())
  await page.goto('/en/book')
  await page.evaluate(() => {
    ;(window as unknown as { __events: unknown[] }).__events = []
    window.gtag = (...args: unknown[]) => (window as unknown as { __events: unknown[] }).__events.push(args)
  })
  const talk = page.locator('[data-track-location="book_talk"]')
  await talk.locator('a[href^="tel:"]').evaluate((a) =>
    a.addEventListener('click', (e) => e.preventDefault()),
  )
  await talk.locator('a[href^="tel:"]').click()
  await talk.locator('a[href*="wa.me"]').evaluate((a) =>
    a.addEventListener('click', (e) => e.preventDefault()),
  )
  await talk.locator('a[href*="wa.me"]').click()
  const events = await page.evaluate(() => (window as unknown as { __events: unknown[][] }).__events)
  expect(events).toContainEqual(['event', 'phone_click', { link_location: 'book_talk' }])
  expect(events).toContainEqual(['event', 'whatsapp_click', { link_location: 'book_talk' }])
})

test('touching the form sends booking_form_start once', async ({ page }) => {
  await page.goto('/en/book')
  await page.evaluate(() => {
    ;(window as unknown as { __events: unknown[] }).__events = []
    window.gtag = (...args: unknown[]) => (window as unknown as { __events: unknown[] }).__events.push(args)
  })
  await page.getByLabel(/event date/i).focus()
  await page.getByLabel(/event address/i).focus()
  const events = await page.evaluate(() => (window as unknown as { __events: unknown[][] }).__events)
  expect(events.filter((e) => e[1] === 'booking_form_start')).toHaveLength(1)
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

test('saturday peak uses restricted times and enforces hourly two-hour minimum', async ({ page }) => {
  await page.goto('/en/book')
  await page.getByLabel(/event date/i).fill('2026-09-19')
  const startTime = page.getByLabel(/start time/i)
  await expect(startTime.locator('option[value="17:01"]')).toHaveCount(0)
  await startTime.selectOption('17:30')
  await expect(startTime).toHaveValue('17:30')
  await expect(page.getByLabel(/7-songs package/i)).toHaveCount(0)
  await expect(page.getByLabel(/hourly/i)).toBeChecked()
  await expect(page.getByLabel(/duration/i)).toHaveValue('2')
  await expect(page.getByLabel(/duration/i)).toHaveAttribute('min', '2')

  await page.getByLabel(/duration/i).fill('')
  await expect(page.getByLabel(/duration/i)).toHaveValue('')
  await page.getByLabel(/duration/i).fill('3')
  await expect(page.getByLabel(/duration/i)).toHaveValue('3')
})

test('booking success page renders a thank-you message', async ({ page }) => {
  await page.goto('/en/book/success?session_id=cs_test_123')
  await expect(page.locator('#main h1')).toBeVisible()
  await checkA11y(page)
})

// The agreement step renders only when a bookable quote is shown, which requires
// Google Maps geocoding — absent in CI. This spec runs only when maps + stripe
// are configured (local dev / integration runs).
test('agreement section gates the reserve button until signed', async ({ page }) => {
  test.skip(
    !process.env.GOOGLE_MAPS_API_KEY || !process.env.STRIPE_SECRET_KEY,
    'requires Google Maps + Stripe to reach a bookable quote',
  )
  await page.goto('/en/book')
  await page.getByLabel(/event date/i).fill('2026-10-05')
  await page.getByLabel(/start time/i).fill('18:00')
  await page.getByLabel(/hourly/i).check()
  await page.getByLabel(/event address/i).fill('123 Main St, Los Angeles, CA 90011')
  const suggestion = page.getByRole('option').first()
  await expect(suggestion).toBeVisible({ timeout: 15_000 })
  await suggestion.click()

  const agreement = page.getByText(/performance agreement/i).first()
  await expect(agreement).toBeVisible({ timeout: 15_000 })

  await page.getByLabel(/^email$/i).fill('customer@example.com')
  await page.getByLabel(/name/i).fill('Test Customer')
  await page.getByLabel(/phone/i).fill('6265551234')

  const reserve = page.getByRole('button', { name: /reserve — pay/i })
  await expect(reserve).toBeDisabled()

  await page.getByLabel(/i have read and agree/i).check()
  await expect(reserve).toBeDisabled()

  await page.getByLabel(/legal signature/i).fill('Test Customer')
  await expect(reserve).toBeEnabled()
})
