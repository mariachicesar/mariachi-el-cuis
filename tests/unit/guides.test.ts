import { expect, test } from 'vitest'
import { GUIDES, getGuide } from '@/lib/content/guides'

test('4 guides, unique slugs, both locales titled', () => {
  expect(GUIDES.length).toBe(4)
  expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(4)
  for (const g of GUIDES) {
    expect(g.title.es).not.toBe('')
    expect(g.title.en).not.toBe('')
    expect(g.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  }
})

test('getGuide', () => {
  expect(getGuide('how-booking-works')?.slug).toBe('how-booking-works')
  expect(getGuide('x')).toBeUndefined()
})
