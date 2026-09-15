import type { ComponentType } from 'react'
import type { Locale } from '@/lib/i18n/locales'

export const GUIDES = [
  {
    slug: 'mariachi-cost-los-angeles',
    datePublished: '2026-09-10',
    dateModified: '2026-09-10',
    title: {
      es: '¿Cuánto cuesta un mariachi en Los Ángeles?',
      en: 'How much does a mariachi cost in Los Angeles?',
    },
    description: {
      es: 'Precios reales por hora y por paquete, mínimos por distancia y cómo funciona el depósito.',
      en: 'Real hourly and package pricing, distance minimums, and how the deposit works.',
    },
  },
  {
    slug: 'quinceanera-song-guide',
    datePublished: '2026-09-10',
    dateModified: '2026-09-10',
    title: {
      es: 'Guía de canciones para quinceañera',
      en: 'Quinceañera song guide',
    },
    description: {
      es: 'El vals, el baile sorpresa y las rancheras que no pueden faltar.',
      en: 'The vals, the surprise dance, and the rancheras you cannot skip.',
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
    dateModified: '2026-09-15',
    title: {
      es: 'Canciones de mariachi para funerales y homenajes',
      en: 'Mariachi songs for funerals and memorials',
    },
    description: {
      es: 'Canciones respetuosas para despedir a mamá, papá o un ser querido y cómo planear el homenaje.',
      en: 'Respectful songs for honoring a mother, father, or loved one and how to plan the tribute.',
    },
  },
  {
    slug: 'best-mariachi-songs-by-occasion',
    datePublished: '2026-09-15',
    dateModified: '2026-09-15',
    title: {
      es: 'Las mejores canciones de mariachi para cada ocasión',
      en: 'Best mariachi songs for every occasion',
    },
    description: {
      es: 'Ideas de canciones para cumpleaños, serenatas, bodas, fiestas y momentos de despedida.',
      en: 'Song ideas for birthdays, serenades, weddings, parties, and moments of remembrance.',
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
