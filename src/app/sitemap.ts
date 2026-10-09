import type { MetadataRoute } from 'next'
import { allIndexablePaths } from '@/lib/seo/routes'
import { alternatesFor } from '@/lib/i18n/paths'
import { LOCALES } from '@/lib/i18n/locales'
import { GUIDES } from '@/lib/content/guides'

const GUIDE_MODIFIED = new Map(GUIDES.map((g) => [`/guides/${g.slug}`, g.dateModified]))

// One <url> per locale version: Google's hreflang sitemap spec wants every
// language version listed as its own entry, not only as an alternate.
export default function sitemap(): MetadataRoute.Sitemap {
  return allIndexablePaths().flatMap((path) => {
    const { languages } = alternatesFor(path)
    return LOCALES.map((locale) => ({
      url: languages[locale]!,
      ...(GUIDE_MODIFIED.has(path) ? { lastModified: new Date(GUIDE_MODIFIED.get(path)!) } : {}),
      changeFrequency: path === '/' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '/' ? 1 : path === '/book' || path === '/services' ? 0.9 : 0.7,
      alternates: { languages: { es: languages.es!, en: languages.en! } },
    }))
  })
}
