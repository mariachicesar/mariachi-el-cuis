import { notFound } from 'next/navigation'
import { VideoFacade } from '@/components/media/video-facade'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { siteConfig } from '@/lib/config/site'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor } from '@/lib/i18n/paths'
import { breadcrumb } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

// Phase 1 ships with no video content yet. Real entries get added here once
// the owner supplies footage; each entry is a YouTube video id + bilingual title.
const MEDIA: { id: string; title: Record<Locale, string> }[] = []

const COPY = {
  es: {
    title: 'Video y fotos',
    description:
      'Videos y fotos de Mariachi El Cuis en vivo, próximamente. Síguenos en YouTube e Instagram.',
    intro: 'Aquí compartiremos videos de presentaciones en vivo.',
    comingSoon: 'Próximamente',
    followLabel: 'Síguenos',
    youtube: 'YouTube',
    instagram: 'Instagram',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Video & photos',
    description:
      'Live video and photos of Mariachi El Cuis, coming soon. Follow us on YouTube and Instagram.',
    intro: "We'll share videos of live performances here.",
    comingSoon: 'Coming soon',
    followLabel: 'Follow us',
    youtube: 'YouTube',
    instagram: 'Instagram',
    breadcrumbHome: 'Home',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/media',
    title: t.title,
    description: t.description,
  })
}

const linkCls =
  'text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline'

export default async function MediaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const t = COPY[locale]

  const mediaUrl = alternatesFor('/media').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  const hasSocial = Boolean(siteConfig.youtubeUrl || siteConfig.instagramUrl)

  return (
    <main id="main">
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: mediaUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.intro}</p>
      </Section>

      <Section>
        {MEDIA.length > 0 ? (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MEDIA.map((item) => (
              <li key={item.id}>
                <VideoFacade videoId={item.id} title={item.title[locale]} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-on-surface-variant">{t.comingSoon}</p>
        )}

        {hasSocial && (
          <div className="mt-8 flex flex-wrap gap-6">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-silver">
              {t.followLabel}
            </span>
            {siteConfig.youtubeUrl && (
              <a
                href={siteConfig.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkCls}
              >
                {t.youtube}
              </a>
            )}
            {siteConfig.instagramUrl && (
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkCls}
              >
                {t.instagram}
              </a>
            )}
          </div>
        )}
      </Section>
    </main>
  )
}
