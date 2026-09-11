import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_TO_EMAIL: z.email().optional(),
})

// Some hosts (e.g. Vercel) can present a declared-but-unfilled env var as an
// empty string rather than omitting the key. zod's `.optional()` only treats
// `undefined` as absent, so a blank string reaches validation as a real,
// invalid value and throws. Normalize blank/whitespace-only values to
// `undefined` before parsing so "present but empty" behaves like "absent".
function normalizeOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function parseEnv(source: Record<string, string | undefined>) {
  const env = schema.parse({
    NEXT_PUBLIC_SITE_URL: normalizeOptional(source.NEXT_PUBLIC_SITE_URL),
    RESEND_API_KEY: normalizeOptional(source.RESEND_API_KEY),
    CONTACT_TO_EMAIL: normalizeOptional(source.CONTACT_TO_EMAIL),
  })
  return {
    env,
    features: { email: Boolean(env.RESEND_API_KEY && env.CONTACT_TO_EMAIL) },
  }
}

const parsed = parseEnv(process.env as Record<string, string | undefined>)
export const env = parsed.env
export const features = parsed.features
