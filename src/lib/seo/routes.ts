import { CITIES } from '@/lib/data/cities'
import { GUIDES } from '@/lib/content/guides'

export const STATIC_PATHS = [
  '/', '/services', '/faq', '/book', '/repertoire', '/about', '/media', '/contact',
  '/guides', '/terms', '/privacy',
] as const

export function allIndexablePaths(): string[] {
  return [
    ...STATIC_PATHS,
    ...GUIDES.map((g) => `/guides/${g.slug}`),
    ...CITIES.map((c) => `/mariachi/${c.slug}`),
  ]
}
