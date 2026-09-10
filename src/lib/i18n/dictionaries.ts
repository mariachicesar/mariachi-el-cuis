import 'server-only'
import type { Locale } from './locales'

const dictionaries = {
  es: () => import('@/messages/es.json').then((m) => m.default),
  en: () => import('@/messages/en.json').then((m) => m.default),
}

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)['en']>>
export const getDictionary = (locale: Locale): Promise<Dictionary> => dictionaries[locale]()
