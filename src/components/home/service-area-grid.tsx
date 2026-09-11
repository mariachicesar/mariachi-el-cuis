import Link from 'next/link'
import { Section } from '@/components/ui/section'
import { siteConfig } from '@/lib/config/site'
import { CITIES, cityDistanceMi } from '@/lib/data/cities'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'

export function ServiceAreaGrid({ locale }: { locale: Locale }) {
  const es = locale === 'es'

  return (
    <Section>
      <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
        {es ? 'Dónde tocamos' : 'Where we play'}
      </h2>
      <p className="mt-3 max-w-2xl text-on-surface-variant">
        {es
          ? `Tocamos en todo el ${siteConfig.serviceCountyLabel.es}. Las distancias son aproximadas desde nuestra base en el 90011.`
          : `We play across ${siteConfig.serviceCountyLabel.en}. Distances are approximate, measured from our 90011 home base.`}
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CITIES.map((city) => {
          const mi = cityDistanceMi(city)
          const distance =
            city.slug === 'los-angeles'
              ? es
                ? 'nuestra base'
                : 'our home base'
              : es
                ? `~${mi} mi (aprox.)`
                : `~${mi} mi (approx.)`
          return (
            <li key={city.slug}>
              <Link
                href={localizedPath(`/mariachi/${city.slug}`, locale)}
                className="flex h-full flex-col rounded border border-charcoal-border bg-surface-container p-4 transition-colors hover:border-burnished-gold"
              >
                <span className="font-display text-lg text-crema-white">{city.name}</span>
                <span className="mt-1 text-sm text-on-surface-variant">{city.neighborhoods[0]}</span>
                <span className="mt-2 text-xs text-muted-silver">{distance}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
