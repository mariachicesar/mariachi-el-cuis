import { notFound } from 'next/navigation'
import { CtaBand } from '@/components/home/cta-band'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { REPERTOIRE } from '@/lib/data/repertoire'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor } from '@/lib/i18n/paths'
import { breadcrumb } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { RepertoireFilter } from './repertoire-filter'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const COPY = {
  es: {
    title: 'Repertorio',
    description:
      'Más de 40 canciones que toca Mariachi El Cuis: rancheras, boleros, huapangos y sones tradicionales para tu evento en el Condado de Los Ángeles.',
    intro:
      'Este es el repertorio que tocamos en bodas, quinceañeras, serenatas y eventos corporativos. Busca por título, género o compositor para ver si tu canción favorita está en la lista.',
    searchLabel: 'Buscar canción, género o compositor',
    resultsLabel: 'canciones encontradas',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Repertoire',
    description:
      'Over 40 songs Mariachi El Cuis performs: rancheras, boleros, huapangos, and traditional sones for your event across Los Angeles County.',
    intro:
      'This is the repertoire we play at weddings, quinceañeras, serenatas, and corporate events. Search by title, genre, or composer to see if your favorite song is on the list.',
    searchLabel: 'Search by title, genre, or composer',
    resultsLabel: 'songs found',
    breadcrumbHome: 'Home',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/repertoire',
    title: t.title,
    description: t.description,
  })
}

export default async function RepertoirePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const dict = await getDictionary(locale)
  const t = COPY[locale]

  const repertoireUrl = alternatesFor('/repertoire').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  return (
    <main id="main">
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: repertoireUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.intro}</p>
      </Section>

      <Section>
        <RepertoireFilter
          songs={REPERTOIRE}
          labels={{ search: t.searchLabel, results: t.resultsLabel }}
        />
      </Section>

      <CtaBand locale={locale} dict={dict} />
    </main>
  )
}
