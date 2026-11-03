import { expect, test } from 'vitest'
import { allIndexablePaths, STATIC_PATHS } from '@/lib/seo/routes'
import { CITIES } from '@/lib/data/cities'
import { GUIDES } from '@/lib/content/guides'
import { OCCASIONS } from '@/lib/data/occasions'

test('indexable paths cover static + guides + cities, no dupes', () => {
  const all = allIndexablePaths()
  expect(all).toEqual(Array.from(new Set(all)))
  expect(all).toContain('/')
  expect(all).toContain('/services')
  for (const c of CITIES) expect(all).toContain(`/mariachi/${c.slug}`)
  for (const o of OCCASIONS) expect(all).toContain(`/services/${o.slug}`)
  for (const g of GUIDES) expect(all).toContain(`/guides/${g.slug}`)
  expect(all).not.toContain('/admin')
  expect(all.length).toBe(STATIC_PATHS.length + OCCASIONS.length + CITIES.length + GUIDES.length)
})
