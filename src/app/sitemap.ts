import type { MetadataRoute } from 'next'
import { allIndexablePaths } from '@/lib/seo/routes'
import { alternatesFor } from '@/lib/i18n/paths'

export default function sitemap(): MetadataRoute.Sitemap {
  return allIndexablePaths().map((path) => {
    const { canonical, languages } = alternatesFor(path)
    return {
      url: canonical,
      lastModified: new Date(),
      changeFrequency: path === '/' ? 'weekly' : 'monthly',
      priority: path === '/' ? 1 : path === '/book' || path === '/services' ? 0.9 : 0.7,
      alternates: { languages: { es: languages.es!, en: languages.en! } },
    }
  })
}
