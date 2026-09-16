import { env } from '@/lib/env'

// Resend requires a `from` like `Name <email@domain.com>`. Deriving the domain
// from the site URL breaks in local dev (hostname is `localhost`, which is not a
// valid email domain), so fall back to Resend's verified shared test sender.
function emailFrom(): string {
  const name = 'Mariachi El Cuis'
  try {
    const host = new URL(env.NEXT_PUBLIC_SITE_URL).hostname
    if (host.includes('.') && !host.endsWith('.local')) {
      return `${name} <noreply@${host}>`
    }
  } catch {
    // fall through to the test sender
  }
  return `${name} <onboarding@resend.dev>`
}

export const siteConfig = {
  name: 'Mariachi El Cuis',
  url: env.NEXT_PUBLIC_SITE_URL,
  emailFrom: emailFrom(),
  phoneDisplay: '(626) 922-0091',
  phoneTel: '+16269220091',
  email: 'booking@mariachielcuis.com',
  whatsappUrl: 'https://wa.me/16269220091',
  baseZip: '90011',
  baseLat: 34.0074,
  baseLng: -118.2587,
  serviceCountyLabel: { es: 'Condado de Los Ángeles', en: 'Los Angeles County' },
  // TODO: owner — confirm the exact legal name used on contract countersignatures.
  ownerLegalName: 'Mariachi El Cuis',
  youtubeUrl: undefined as string | undefined,
  instagramUrl: undefined as string | undefined,
} as const
