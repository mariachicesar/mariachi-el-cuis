import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('contact form validates and is accessible', async ({ page }) => {
  await page.goto('/en/contact')
  await expect(page.locator('#main h1')).toBeVisible()
  await checkA11y(page)
  await page.getByLabel(/message/i).fill('hi')
  await page.getByRole('button', { name: /send/i }).click()
  await expect(page.getByText(/at least 10/i)).toBeVisible()
})

test('contact page always shows phone + whatsapp fallback', async ({ page }) => {
  await page.goto('/contact')
  await expect(page.locator('a[href="tel:+16269220091"]').first()).toBeVisible()
  await expect(page.locator('a[href="https://wa.me/16269220091"]').first()).toBeVisible()
})

test('contact form shows fallback message when email is not configured', async ({ page }) => {
  await page.goto('/en/contact')
  await page.getByLabel(/name/i).fill('Ana Test')
  await page.getByLabel(/email/i).fill('ana@example.com')
  await page.getByLabel(/message/i).fill('This is a valid test message with enough length.')
  await page.getByRole('button', { name: /send/i }).click()
  await expect(page.getByRole('status').getByText(/call|whatsapp/i).first()).toBeVisible()
})
