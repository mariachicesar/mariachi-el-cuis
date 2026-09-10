import Link from 'next/link'
import { Section } from '@/components/ui/section'
import { SERVICES } from '@/lib/data/services'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'

const seeAllCls =
  'text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline'

export function ServiceTeaser({ locale }: { locale: Locale }) {
  const es = locale === 'es'

  return (
    <Section className="bg-surface-container-lowest">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
          {es ? 'Servicios' : 'Services'}
        </h2>
        <Link href={localizedPath('/services', locale)} className={seeAllCls}>
          {es ? 'Ver todos los servicios' : 'See all services'}
        </Link>
      </div>
      <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((serviceItem) => (
          <li
            key={serviceItem.slug}
            className="rounded border border-charcoal-border bg-surface-container p-5"
          >
            <h3 className="font-display text-xl text-crema-white">{serviceItem.title[locale]}</h3>
            <p className="mt-2 text-sm text-on-surface-variant">{serviceItem.summary[locale]}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
