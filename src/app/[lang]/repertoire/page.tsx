import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CtaBand } from '@/components/home/cta-band'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { REPERTOIRE } from '@/lib/data/repertoire'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'
import { breadcrumb } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { RepertoireFilter } from './repertoire-filter'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const COPY = {
  es: {
    title: 'Repertorio de mariachi',
    description:
      'Repertorio de Mariachi El Cuis: rancheras, boleros, huapangos y sones tradicionales para bodas, quinceañeras y serenatas en el Condado de Los Ángeles. Conocemos cientos de canciones y tocamos lo que el público pida.',
    intro:
      'Estas son solo algunas de las canciones que tocamos en bodas, quinceañeras, serenatas y eventos corporativos. Conocemos cientos de canciones y con gusto tocamos lo que el público pida. Busca por título, género o compositor para ver si tu canción favorita está en la lista.',
    genresLine:
      'Rancheras, boleros, huapangos, sones jaliscienses y jarocho, cumbias y canciones tradicionales como Las Mañanitas y Las Golondrinas.',
    hearLiveLabel: 'Escúchanos tocar estas canciones en vivo',
    searchLabel: 'Buscar canción, género o compositor',
    resultsLabel: 'canciones encontradas',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Mariachi repertoire',
    description:
      'Mariachi El Cuis repertoire: rancheras, boleros, huapangos, and traditional sones for weddings, quinceañeras, and serenatas across Los Angeles County. We know hundreds of songs and play what the audience requests.',
    intro:
      'These are just some of the songs we play at weddings, quinceañeras, serenatas, and corporate events. We know hundreds of songs and gladly play what the audience requests. Search by title, genre, or composer to see if your favorite song is on the list.',
    genresLine:
      'Rancheras, boleros, huapangos, Jalisco and jarocho sones, cumbias, and traditional songs like Las Mañanitas and Las Golondrinas.',
    hearLiveLabel: 'Hear us play these songs live',
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
        <p className="mt-3 max-w-2xl text-sm text-muted-silver">{t.genresLine}</p>
      </Section>

      <Section>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: t.title,
            url: repertoireUrl,
            numberOfItems: REPERTOIRE.length,
            itemListElement: REPERTOIRE.map((song, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'MusicRecording',
                name: song.title,
                genre: song.genre,
                ...(song.composer
                  ? { byArtist: { '@type': 'Person', name: song.composer } }
                  : {}),
              },
            })),
          }}
        />
        <RepertoireFilter
          songs={REPERTOIRE}
          labels={{ search: t.searchLabel, results: t.resultsLabel }}
        />
        <p className="mt-8">
          <Link
            href={localizedPath('/media', locale)}
            className="text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline"
          >
            {t.hearLiveLabel}
          </Link>
        </p>
      </Section>

      <CtaBand locale={locale} dict={dict} />
    </main>
  )
}
