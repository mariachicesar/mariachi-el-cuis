import { expect, test } from 'vitest'
import { DEFAULT_LOCALE, LOCALES, isLocale } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'

test('locale set', () => {
  expect(LOCALES).toEqual(['es', 'en'])
  expect(DEFAULT_LOCALE).toBe('es')
  expect(isLocale('es')).toBe(true)
  expect(isLocale('fr')).toBe(false)
})

test('dictionaries share the same key shape', async () => {
  const es = await getDictionary('es')
  const en = await getDictionary('en')
  expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort())
  expect(es.nav.home).not.toBe('')
  expect(en.nav.home).not.toBe('')
})
