import { notFound } from 'next/navigation'
import { MusicianFan } from '@/components/about/musician-fan'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
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
    title: 'Sobre nosotros',
    description:
      'Conoce a Mariachi El Cuis, un mariachi con base en el código postal 90011 que da servicio al Condado de Los Ángeles.',
    intro:
      'Somos un mariachi con base en el código postal 90011 que da servicio al Condado de Los Ángeles. Tocamos bodas, quinceañeras, misas, serenatas, eventos corporativos y homenajes.',
    bioHeading: 'Nuestra historia',
    bioBody:
      'Aquí compartiremos pronto más sobre los músicos que forman el grupo y su trayectoria.',
    comingSoon: 'Fotos próximamente',
    ctaHeading: '¿Tienes preguntas antes de reservar?',
    ctaBody: 'Escríbenos y con gusto te respondemos.',
    ctaLabel: 'Contáctanos',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'About us',
    description:
      'Meet Mariachi El Cuis, a mariachi based in the 90011 ZIP code serving Los Angeles County.',
    intro:
      'We are a mariachi based in the 90011 ZIP code serving Los Angeles County. We play weddings, quinceañeras, masses, serenatas, corporate events, and memorials.',
    bioHeading: 'Our story',
    bioBody: "We'll share more here soon about the musicians in the group and their background.",
    comingSoon: 'Photos coming soon',
    ctaHeading: 'Have questions before you book?',
    ctaBody: "Reach out and we'll get back to you.",
    ctaLabel: 'Contact us',
    breadcrumbHome: 'Home',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/about',
    title: t.title,
    description: t.description,
  })
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const t = COPY[locale]

  const aboutUrl = alternatesFor('/about').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  return (
    <main id="main">
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: aboutUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.intro}</p>
      </Section>

      <Section>
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.bioHeading}</h2>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.bioBody}</p>
        {/* TODO: owner — replace with real musician bios + photos */}
        <MusicianFan locale={locale} comingSoon={t.comingSoon} />
      </Section>

      <Section className="border-t border-charcoal-border bg-surface-container">
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.ctaHeading}</h2>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t.ctaBody}</p>
        <div className="mt-6">
          <Button href={localizedPath('/contact', locale)} variant="primary">
            {t.ctaLabel}
          </Button>
        </div>
      </Section>
    </main>
  )
}
