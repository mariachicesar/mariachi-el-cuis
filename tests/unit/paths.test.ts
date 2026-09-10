import { expect, test } from 'vitest'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'

test('localizedPath', () => {
  expect(localizedPath('/', 'es')).toBe('/')
  expect(localizedPath('/', 'en')).toBe('/en')
  expect(localizedPath('/services', 'es')).toBe('/services')
  expect(localizedPath('/services', 'en')).toBe('/en/services')
  expect(localizedPath('/mariachi/downey', 'en')).toBe('/en/mariachi/downey')
})

test('alternatesFor builds absolute canonical + hreflang incl. x-default', () => {
  const a = alternatesFor('/services')
  expect(a.canonical).toBe('https://mariachielcuis.com/services')
  expect(a.languages).toEqual({
    es: 'https://mariachielcuis.com/services',
    en: 'https://mariachielcuis.com/en/services',
    'x-default': 'https://mariachielcuis.com/services',
  })
})
