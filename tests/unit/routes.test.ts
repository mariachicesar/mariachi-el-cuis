import { expect, test } from 'vitest'
import { allIndexablePaths, STATIC_PATHS } from '@/lib/seo/routes'
import { CITIES } from '@/lib/data/cities'
import { GUIDES } from '@/lib/content/guides'

test('indexable paths cover static + guides + cities, no dupes', () => {
  const all = allIndexablePaths()
  expect(all).toEqual(Array.from(new Set(all)))
  expect(all).toContain('/')
  expect(all).toContain('/services')
  for (const c of CITIES) expect(all).toContain(`/mariachi/${c.slug}`)
  for (const g of GUIDES) expect(all).toContain(`/guides/${g.slug}`)
  expect(all).not.toContain('/admin')
  expect(all.length).toBe(STATIC_PATHS.length + CITIES.length + GUIDES.length)
})
