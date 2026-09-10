import { siteConfig } from '@/lib/config/site'
import type { Locale } from '@/lib/i18n/locales'

const ORG = {
  '@type': 'MusicGroup',
  name: siteConfig.name,
  telephone: siteConfig.phoneTel,
  email: siteConfig.email,
  url: siteConfig.url,
}

export function localBusiness(opts: { areaServed: string[]; sameAs?: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'MusicGroup'],
    name: siteConfig.name,
    url: siteConfig.url,
    telephone: siteConfig.phoneTel,
    email: siteConfig.email,
    image: new URL('/opengraph-image', siteConfig.url).toString(),
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Los Angeles',
      addressRegion: 'CA',
      postalCode: siteConfig.baseZip,
      addressCountry: 'US',
    },
    areaServed: opts.areaServed,
    ...(opts.sameAs?.length ? { sameAs: opts.sameAs } : {}),
  }
}

export function service(opts: { locale: Locale; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: opts.locale === 'es' ? 'Servicio de mariachi' : 'Mariachi band service',
    provider: ORG,
    areaServed: { '@type': 'AdministrativeArea', name: siteConfig.serviceCountyLabel },
    url: opts.url,
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
