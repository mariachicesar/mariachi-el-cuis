import type { Locale } from '@/lib/i18n/locales'

export type MusicianSlot = { slug: string; role: Record<Locale, string> }

/** Placeholder roster by instrument/role until real bios + photos are ready. */
export const MUSICIANS: MusicianSlot[] = [
  { slug: 'vihuela', role: { es: 'Vihuela', en: 'Vihuela' } },
  { slug: 'guitarron', role: { es: 'Guitarrón', en: 'Guitarrón' } },
  { slug: 'voz-y-guitarra', role: { es: 'Voz y guitarra', en: 'Voice & guitar' } },
  { slug: 'violin', role: { es: 'Violín', en: 'Violin' } },
  { slug: 'trompeta', role: { es: 'Trompeta', en: 'Trumpet' } },
]

export function findMusician(slug: string): MusicianSlot | undefined {
  return MUSICIANS.find((m) => m.slug === slug)
}
