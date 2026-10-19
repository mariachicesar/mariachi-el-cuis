import { ArrowRight } from 'lucide-react'
import { isNextPublicEventOver, NEXT_PUBLIC_EVENT } from '@/lib/data/next-public-event'
import type { Locale } from '@/lib/i18n/locales'

// Home page teaser for the next public show. Links to the venue on Google Maps
// and renders nothing after the show ends.
export function NextEventStrip({ locale }: { locale: Locale }) {
  if (isNextPublicEventOver()) return null
  const es = locale === 'es'

  return (
    <div className="border-b border-charcoal-border bg-[#15100D]">
      <a
        href={NEXT_PUBLIC_EVENT.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto flex min-h-11 max-w-7xl items-center justify-center gap-2 px-6 py-3 text-center text-sm font-semibold text-[#E8B84E] hover:underline lg:px-12"
      >
        <span className="rounded-full bg-[#E0457B] px-2 py-0.5 text-xs uppercase tracking-wider text-[#15100D]">
          {es ? 'Próximo' : 'Upcoming'}
        </span>
        <span>{NEXT_PUBLIC_EVENT.label[locale]}</span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
    </div>
  )
}
