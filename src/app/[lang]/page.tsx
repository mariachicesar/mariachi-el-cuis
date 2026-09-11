import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CtaBand } from '@/components/home/cta-band'
import { Hero } from '@/components/home/hero'
import { ServiceAreaGrid } from '@/components/home/service-area-grid'
import { ServiceTeaser } from '@/components/home/service-teaser'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { CITIES } from '@/lib/data/cities'
import { GUIDES } from '@/lib/content/guides'
import { pricingLines } from '@/lib/data/pricing'
import { REPERTOIRE } from '@/lib/data/repertoire'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'
import { localBusiness } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : 'es'
  const t =
    locale === 'es'
      ? {
          title: 'Mariachi El Cuis — Mariachi en Los Ángeles',
          description:
            'Mariachi tradicional para bodas, quinceañeras y serenatas en el Condado de Los Ángeles. Cotización y reserva directa.',
        }
      : {
          title: 'Mariachi El Cuis — Los Angeles Mariachi Band',
          description:
            'Traditional mariachi for weddings, quinceañeras, and serenatas across Los Angeles County. Direct quotes and booking.',
        }
  return buildMetadata({
    locale,
    path: '/',
    title: t.title,
    description: t.description,
    titleAbsolute: true,
  })
}

const seeAllCls =
  'text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline'

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const dict = await getDictionary(locale)
  const es = locale === 'es'

  return (
    <main id="main">
      <JsonLd data={localBusiness({ areaServed: CITIES.map((c) => c.name) })} />

      <Hero locale={locale} dict={dict} />

      {/* Quick availability strip (Phase 2 adds the live form) */}
      <Section className="border-y border-charcoal-border bg-surface-container-lowest">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl text-burnished-gold">
              {es ? 'Disponibilidad' : 'Availability'}
            </h2>
            <p className="mt-2 text-on-surface-variant">
              {es
                ? 'Lunes a viernes durante el día. Sábados y domingos a partir de las 3:00 PM.'
                : 'Monday through Friday during the day. Saturdays and Sundays from 3:00 PM.'}
            </p>
            <p className="mt-1 text-sm text-muted-silver">{pricingLines(locale)[0]}</p>
          </div>
          <Button href={localizedPath('/book', locale)} variant="primary">
            {dict.cta.getQuote}
          </Button>
        </div>
      </Section>

      <ServiceAreaGrid locale={locale} />

      <ServiceTeaser locale={locale} />

      {/* Repertoire teaser */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
            {es ? 'Repertorio' : 'Repertoire'}
          </h2>
          <Link href={localizedPath('/repertoire', locale)} className={seeAllCls}>
            {es ? 'Ver el repertorio completo' : 'See the full repertoire'}
          </Link>
        </div>
        <ul className="mt-6 flex flex-wrap gap-3">
          {REPERTOIRE.slice(0, 6).map((song) => (
            <li
              key={song.title}
              className="rounded-full border border-charcoal-border px-4 py-2 text-sm text-on-surface"
            >
              {song.title}
            </li>
          ))}
        </ul>
      </Section>

      {/* Guides teaser */}
      <Section className="bg-surface-container-lowest">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
            {es ? 'Guías' : 'Guides'}
          </h2>
          <Link href={localizedPath('/guides', locale)} className={seeAllCls}>
            {es ? 'Ver las guías' : 'See the guides'}
          </Link>
        </div>
        <p className="mt-3 max-w-2xl text-on-surface-variant">
          {es
            ? 'Cómo planear el mariachi de tu evento: precios, canciones de quinceañera, cómo funciona la reserva y dónde encaja en tu boda.'
            : 'How to plan mariachi for your event: pricing, quinceañera songs, how booking works, and where it fits in your wedding.'}
        </p>
        <ul className="mt-4 grid gap-2 text-sm text-on-surface-variant sm:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                href={localizedPath(`/guides/${g.slug}`, locale)}
                className="transition-colors hover:text-burnished-gold"
              >
                {g.title[locale]}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand locale={locale} dict={dict} />
    </main>
  )
}
