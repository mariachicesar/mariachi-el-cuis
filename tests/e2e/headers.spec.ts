import { expect, test } from '@playwright/test'

test('security headers present on a page response', async ({ request }) => {
  const res = await request.get('/es')
  const h = res.headers()
  expect(h['strict-transport-security']).toContain('max-age=')
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(h['content-security-policy']).toContain("default-src 'self'")
  expect(h['content-security-policy']).toContain('youtube-nocookie.com')
  expect(h['content-security-policy']).toContain('mariachiassets.s3.us-west-1.amazonaws.com')
})
