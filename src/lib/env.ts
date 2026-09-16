import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_GOOGLE_PREFERRED_SOURCE: z.enum(['true', 'false']).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_TO_EMAIL: z.email().optional(),
  GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALENDAR_REFRESH_TOKEN: z.string().min(1).optional(),
  GOOGLE_CALENDAR_ID: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
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
    NEXT_PUBLIC_GOOGLE_PREFERRED_SOURCE: normalizeOptional(
      source.NEXT_PUBLIC_GOOGLE_PREFERRED_SOURCE,
    ),
    RESEND_API_KEY: normalizeOptional(source.RESEND_API_KEY),
    CONTACT_TO_EMAIL: normalizeOptional(source.CONTACT_TO_EMAIL),
    GOOGLE_MAPS_API_KEY: normalizeOptional(source.GOOGLE_MAPS_API_KEY),
    GOOGLE_OAUTH_CLIENT_ID: normalizeOptional(source.GOOGLE_OAUTH_CLIENT_ID),
    GOOGLE_OAUTH_CLIENT_SECRET: normalizeOptional(source.GOOGLE_OAUTH_CLIENT_SECRET),
    GOOGLE_CALENDAR_REFRESH_TOKEN: normalizeOptional(source.GOOGLE_CALENDAR_REFRESH_TOKEN),
    GOOGLE_CALENDAR_ID: normalizeOptional(source.GOOGLE_CALENDAR_ID),
    STRIPE_SECRET_KEY: normalizeOptional(source.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET: normalizeOptional(source.STRIPE_WEBHOOK_SECRET),
  })
  return {
    env,
    features: {
      email: Boolean(env.RESEND_API_KEY && env.CONTACT_TO_EMAIL),
      maps: Boolean(env.GOOGLE_MAPS_API_KEY),
      calendar: Boolean(
        env.GOOGLE_OAUTH_CLIENT_ID &&
          env.GOOGLE_OAUTH_CLIENT_SECRET &&
          env.GOOGLE_CALENDAR_REFRESH_TOKEN &&
          env.GOOGLE_CALENDAR_ID,
      ),
      stripe: Boolean(env.STRIPE_SECRET_KEY),
      // Google only lists some sites in its source preferences tool; keep the
      // button hidden until mariachielcuis.com is eligible.
      preferredSource: env.NEXT_PUBLIC_GOOGLE_PREFERRED_SOURCE === 'true',
    },
  }
}

const parsed = parseEnv(process.env as Record<string, string | undefined>)
export const env = parsed.env
export const features = parsed.features
