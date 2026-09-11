import { env } from '@/lib/env'

export const siteConfig = {
  name: 'Mariachi El Cuis',
  url: env.NEXT_PUBLIC_SITE_URL,
  phoneDisplay: '(626) 922-0091',
  phoneTel: '+16269220091',
  email: 'booking@mariachielcuis.com',
  whatsappUrl: 'https://wa.me/16269220091',
  baseZip: '90011',
  baseLat: 34.0074,
  baseLng: -118.2587,
  serviceCountyLabel: { es: 'Condado de Los Ángeles', en: 'Los Angeles County' },
  youtubeUrl: undefined as string | undefined,
  instagramUrl: undefined as string | undefined,
} as const
