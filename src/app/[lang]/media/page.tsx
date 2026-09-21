import { notFound } from 'next/navigation'
import { VideoFacade } from '@/components/media/video-facade'
import { FacebookIcon, InstagramIcon, YoutubeIcon } from '@/components/ui/social-icons'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { siteConfig } from '@/lib/config/site'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor } from '@/lib/i18n/paths'
import { breadcrumb, videoObject } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

// Live performance clips, hosted on the group's S3 bucket (re-encoded to
// web-friendly 720p H.264 — see docs/superpowers/ for the source originals).
// When adding a new clip, set `uploadDate` to the day it was actually uploaded
// (ISO 8601) — Google uses it for video rich results and ignores stale dates.
const ASSET_BASE = 'https://mariachiassets.s3.us-west-1.amazonaws.com/web'
// Newer Shorts-style vertical clips (9:16) live at the bucket root.
const ASSET_ROOT = 'https://mariachiassets.s3.us-west-1.amazonaws.com'

const MEDIA: {
  id: string
  src: string
  poster: string
  duration: string
  uploadDate: string
  vertical?: boolean
  title: Record<Locale, string>
}[] = [
  {
    id: 'no-llega-el-olvido-1',
    src: `${ASSET_BASE}/no-llega-el-olvido-1.mp4`,
    poster: `${ASSET_BASE}/no-llega-el-olvido-1.jpg`,
    duration: 'PT17S',
    uploadDate: '2026-09-16',
    title: { es: 'No Llega el Olvido — Toma 1', en: 'No Llega el Olvido — Take 1' },
  },
  {
    id: 'no-llega-el-olvido-2',
    src: `${ASSET_BASE}/no-llega-el-olvido-2.mp4`,
    poster: `${ASSET_BASE}/no-llega-el-olvido-2.jpg`,
    duration: 'PT23S',
    uploadDate: '2026-09-16',
    title: { es: 'No Llega el Olvido — Toma 2', en: 'No Llega el Olvido — Take 2' },
  },
  {
    id: 'ay-amigo',
    src: `${ASSET_BASE}/ay-amigo.mp4`,
    poster: `${ASSET_BASE}/ay-amigo.jpg`,
    duration: 'PT39S',
    uploadDate: '2026-09-16',
    title: { es: 'Ay Amigo', en: 'Ay Amigo' },
  },
  {
    id: 'sihualteco',
    src: `${ASSET_BASE}/sihualteco.mp4`,
    poster: `${ASSET_BASE}/sihualteco.jpg`,
    duration: 'PT44S',
    uploadDate: '2026-09-16',
    title: { es: 'Sihualteco', en: 'Sihualteco' },
  },
  {
    id: 'guanajuato',
    src: `${ASSET_ROOT}/Guanajuato_ads.mp4`,
    poster: `${ASSET_ROOT}/Guanajuato_ads.jpg`,
    duration: 'PT25S',
    uploadDate: '2026-09-21',
    vertical: true,
    title: { es: 'Guanajuato', en: 'Guanajuato' },
  },
  {
    id: 'una-pura-y-dos-con-sal',
    src: `${ASSET_ROOT}/una_pura_clip.mp4`,
    poster: `${ASSET_ROOT}/una_pura_clip.jpg`,
    duration: 'PT25S',
    uploadDate: '2026-09-21',
    vertical: true,
    title: { es: 'Una Pura y Dos Con Sal', en: 'Una Pura y Dos Con Sal' },
  },
  {
    id: '17-anos',
    src: `${ASSET_ROOT}/17anos_clip.mp4`,
    poster: `${ASSET_ROOT}/17anos_clip.jpg`,
    duration: 'PT49S',
    uploadDate: '2026-09-21',
    vertical: true,
    title: { es: '17 Años', en: '17 Años' },
  },
]

const COPY = {
  es: {
    title: 'Videos y fotos del mariachi',
    description:
      'Videos en vivo de Mariachi El Cuis: rancheras, boleros, huapangos y sones grabados en bodas, quinceañeras y serenatas en el Condado de Los Ángeles.',
    intro:
      'Mira a Mariachi El Cuis en vivo: rancheras, boleros, huapangos y sones de nuestro repertorio, grabados en presentaciones reales en Los Ángeles. Así sonamos en bodas, quinceañeras, misas, serenatas y eventos corporativos en todo el Condado de Los Ángeles — y en tu evento tocamos lo que el público pida.',
    videosHeading: 'Presentaciones en vivo',
    clipDescription:
      'Mariachi El Cuis en vivo. Mariachi con base en Los Ángeles (90011) para bodas, quinceañeras, serenatas y eventos en el Condado de Los Ángeles.',
    comingSoon: 'Próximamente',
    followLabel: 'Síguenos',
    youtube: 'YouTube',
    instagram: 'Instagram',
    facebook: 'Facebook',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Mariachi videos & photos',
    description:
      'Live videos of Mariachi El Cuis: rancheras, boleros, huapangos, and sones recorded at weddings, quinceañeras, and serenatas across Los Angeles County.',
    intro:
      'Watch Mariachi El Cuis live: rancheras, boleros, huapangos, and sones from our repertoire, recorded at real performances in Los Angeles. This is how we sound at weddings, quinceañeras, masses, serenatas, and corporate events across Los Angeles County — and at your event we play what the audience requests.',
    videosHeading: 'Live performances',
    clipDescription:
      'Mariachi El Cuis performing live. Los Angeles (90011) mariachi for weddings, quinceañeras, serenatas, and events across Los Angeles County.',
    comingSoon: 'Coming soon',
    followLabel: 'Follow us',
    youtube: 'YouTube',
    instagram: 'Instagram',
    facebook: 'Facebook',
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
  'inline-flex items-center gap-2 text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline'
const iconCls = 'h-4 w-4'

export default async function MediaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const t = COPY[locale]

  const mediaUrl = alternatesFor('/media').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  const hasSocial = Boolean(
    siteConfig.youtubeUrl || siteConfig.instagramUrl || siteConfig.facebookUrl,
  )

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
          <>
            {MEDIA.map((item) => (
              <JsonLd
                key={`jsonld-${item.id}`}
                data={videoObject({
                  name: item.title[locale],
                  description: t.clipDescription,
                  contentUrl: item.src,
                  thumbnailUrl: item.poster,
                  pageUrl: mediaUrl,
                  uploadDate: item.uploadDate,
                  duration: item.duration,
                })}
              />
            ))}
            <h2 className="mb-6 font-display text-2xl text-burnished-gold md:text-3xl">
              {t.videosHeading}
            </h2>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {MEDIA.map((item) => (
                <li key={item.id}>
                  <VideoFacade
                    src={item.src}
                    poster={item.poster}
                    title={item.title[locale]}
                    vertical={item.vertical}
                  />
                </li>
              ))}
            </ul>
          </>
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
                <YoutubeIcon className={iconCls} />
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
                <InstagramIcon className={iconCls} />
                {t.instagram}
              </a>
            )}
            {siteConfig.facebookUrl && (
              <a
                href={siteConfig.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkCls}
              >
                <FacebookIcon className={iconCls} />
                {t.facebook}
              </a>
            )}
          </div>
        )}
      </Section>
    </main>
  )
}
