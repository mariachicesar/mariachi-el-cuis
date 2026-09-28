import type { StaticImageData } from 'next/image'
import package1 from '@/assets/packages/package1.webp'
import package2 from '@/assets/packages/package2.webp'
import package3 from '@/assets/packages/package3.webp'
import paquete1 from '@/assets/packages/paquete1.webp'
import paquete2 from '@/assets/packages/paquete2.webp'
import paquete3 from '@/assets/packages/paquete3.webp'
import type { Locale } from '@/lib/i18n/locales'

// Sound & extras packages, as advertised on the group's flyers. Prices are
// add-ons on top of the regular quote (0 = included at no extra charge).
export const PACKAGES: {
  id: string
  extra: number
  flyer: Record<Locale, StaticImageData>
  title: Record<Locale, string>
  summary: Record<Locale, string>
}[] = [
  {
    id: 'package-1',
    extra: 0,
    flyer: { es: paquete1, en: package1 },
    title: { es: 'Paquete 1', en: 'Package 1' },
    summary: {
      es: 'Bocina pequeña + micrófono inalámbrico para el cantante. Incluido en contrataciones de 1 hora o más, sin costo extra.',
      en: 'Small speaker + wireless singing mic. Included with bookings of 1 hour or more, at no extra charge.',
    },
  },
  {
    id: 'package-2',
    extra: 70,
    flyer: { es: paquete2, en: package2 },
    title: { es: 'Paquete 2', en: 'Package 2' },
    summary: {
      es: 'Dos bocinas adicionales + micrófonos inalámbricos para los instrumentos. Ideal para salones grandes y eventos grandes.',
      en: 'Two additional speakers + wireless mics for the instruments. Ideal for big halls and big events.',
    },
  },
  {
    id: 'package-3',
    extra: 150,
    flyer: { es: paquete3, en: package3 },
    title: { es: 'Paquete 3', en: 'Package 3' },
    summary: {
      es: 'Todo el equipo de sonido del Paquete 2, e incluye sombreros.',
      en: 'All the sound gear from Package 2, plus sombreros.',
    },
  },
]
