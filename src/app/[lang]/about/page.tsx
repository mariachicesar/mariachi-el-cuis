import Image from 'next/image'
import { notFound } from 'next/navigation'
import groupPhoto from '@/assets/brand/mariachi-el-cuis-group-portrait.webp'
import { MusicianFan } from '@/components/about/musician-fan'
import { VideoFacade } from '@/components/media/video-facade'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'
import { breadcrumb, videoObject } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

// Featured reel: web re-encode (720p H.264) of the "Hablando Claro" original
// in the group's S3 bucket.
const REEL = {
  src: 'https://mariachiassets.s3.us-west-1.amazonaws.com/hablando_claro_reel.mp4',
  poster: 'https://mariachiassets.s3.us-west-1.amazonaws.com/hablando_claro_reel.jpg',
  duration: 'PT1M3S',
  uploadDate: '2026-09-27',
}

const COPY = {
  es: {
    title: 'Sobre Mariachi El Cuis',
    description:
      'Conoce a Mariachi El Cuis, un mariachi con base en el código postal 90011 que da servicio al Condado de Los Ángeles.',
    intro:
      'Somos Mariachi El Cuis, un mariachi tradicional con base en el código postal Los Angeles (90011) que da servicio a todo el Condado de Los Ángeles. Tocamos bodas, quinceañeras, misas, serenatas, eventos corporativos y homenajes.',
    bioHeading: 'Nuestra historia',
    bioBody:
      'Mariachi El Cuis es un conjunto de cinco músicos: dos trompetas, vihuela, guitarrón y violín. Desde el sur de Los Ángeles llevamos el sonido tradicional del mariachi — rancheras, boleros, huapangos y sones — a bodas, quinceañeras, misas, serenatas y eventos en todo el Condado de Los Ángeles. Conocemos cientos de canciones y en cada evento tocamos lo que el público pida.',
    ctaHeading: '¿Tienes preguntas antes de reservar?',
    ctaBody: 'Escríbenos y con gusto te respondemos.',
    ctaLabel: 'Contáctanos',
    groupAlt:
      'Los cinco músicos de Mariachi El Cuis con traje de charro, sosteniendo violines, trompeta, guitarrón y vihuela.',
    reelHeading: 'Míranos en acción',
    reelBody:
      'Hablando Claro — un vistazo a cómo suena Mariachi El Cuis en vivo en un evento en Los Ángeles.',
    reelTitle: 'Hablando Claro — Mariachi El Cuis en vivo',
    reelDescription:
      'Mariachi El Cuis tocando en vivo en un evento en Los Ángeles. Mariachi para bodas, quinceañeras, serenatas y eventos en el Condado de Los Ángeles.',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'About Mariachi El Cuis',
    description:
      'Meet Mariachi El Cuis, a mariachi based in the Los Angeles (90011) ZIP code serving Los Angeles County.',
    intro:
      'We are Mariachi El Cuis, a traditional mariachi based in the Los Angeles (90011) ZIP code serving all of Los Angeles County. We play weddings, quinceañeras, masses, serenatas, corporate events, and memorials.',
    bioHeading: 'Our story',
    bioBody:
      'Mariachi El Cuis is a five-piece ensemble: two trumpets, vihuela, guitarrón, and violin. From South Los Angeles we bring the traditional mariachi sound — rancheras, boleros, huapangos, and sones — to weddings, quinceañeras, masses, serenatas, and events across Los Angeles County. We know hundreds of songs and at every event we play what the audience requests.',
    ctaHeading: 'Have questions before you book?',
    ctaBody: "Reach out and we'll get back to you.",
    ctaLabel: 'Contact us',
    groupAlt:
      'The five musicians of Mariachi El Cuis in charro suits, holding violins, trumpet, guitarrón, and vihuela.',
    reelHeading: 'See us in action',
    reelBody:
      'Hablando Claro — a look at how Mariachi El Cuis sounds live at an event in Los Angeles.',
    reelTitle: 'Hablando Claro — Mariachi El Cuis live',
    reelDescription:
      'Mariachi El Cuis performing live at an event in Los Angeles. Mariachi for weddings, quinceañeras, serenatas, and events across Los Angeles County.',
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
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: t.title,
          url: aboutUrl,
          about: { '@type': 'MusicGroup', name: 'Mariachi El Cuis' },
        }}
      />
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: aboutUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.intro}</p>
        <Image
          src={groupPhoto}
          alt={t.groupAlt}
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="mx-auto mt-8 h-auto w-full max-w-3xl"
        />
      </Section>

      <Section>
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.bioHeading}</h2>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.bioBody}</p>
        <MusicianFan locale={locale} />
      </Section>

      <Section className="border-t border-charcoal-border">
        <JsonLd
          data={videoObject({
            name: t.reelTitle,
            description: t.reelDescription,
            contentUrl: REEL.src,
            thumbnailUrl: REEL.poster,
            pageUrl: aboutUrl,
            uploadDate: REEL.uploadDate,
            duration: REEL.duration,
          })}
        />
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-12">
          <div className="max-w-md text-center md:text-left">
            <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
              {t.reelHeading}
            </h2>
            <p className="mt-3 text-on-surface-variant">{t.reelBody}</p>
          </div>
          <div className="w-full max-w-[300px] shrink-0">
            <VideoFacade src={REEL.src} poster={REEL.poster} title={t.reelTitle} vertical />
          </div>
        </div>
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
