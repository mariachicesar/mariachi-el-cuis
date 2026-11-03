import type { ComponentType } from 'react'
import { PRICING } from '@/lib/data/pricing'
import type { Locale } from '@/lib/i18n/locales'

export const GUIDES = [
  {
    slug: 'mariachi-cost-los-angeles',
    datePublished: '2026-09-10',
    dateModified: '2026-11-02',
    title: {
      es: '¿Cuánto cuesta un mariachi en Los Ángeles?',
      en: 'How much does a mariachi cost in Los Angeles?',
    },
    seoTitle: {
      es: '¿Cuánto Cuesta un Mariachi en Los Ángeles? Precios 2026',
      en: 'How Much Does a Mariachi Cost in Los Angeles? 2026 Prices',
    },
    description: {
      es: `Precios fijos, no "desde": $${PRICING.hourlyWeekend} la hora o serenata de 7 canciones por $${PRICING.sevenSongsFlat} entre semana ($${PRICING.weekendSevenSongsFlat} en fin de semana). Depósito, mínimos y cancelación explicados.`,
      en: `Fixed prices, not "starting at": $${PRICING.hourlyWeekend}/hr, or a 7-song serenata for $${PRICING.sevenSongsFlat} on weekdays ($${PRICING.weekendSevenSongsFlat} on weekends). Deposit, minimums, and cancellation explained.`,
    },
  },
  {
    slug: 'quinceanera-song-guide',
    datePublished: '2026-09-10',
    dateModified: '2026-11-02',
    title: {
      es: 'Canciones de mariachi para quinceañera',
      en: 'Mariachi songs for a quinceañera',
    },
    seoTitle: {
      es: 'Canciones de Mariachi para Quinceañera (XV Años): Vals y Fiesta',
      en: 'Mariachi Songs for a Quinceañera: Mass, Vals & Party List',
    },
    description: {
      es: 'Qué canciones pedirle al mariachi en tus 15 años: Ave María en la misa, De Niña a Mujer para el vals y El Rey o El Son de la Negra para la fiesta. Más cuántas horas reservar.',
      en: 'The mariachi songs to request at a quinceañera: Ave María at the Mass, De Niña a Mujer for the vals, El Rey and El Son de la Negra for the party, plus how long to book.',
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
    dateModified: '2026-11-02',
    title: {
      es: 'El mariachi en la línea de tiempo de tu boda',
      en: 'Where a mariachi fits in your wedding timeline',
    },
    seoTitle: {
      es: 'Mariachi para Boda: Cuándo Tocar en la Ceremonia y la Recepción',
      en: 'Mariachi Wedding Timeline: Ceremony, Cocktail Hour & Entrance',
    },
    description: {
      es: 'Cuándo debe sonar el mariachi en tu boda: la ceremonia, la hora del coctel y la entrada a la recepción, y cuántas horas reservar para cubrir los tres momentos.',
      en: 'When the mariachi should play at your wedding: the ceremony, cocktail hour, and reception entrance, and how many hours to book to cover all three.',
    },
  },
  {
    slug: 'how-to-hire-a-mariachi-band',
    datePublished: '2026-09-15',
    dateModified: '2026-11-02',
    title: {
      es: 'Cómo contratar un mariachi en Los Ángeles',
      en: 'How to hire a mariachi band in Los Angeles',
    },
    seoTitle: {
      es: 'Cómo Contratar un Mariachi en Los Ángeles (Sin Sorpresas)',
      en: 'How to Hire a Mariachi Band in Los Angeles (No Surprises)',
    },
    description: {
      es: 'Qué preguntar, cómo comparar cotizaciones y cómo asegurarte de que los músicos que contratas son los que llegan. Lista de verificación antes de apartar un mariachi.',
      en: 'What to ask, how to compare quotes, and how to make sure the musicians you book are the ones who show up. A checklist before you hire a mariachi band.',
    },
  },
  {
    slug: 'mariachi-funeral-songs',
    datePublished: '2026-09-15',
    dateModified: '2026-11-02',
    title: {
      es: 'Canciones de mariachi para velorio y funeral',
      en: 'Mariachi songs for funerals and burials',
    },
    seoTitle: {
      es: 'Canciones de Mariachi para Funeral y Velorio (Mamá y Papá)',
      en: 'Mariachi Songs for a Funeral: For Mom, Dad & Loved Ones',
    },
    description: {
      es: 'Las canciones que más piden las familias para despedir a mamá, papá o un ser querido: Amor de Madre, Mi Viejo, Yo Te Extrañaré y más. Mariachi en velorios y sepelios de LA, con poco aviso.',
      en: 'The songs families request most to say goodbye: Mi Viejo, Yo Te Extrañaré, Nadie Es Eterno and more for the viewing, Mass, or burial. Live mariachi across LA County, often on short notice.',
    },
  },
  {
    slug: 'best-mariachi-songs-by-occasion',
    datePublished: '2026-09-15',
    dateModified: '2026-11-02',
    title: {
      es: 'Lista de canciones de mariachi por ocasión',
      en: 'Best mariachi songs for every occasion',
    },
    seoTitle: {
      es: 'Canciones de Mariachi para Pedir: Lista por Ocasión',
      en: 'Best Mariachi Songs to Request: A List for Every Occasion',
    },
    description: {
      es: 'Qué canciones pedirle al mariachi: alegres para cumpleaños y fiestas, románticas para serenatas y bodas, y las de quinceañera y despedida. La lista de músicos que tocan cada semana en LA.',
      en: 'What to ask the mariachi to play: Las Mañanitas and party songs for birthdays, boleros for serenades and weddings, plus quinceañera and farewell picks from musicians who play LA every week.',
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
