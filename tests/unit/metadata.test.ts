import { expect, test } from 'vitest'
import { buildMetadata } from '@/lib/seo/metadata'

test('canonical is the current-locale absolute url', () => {
  const es = buildMetadata({ locale: 'es', path: '/services', title: 'Servicios', description: 'x' })
  const en = buildMetadata({ locale: 'en', path: '/services', title: 'Services', description: 'x' })
  expect(es.alternates?.canonical).toBe('https://mariachielcuis.com/services')
  expect(en.alternates?.canonical).toBe('https://mariachielcuis.com/en/services')
})

test('hreflang languages include es, en, x-default', () => {
  const m = buildMetadata({ locale: 'es', path: '/', title: 'Inicio', description: 'x' })
  expect(Object.keys(m.alternates?.languages ?? {}).sort()).toEqual(['en', 'es', 'x-default'])
})

test('noindex sets robots', () => {
  const m = buildMetadata({ locale: 'en', path: '/book', title: 'Book', description: 'x', noindex: true })
  expect(m.robots).toMatchObject({ index: false })
})

test('og image defaults to the site opengraph image', () => {
  const m = buildMetadata({ locale: 'es', path: '/', title: 'x', description: 'y' })
  expect(JSON.stringify(m.openGraph?.images)).toContain('/opengraph-image')
})

test('titleAbsolute wraps the title so the layout template is not applied', () => {
  const plain = buildMetadata({ locale: 'es', path: '/', title: 'Home', description: 'x' })
  const abs = buildMetadata({ locale: 'es', path: '/', title: 'Home', description: 'x', titleAbsolute: true })
  expect(plain.title).toBe('Home')
  expect(abs.title).toEqual({ absolute: 'Home' })
})
