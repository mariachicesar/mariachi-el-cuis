import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { isOktoberFiestaOver, OKTOBER_FIESTA_PATH } from '@/lib/data/oktober-fiesta'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'

// Home page link to the Oktober-Fiesta event page. The wording flips after the
// event (the home page revalidates hourly). Safe to delete once it's stale.
export function OktoberFiestaStrip({ locale }: { locale: Locale }) {
  const es = locale === 'es'
  const over = isOktoberFiestaOver()
  const label = over
    ? es
      ? '¡Gracias, South Pasadena! Así fue Oktober-Fiesta 2026'
      : 'Thank you, South Pasadena! Oktober-Fiesta 2026'
    : es
      ? 'Sábado 17 de oct · Abrimos Oktober-Fiesta en South Pasadena, 3:15 PM · Gratis'
      : 'Sat Oct 17 · We open Oktober-Fiesta in South Pasadena, 3:15 PM · Free'

  return (
    <div className="border-b border-charcoal-border bg-[#15100D]">
      <Link
        href={localizedPath(OKTOBER_FIESTA_PATH, locale)}
        className="mx-auto flex min-h-11 max-w-7xl items-center justify-center gap-2 px-6 py-3 text-center text-sm font-semibold text-[#E8B84E] hover:underline lg:px-12"
      >
        <span className="rounded-full bg-[#E0457B] px-2 py-0.5 text-xs uppercase tracking-wider text-[#15100D]">
          {over ? (es ? 'Evento' : 'Event') : es ? 'Próximo' : 'Upcoming'}
        </span>
        <span>{label}</span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </Link>
    </div>
  )
}
