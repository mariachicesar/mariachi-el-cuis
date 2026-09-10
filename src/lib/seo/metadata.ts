import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config/site'
import { alternatesFor } from '@/lib/i18n/paths'
import type { Locale } from '@/lib/i18n/locales'

interface Opts {
  locale: Locale
  path: string
  title: string
  description: string
  titleAbsolute?: boolean
  ogImagePath?: string
  noindex?: boolean
}

export function buildMetadata(opts: Opts): Metadata {
  const { locale, path, title, description, noindex } = opts
  const { languages } = alternatesFor(path)
  const canonical = languages[locale]!
  const ogImage = new URL(opts.ogImagePath ?? '/opengraph-image', siteConfig.url).toString()

  return {
    title: opts.titleAbsolute ? { absolute: title } : title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      locale: locale === 'es' ? 'es_MX' : 'en_US',
      url: canonical,
      siteName: siteConfig.name,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
