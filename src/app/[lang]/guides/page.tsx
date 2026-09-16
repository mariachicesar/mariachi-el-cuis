import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CtaBand } from '@/components/home/cta-band'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { GUIDES } from '@/lib/content/guides'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'
import { breadcrumb } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const COPY = {
  es: {
    title: 'Guías de mariachi',
    description:
      'Guías sobre precios de mariachi, cómo funciona la reserva y qué esperar en bodas y quinceañeras en Los Ángeles.',
    intro:
      'Respuestas detalladas a las preguntas que más nos hacen antes de reservar: precios, canciones y cómo encaja el mariachi en tu evento.',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Mariachi guides',
    description:
      'Guides on mariachi pricing, how booking works, and what to expect at weddings and quinceañeras in Los Angeles.',
    intro:
      'Detailed answers to the questions we hear most before booking: pricing, songs, and how the mariachi fits into your event.',
    breadcrumbHome: 'Home',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/guides',
    title: t.title,
    description: t.description,
  })
}

export default async function GuidesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const dict = await getDictionary(locale)
  const t = COPY[locale]

  const guidesUrl = alternatesFor('/guides').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  return (
    <main id="main">
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: guidesUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.intro}</p>
      </Section>

      <Section>
        <ul className="grid gap-6 md:grid-cols-2">
          {GUIDES.map((guide) => (
            <li
              key={guide.slug}
              className="rounded border border-charcoal-border bg-surface-container p-5"
            >
              <h2 className="font-display text-xl text-crema-white">
                <Link
                  href={localizedPath(`/guides/${guide.slug}`, locale)}
                  className="hover:text-burnished-gold"
                >
                  {guide.title[locale]}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">{guide.description[locale]}</p>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand locale={locale} dict={dict} />
    </main>
  )
}
