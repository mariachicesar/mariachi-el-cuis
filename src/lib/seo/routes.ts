import { CITIES } from '@/lib/data/cities'
import { GUIDES } from '@/lib/content/guides'
import { OCCASIONS } from '@/lib/data/occasions'
import { OKTOBER_FIESTA_PATH } from '@/lib/data/oktober-fiesta'

export const STATIC_PATHS = [
  '/', '/services', '/faq', '/book', '/repertoire', '/about', '/media', '/contact',
  '/guides', '/terms', '/privacy', OKTOBER_FIESTA_PATH,
] as const

export function allIndexablePaths(): string[] {
  return [
    ...STATIC_PATHS,
    ...OCCASIONS.map((o) => `/services/${o.slug}`),
    ...GUIDES.map((g) => `/guides/${g.slug}`),
    ...CITIES.map((c) => `/mariachi/${c.slug}`),
  ]
}
