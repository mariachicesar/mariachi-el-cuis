import type { MetadataRoute } from 'next'
import { allIndexablePaths } from '@/lib/seo/routes'
import { alternatesFor } from '@/lib/i18n/paths'
import { GUIDES } from '@/lib/content/guides'

const GUIDE_MODIFIED = new Map(GUIDES.map((g) => [`/guides/${g.slug}`, g.dateModified]))

export default function sitemap(): MetadataRoute.Sitemap {
  return allIndexablePaths().map((path) => {
    const { canonical, languages } = alternatesFor(path)
    return {
      url: canonical,
      ...(GUIDE_MODIFIED.has(path) ? { lastModified: new Date(GUIDE_MODIFIED.get(path)!) } : {}),
      changeFrequency: path === '/' ? 'weekly' : 'monthly',
      priority: path === '/' ? 1 : path === '/book' || path === '/services' ? 0.9 : 0.7,
      alternates: { languages: { es: languages.es!, en: languages.en! } },
    }
  })
}
