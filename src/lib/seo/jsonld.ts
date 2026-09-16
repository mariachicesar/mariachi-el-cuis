import { siteConfig } from '@/lib/config/site'
import { PRICING } from '@/lib/data/pricing'
import type { Locale } from '@/lib/i18n/locales'

const ORG = {
  '@type': 'MusicGroup',
  name: siteConfig.name,
  telephone: siteConfig.phoneTel,
  email: siteConfig.email,
  url: siteConfig.url,
  logo: new URL('/logo.png', siteConfig.url).toString(),
}

// Mirrors the real booking windows in PRICING: weekdays 07:00–24:00, Saturday
// from 07:00, Sunday from 08:00. No `validThrough` — these are standing hours.
const OPENING_HOURS = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: PRICING.hoursWindow.start,
    closes: PRICING.hoursWindow.end,
  },
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: 'Saturday',
    opens: PRICING.saturdayEarliestStart,
    closes: PRICING.hoursWindow.end,
  },
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: 'Sunday',
    opens: PRICING.sundayEarliestStart,
    closes: PRICING.hoursWindow.end,
  },
]

export function localBusiness(opts: { areaServed: string[]; sameAs?: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'MusicGroup'],
    name: siteConfig.name,
    url: siteConfig.url,
    telephone: siteConfig.phoneTel,
    email: siteConfig.email,
    image: new URL('/opengraph-image', siteConfig.url).toString(),
    logo: new URL('/logo.png', siteConfig.url).toString(),
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Los Angeles',
      addressRegion: 'CA',
      postalCode: siteConfig.baseZip,
      addressCountry: 'US',
    },
    areaServed: opts.areaServed,
    openingHoursSpecification: OPENING_HOURS,
    ...(opts.sameAs?.length ? { sameAs: opts.sameAs } : {}),
  }
}

const hourly = (price: number, locale: Locale, name: string, description: string) => ({
  '@type': 'Offer',
  name,
  description,
  priceSpecification: {
    '@type': 'UnitPriceSpecification',
    price,
    priceCurrency: 'USD',
    unitCode: 'HUR',
  },
  areaServed: { '@type': 'AdministrativeArea', name: siteConfig.serviceCountyLabel.en },
})

export function service(opts: { locale: Locale; url: string }) {
  const es = opts.locale === 'es'
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: es ? 'Servicio de mariachi' : 'Mariachi band service',
    provider: ORG,
    areaServed: { '@type': 'AdministrativeArea', name: siteConfig.serviceCountyLabel.en },
    url: opts.url,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: es ? 'Precios de mariachi' : 'Mariachi pricing',
      itemListElement: [
        {
          '@type': 'Offer',
          name: es ? 'Paquete de 7 canciones' : '7-song package',
          description: es
            ? 'Lunes a viernes, dentro de 25 millas del 90011.'
            : 'Monday–Friday, within 25 miles of 90011.',
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: PRICING.sevenSongsFlat,
            priceCurrency: 'USD',
          },
          areaServed: {
            '@type': 'AdministrativeArea',
            name: siteConfig.serviceCountyLabel.en,
          },
        },
        hourly(
          PRICING.hourlyWeekday,
          opts.locale,
          es ? 'Por hora entre semana' : 'Weekday hourly',
          es ? 'Lunes a viernes.' : 'Monday–Friday.',
        ),
        hourly(
          PRICING.hourlyWeekend,
          opts.locale,
          es ? 'Por hora en fin de semana' : 'Weekend hourly',
          es ? 'Sábado y domingo.' : 'Saturday & Sunday.',
        ),
      ],
    },
  }
}

export function faqPage(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  }
}

export function breadcrumb(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  }
}

export function article(opts: {
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    url: opts.url,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: ORG,
    publisher: ORG,
  }
}

export function videoObject(opts: {
  name: string
  description: string
  contentUrl: string
  thumbnailUrl: string
  pageUrl: string
  uploadDate: string
  duration: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: opts.name,
    description: opts.description,
    contentUrl: opts.contentUrl,
    thumbnailUrl: opts.thumbnailUrl,
    embedUrl: opts.pageUrl,
    uploadDate: opts.uploadDate,
    duration: opts.duration,
    inLanguage: 'es',
    creator: ORG,
  }
}
