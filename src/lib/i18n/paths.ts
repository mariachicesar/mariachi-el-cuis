import { siteConfig } from '@/lib/config/site'
import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales'

export function localizedPath(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : path.replace(/\/$/, '')
  if (locale === DEFAULT_LOCALE) return clean === '' ? '/' : clean
  return `/${locale}${clean}`
}

export function alternatesFor(path: string) {
  const abs = (p: string) =>
    new URL(p, siteConfig.url).toString().replace(/\/$/, '') || siteConfig.url
  const languages: Record<string, string> = {}
  for (const l of LOCALES) languages[l] = abs(localizedPath(path, l))
  languages['x-default'] = abs(localizedPath(path, DEFAULT_LOCALE))
  return { canonical: abs(localizedPath(path, DEFAULT_LOCALE)), languages }
}
