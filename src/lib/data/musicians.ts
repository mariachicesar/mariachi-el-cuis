import type { StaticImageData } from 'next/image'
import bereGuitarron from '@/assets/musicians/bere-guitarron.webp'
import carlosTrompeta from '@/assets/musicians/carlos-trompeta.webp'
import cesarVihuela from '@/assets/musicians/cesar-vihuela.webp'
import ignacioTrompeta from '@/assets/musicians/ignacio-trompeta.webp'
import sayraViolin from '@/assets/musicians/sayra-violin.webp'
import type { Locale } from '@/lib/i18n/locales'

export type MusicianSlot = {
  slug: string
  name: string
  role: Record<Locale, string>
  photo: StaticImageData
}

export const MUSICIANS: MusicianSlot[] = [
  { slug: 'carlos', name: 'Carlos', role: { es: 'Trompeta', en: 'Trumpet' }, photo: carlosTrompeta },
  { slug: 'bere', name: 'Bere', role: { es: 'Guitarrón', en: 'Guitarrón' }, photo: bereGuitarron },
  { slug: 'cesar', name: 'Cesar', role: { es: 'Vihuela', en: 'Vihuela' }, photo: cesarVihuela },
  { slug: 'sayra', name: 'Sayra', role: { es: 'Violín', en: 'Violin' }, photo: sayraViolin },
  { slug: 'ignacio', name: 'Ignacio', role: { es: 'Trompeta', en: 'Trumpet' }, photo: ignacioTrompeta },
]

export function findMusician(slug: string): MusicianSlot | undefined {
  return MUSICIANS.find((m) => m.slug === slug)
}
