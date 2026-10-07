import type { ComponentType } from 'react'
import type { Locale } from '@/lib/i18n/locales'

export const GUIDES = [
  {
    slug: 'mariachi-cost-los-angeles',
    datePublished: '2026-09-10',
    dateModified: '2026-10-07',
    title: {
      es: '¿Cuánto cuesta un mariachi en Los Ángeles?',
      en: 'How much does a mariachi cost in Los Angeles?',
    },
    description: {
      es: 'Mariachi en Los Ángeles: $550 la hora en fin de semana, $500 entre semana o 7 canciones por $380, ideal para una serenata. Depósito y cancelación.',
      en: 'Mariachi in Los Angeles: $550/hr on weekends, $500/hr on weekdays, or 7 songs for $380, ideal for a serenata. Deposit and cancellation explained.',
    },
  },
  {
    slug: 'quinceanera-song-guide',
    datePublished: '2026-09-10',
    dateModified: '2026-10-07',
    title: {
      es: 'Canciones de mariachi para quinceañera',
      en: 'Mariachi songs for a quinceañera',
    },
    description: {
      es: 'Canciones de mariachi para la misa, el vals, el baile sorpresa y la fiesta de tus XV años, y cuánto tiempo reservar.',
      en: 'Mariachi songs for the Mass, the vals, the surprise dance, and the party, plus how long to book for a quinceañera.',
    },
  },
  {
    slug: 'how-booking-works',
    datePublished: '2026-09-10',
    dateModified: '2026-09-10',
    title: { es: 'Cómo funciona la reserva', en: 'How booking works' },
    description: {
      es: 'Del primer mensaje al depósito y la confirmación de tu fecha.',
      en: 'From first message to the deposit and your confirmed date.',
    },
  },
  {
    slug: 'wedding-mariachi-timeline',
    datePublished: '2026-09-10',
    dateModified: '2026-09-10',
    title: {
      es: 'El mariachi en la línea de tiempo de tu boda',
      en: 'Where a mariachi fits in your wedding timeline',
    },
    description: {
      es: 'Ceremonia, hora del coctel y entrada a la recepción: cuándo suena el mariachi.',
      en: 'Ceremony, cocktail hour, and reception entrance: when the mariachi plays.',
    },
  },
  {
    slug: 'how-to-hire-a-mariachi-band',
    datePublished: '2026-09-15',
    dateModified: '2026-09-15',
    title: {
      es: 'Cómo contratar un mariachi en Los Ángeles',
      en: 'How to hire a mariachi band in Los Angeles',
    },
    description: {
      es: 'Qué preguntar, cómo comparar cotizaciones y qué confirmar antes de apartar un mariachi.',
      en: 'What to ask, how to compare quotes, and what to confirm before booking a mariachi band.',
    },
  },
  {
    slug: 'mariachi-funeral-songs',
    datePublished: '2026-09-15',
    dateModified: '2026-10-07',
    title: {
      es: 'Canciones de mariachi para velorio y funeral',
      en: 'Mariachi songs for funerals and burials',
    },
    description: {
      es: 'Yo Te Extrañaré, Nadie Es Eterno, Amor de Madre, Mi Viejo y más para despedir a mamá, papá o un ser querido. Mariachi en LA con poco aviso.',
      en: 'Yo Te Extrañaré, Nadie Es Eterno, Mi Viejo and more for a viewing, Mass, or burial. Live mariachi in LA County, often on short notice.',
    },
  },
  {
    slug: 'best-mariachi-songs-by-occasion',
    datePublished: '2026-09-15',
    dateModified: '2026-10-07',
    title: {
      es: 'Lista de canciones de mariachi por ocasión',
      en: 'Best mariachi songs for every occasion',
    },
    description: {
      es: 'Lista de canciones de mariachi para pedir: alegres para cumpleaños y fiestas, románticas para serenatas y bodas, y para quinceañeras y despedidas.',
      en: 'A list of the best mariachi songs to request for birthdays, serenades, weddings, quinceañeras, parties, and funerals.',
    },
  },
] as const

export type GuideSlug = (typeof GUIDES)[number]['slug']

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug)
}

// Explicit map (not a computed dynamic import) so Turbopack can resolve every chunk.
type GuideModule = { default: ComponentType }
const content: Record<GuideSlug, Record<Locale, () => Promise<GuideModule>>> = {
  'mariachi-cost-los-angeles': {
    es: () => import('@/content/guides/mariachi-cost-los-angeles.es.mdx'),
    en: () => import('@/content/guides/mariachi-cost-los-angeles.en.mdx'),
  },
  'quinceanera-song-guide': {
    es: () => import('@/content/guides/quinceanera-song-guide.es.mdx'),
    en: () => import('@/content/guides/quinceanera-song-guide.en.mdx'),
  },
  'how-booking-works': {
    es: () => import('@/content/guides/how-booking-works.es.mdx'),
    en: () => import('@/content/guides/how-booking-works.en.mdx'),
  },
  'wedding-mariachi-timeline': {
    es: () => import('@/content/guides/wedding-mariachi-timeline.es.mdx'),
    en: () => import('@/content/guides/wedding-mariachi-timeline.en.mdx'),
  },
  'how-to-hire-a-mariachi-band': {
    es: () => import('@/content/guides/how-to-hire-a-mariachi-band.es.mdx'),
    en: () => import('@/content/guides/how-to-hire-a-mariachi-band.en.mdx'),
  },
  'mariachi-funeral-songs': {
    es: () => import('@/content/guides/mariachi-funeral-songs.es.mdx'),
    en: () => import('@/content/guides/mariachi-funeral-songs.en.mdx'),
  },
  'best-mariachi-songs-by-occasion': {
    es: () => import('@/content/guides/best-mariachi-songs-by-occasion.es.mdx'),
    en: () => import('@/content/guides/best-mariachi-songs-by-occasion.en.mdx'),
  },
}

export function getGuideContent(slug: GuideSlug, locale: Locale): Promise<GuideModule> {
  return content[slug][locale]()
}
