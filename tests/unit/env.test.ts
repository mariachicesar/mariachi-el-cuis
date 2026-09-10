import { expect, test } from 'vitest'
import { parseEnv } from '@/lib/env'

test('falls back to localhost when NEXT_PUBLIC_SITE_URL is absent', () => {
  const { env } = parseEnv({})
  expect(env.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
})

test('email feature is off without RESEND_API_KEY', () => {
  const { features } = parseEnv({ NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' })
  expect(features.email).toBe(false)
})

test('email feature is on with key + recipient', () => {
  const { features } = parseEnv({
    RESEND_API_KEY: 're_x',
    CONTACT_TO_EMAIL: 'booking@mariachielcuis.com',
  })
  expect(features.email).toBe(true)
})

test('rejects a non-URL site url', () => {
  expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: 'not-a-url' })).toThrow()
})
