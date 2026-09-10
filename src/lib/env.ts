import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_TO_EMAIL: z.email().optional(),
})

export function parseEnv(source: Record<string, string | undefined>) {
  const env = schema.parse({
    NEXT_PUBLIC_SITE_URL: source.NEXT_PUBLIC_SITE_URL,
    RESEND_API_KEY: source.RESEND_API_KEY,
    CONTACT_TO_EMAIL: source.CONTACT_TO_EMAIL,
  })
  return {
    env,
    features: { email: Boolean(env.RESEND_API_KEY && env.CONTACT_TO_EMAIL) },
  }
}

const parsed = parseEnv(process.env as Record<string, string | undefined>)
export const env = parsed.env
export const features = parsed.features
