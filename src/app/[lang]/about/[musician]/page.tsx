import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'
import { findMusician, MUSICIANS } from '@/lib/data/musicians'
import { breadcrumb } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return MUSICIANS.flatMap((m) => [
    { lang: 'es', musician: m.slug },
    { lang: 'en', musician: m.slug },
  ])
}

const COPY = {
  es: {
    bioHeading: 'Biografía',
    bioBody: 'Muy pronto compartiremos la historia de este músico.',
    photosHeading: 'Fotos',
    videosHeading: 'Videos',
    comingSoon: 'Próximamente',
    ctaHeading: '¿Quieres reservarnos para tu evento?',
    ctaLabel: 'Cotiza tu evento',
    backLabel: 'Volver a músicos',
    breadcrumbHome: 'Inicio',
    breadcrumbAbout: 'Sobre nosotros',
  },
  en: {
    bioHeading: 'Biography',
    bioBody: "We'll share this musician's story here soon.",
    photosHeading: 'Photos',
    videosHeading: 'Videos',
    comingSoon: 'Coming soon',
    ctaHeading: 'Want to book us for your event?',
    ctaLabel: 'Get a quote',
    backLabel: 'Back to musicians',
    breadcrumbHome: 'Home',
    breadcrumbAbout: 'About us',
  },
} as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; musician: string }>
}) {
  const { lang, musician } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const slot = findMusician(musician)
  if (!slot) return {}
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: `/about/${slot.slug}`,
    title: `${slot.role[locale]} — ${t.breadcrumbAbout}`,
    description: t.bioBody,
  })
}

export default async function MusicianPage({
  params,
}: {
  params: Promise<{ lang: string; musician: string }>
}) {
  const { lang, musician } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const slot = findMusician(musician)
  if (!slot) notFound()
  const t = COPY[locale]

  const pageUrl = alternatesFor(`/about/${slot.slug}`).languages[locale]!
  const aboutUrl = alternatesFor('/about').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  return (
    <main id="main">
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.breadcrumbAbout, url: aboutUrl },
          { name: slot.role[locale], url: pageUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">
          {slot.role[locale]}
        </h1>
        <div className="mt-6">
          <Button href={localizedPath('/about', locale)} variant="ghost">
            ← {t.backLabel}
          </Button>
        </div>
      </Section>

      <Section>
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.bioHeading}</h2>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.bioBody}</p>
      </Section>

      <Section className="border-t border-charcoal-border bg-surface-container">
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
          {t.photosHeading}
        </h2>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.comingSoon}</p>
      </Section>

      <Section>
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
          {t.videosHeading}
        </h2>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.comingSoon}</p>
      </Section>

      <Section className="border-t border-charcoal-border bg-surface-container">
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.ctaHeading}</h2>
        <div className="mt-6">
          <Button href={localizedPath('/book', locale)} variant="primary">
            {t.ctaLabel}
          </Button>
        </div>
      </Section>
    </main>
  )
}
