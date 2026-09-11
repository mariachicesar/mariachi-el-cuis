import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CtaBand } from '@/components/home/cta-band'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { CITIES, cityDistanceMi, getCity, type City } from '@/lib/data/cities'
import { FAQ } from '@/lib/data/faq'
import { pricingLines } from '@/lib/data/pricing'
import { haversineMiles } from '@/lib/geo/distance'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'
import { breadcrumb, faqPage, localBusiness } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return CITIES.flatMap((c) => [
    { lang: 'es', city: c.slug },
    { lang: 'en', city: c.slug },
  ])
}

/** Shared between generateMetadata and the page body so the <title> and the
 * breadcrumb's second item never drift apart. */
function cityTitle(locale: Locale, name: string): string {
  return locale === 'es' ? `Mariachi en ${name}` : `Mariachi in ${name}`
}

/** The 4 other cities geographically nearest to `current`, excluding itself. */
function siblingCities(current: City, count = 4): City[] {
  return CITIES.filter((c) => c.slug !== current.slug)
    .map((c) => ({ c, distance: haversineMiles(current, c) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map((entry) => entry.c)
}

const COPY = {
  es: {
    neighborhoodsHeading: 'Zonas donde tocamos',
    pricingHeading: 'Precios',
    pricingIntro: 'Las mismas reglas de precio que aplicamos en todo el condado:',
    faqHeading: 'Preguntas frecuentes',
    siblingHeading: 'También servimos',
    baseLine: 'Nuestra base está aquí, en el 90011.',
    distanceLine: (mi: number) => `~${mi} millas de nuestra base en el 90011 (aprox.).`,
  },
  en: {
    neighborhoodsHeading: 'Neighborhoods we play',
    pricingHeading: 'Pricing',
    pricingIntro: 'The same pricing rules we apply across the county:',
    faqHeading: 'Frequently asked questions',
    siblingHeading: 'We also serve',
    baseLine: 'Our home base is here in 90011.',
    distanceLine: (mi: number) => `~${mi} miles from our base in 90011 (approx.).`,
  },
} as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; city: string }>
}) {
  const { lang, city } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const c = getCity(city)
  if (!c) return {}
  const title = cityTitle(locale, c.name)
  const description =
    locale === 'es'
      ? `Mariachi El Cuis toca en ${c.name} y alrededores. ${c.blurb.es}`
      : `Mariachi El Cuis performs in ${c.name} and nearby. ${c.blurb.en}`
  return buildMetadata({ locale, path: `/mariachi/${c.slug}`, title, description })
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ lang: string; city: string }>
}) {
  const { lang, city } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const c = getCity(city)
  if (!c) notFound()

  const dict = await getDictionary(locale)
  const t = COPY[locale]
  const title = cityTitle(locale, c.name)

  const homeUrl = alternatesFor('/').languages[locale]!
  const cityUrl = alternatesFor(`/mariachi/${c.slug}`).languages[locale]!

  const distanceLine =
    c.slug === 'los-angeles' ? t.baseLine : t.distanceLine(cityDistanceMi(c))

  const faqVisible = FAQ.slice(0, 5)
  const siblings = siblingCities(c)

  return (
    <main id="main">
      <JsonLd data={localBusiness({ areaServed: [c.name, ...c.neighborhoods] })} />
      <JsonLd data={faqPage(faqVisible.map((f) => ({ q: f.q[locale], a: f.a[locale] })))} />
      <JsonLd
        data={breadcrumb([
          { name: dict.nav.home, url: homeUrl },
          { name: title, url: cityUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{c.blurb[locale]}</p>
        <p className="mt-4 text-sm text-muted-silver">{distanceLine}</p>
      </Section>

      <Section>
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
          {t.neighborhoodsHeading}
        </h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {c.neighborhoods.map((n) => (
            <li
              key={n}
              className="rounded border border-charcoal-border bg-surface-container px-4 py-2 text-sm text-on-surface"
            >
              {n}
            </li>
          ))}
        </ul>
      </Section>

      <Section className="border-y border-charcoal-border bg-surface-container-lowest">
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
          {t.pricingHeading}
        </h2>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t.pricingIntro}</p>
        <ul className="mt-6 max-w-3xl list-disc space-y-3 pl-5 text-on-surface">
          {pricingLines(locale).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Section>

      <Section>
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.faqHeading}</h2>
        <dl className="mt-8 max-w-3xl space-y-6">
          {faqVisible.map((item) => (
            <div
              key={item.q.en}
              className="rounded border border-charcoal-border bg-surface-container p-5"
            >
              <dt className="font-display text-lg text-crema-white">{item.q[locale]}</dt>
              <dd className="mt-2 text-sm text-on-surface-variant">{item.a[locale]}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <CtaBand locale={locale} dict={dict} />

      <Section className="border-t border-charcoal-border bg-surface-container-lowest">
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
          {t.siblingHeading}
        </h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {siblings.map((sibling) => (
            <li key={sibling.slug}>
              <Link
                href={localizedPath(`/mariachi/${sibling.slug}`, locale)}
                className="inline-flex rounded border border-charcoal-border bg-surface-container px-4 py-2 text-sm font-medium text-burnished-gold transition-colors hover:border-burnished-gold"
              >
                {sibling.name}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  )
}
