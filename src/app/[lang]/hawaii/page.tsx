import { MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContactForm } from '@/app/[lang]/contact/contact-form'
import groupPhoto from '@/assets/brand/mariachi-el-cuis-group-portrait.webp'
import tiffanyAward from '@/assets/maui/tiffany-mexico-canta-award.webp'
import tiffanyWinner from '@/assets/maui/tiffany-mexico-canta-winner.webp'
import tiffanySpotify from '@/assets/maui/tiffany-spotify-radar.webp'
import tiffanyPresident from '@/assets/maui/tiffany-with-president.webp'
import { AutoplayVideo } from '@/components/media/autoplay-video'
import { VideoFacade } from '@/components/media/video-facade'
import { buttonClasses } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { siteConfig } from '@/lib/config/site'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'
import { buildMetadata } from '@/lib/seo/metadata'

// Maui trip landing page (Dec 3–8, 2026), shared by link with Maui
// restaurants. noindex, not in the sitemap or nav; src/proxy.ts redirects it
// home once the trip is over (see src/lib/data/maui.ts).

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const ASSET_ROOT = 'https://mariachiassets.s3.us-west-1.amazonaws.com'
const TIFFANY_VIDEO = {
  src: `${ASSET_ROOT}/tiffany_maui.mp4`,
  poster: `${ASSET_ROOT}/tiffany_maui.jpg`,
}
const TIFFANY_YOUTUBE_ID = 'zFWdHvblkFo'
const BAND_VIDEO = {
  src: `${ASSET_ROOT}/musica_para_bailar_reel.mp4`,
  poster: `${ASSET_ROOT}/musica_para_bailar_reel.jpg`,
}

const COPY = {
  es: {
    title: 'Mariachi El Cuis en Maui · 3–8 de diciembre',
    description:
      'Mariachi El Cuis de Los Ángeles estará en Maui del 3 al 8 de diciembre, con la invitada especial Tiffany. Reservando restaurantes para el brunch del viernes y el domingo.',
    badge: 'Maui, Hawái',
    heading: 'Mariachi El Cuis en Maui',
    dateRange: '3–8 de diciembre de 2026',
    bookingLine: 'Reservando: viernes 4 y domingo 6 de diciembre',
    intro:
      'Mariachi El Cuis, un mariachi tradicional de cinco músicos de Los Ángeles, estará en Maui del 3 al 8 de diciembre. Estamos reservando restaurantes para el brunch del viernes y del domingo, con la invitada especial Tiffany.',
    call: 'Llama o manda texto',
    quoteCta: 'Pide una cotización',
    datesHeading: 'Nuestras fechas en Maui',
    available: 'Disponible',
    booked: 'Reservado',
    dates: [
      { day: 4, weekday: 'Viernes', status: 'available', note: 'Brunch o por la tarde' },
      { day: 5, weekday: 'Sábado', status: 'booked', note: 'Evento privado' },
      { day: 6, weekday: 'Domingo', status: 'available', note: 'Brunch' },
    ],
    month: 'DIC',
    guestEyebrow: 'Invitada especial en Maui',
    guestHeading: 'Tiffany',
    guestRole: 'Cantante · Violinista',
    guestPoints: [
      'Ganadora de México Canta, concurso nacional de música en México',
      'Corista de Ángela Aguilar',
      'Artista nueva en Spotify',
    ],
    videoTitle: 'Tiffany cantando en vivo',
    youtubeTitle: 'Tiffany en YouTube',
    youtubeLink: 'Ver a Tiffany en YouTube',
    photoAlts: {
      spotify: 'Tiffany frente a una pared de Spotify RADAR',
      award: 'Tiffany recibiendo su premio en México Canta',
      winner: 'Tiffany en el escenario de México Canta con su disco de premio',
      president: 'Tiffany hablando en un podio junto a la presidenta de México',
    },
    bandHeading: 'Sobre Mariachi El Cuis',
    bandBody:
      'Somos un conjunto de cinco músicos: dos trompetas, vihuela, guitarrón y violín. Tocamos rancheras, boleros, huapangos y sones, y en cada evento tocamos lo que el público pida.',
    bandLink: 'Mira nuestros videos',
    groupAlt:
      'Los cinco músicos de Mariachi El Cuis con traje de charro, sosteniendo violines, trompeta, guitarrón y vihuela.',
    bandVideoTitle: 'Música para Bailar — Mariachi El Cuis en vivo',
    quoteHeading: 'Resérvanos en Maui: 4 o 6 de diciembre',
    quoteBody:
      'Dinos el nombre de tu restaurante o lugar, la fecha (viernes 4 o domingo 6 de diciembre) y la hora que tienes en mente. Te respondemos con una cotización.',
    messagePlaceholder: 'Restaurante, fecha, hora y cualquier detalle del evento',
  },
  en: {
    title: 'Mariachi El Cuis in Maui · December 3–8',
    description:
      'Los Angeles mariachi Mariachi El Cuis is in Maui December 3–8 with special guest Tiffany. Now booking restaurants for Friday and Sunday brunch.',
    badge: 'Maui, Hawaiʻi',
    heading: 'Mariachi El Cuis in Maui',
    dateRange: 'December 3–8, 2026',
    bookingLine: 'Now booking: Friday Dec 4 & Sunday Dec 6',
    intro:
      "Mariachi El Cuis, a five-piece traditional mariachi from Los Angeles, is in Maui December 3–8. We're booking restaurants for Friday and Sunday brunch, with special guest Tiffany.",
    call: 'Call or text',
    quoteCta: 'Request a quote',
    datesHeading: 'Our dates in Maui',
    available: 'Available',
    booked: 'Booked',
    dates: [
      { day: 4, weekday: 'Friday', status: 'available', note: 'Brunch or evening' },
      { day: 5, weekday: 'Saturday', status: 'booked', note: 'Private event' },
      { day: 6, weekday: 'Sunday', status: 'available', note: 'Brunch' },
    ],
    month: 'DEC',
    guestEyebrow: 'Special guest in Maui',
    guestHeading: 'Tiffany',
    guestRole: 'Singer · Violinist',
    guestPoints: [
      'Winner of México Canta, a national music competition in Mexico',
      'Backing vocalist for Ángela Aguilar',
      'Up-and-coming artist on Spotify',
    ],
    videoTitle: 'Tiffany singing live',
    youtubeTitle: 'Tiffany on YouTube',
    youtubeLink: 'Watch Tiffany on YouTube',
    photoAlts: {
      spotify: 'Tiffany in front of a Spotify RADAR wall',
      award: 'Tiffany receiving her award at México Canta',
      winner: 'Tiffany on the México Canta stage holding her award record',
      president: 'Tiffany speaking at a podium beside the President of Mexico',
    },
    bandHeading: 'About Mariachi El Cuis',
    bandBody:
      'We are a five-piece ensemble: two trumpets, vihuela, guitarrón, and violin. We play rancheras, boleros, huapangos, and sones, and at every event we play what the audience requests.',
    bandLink: 'Watch our videos',
    groupAlt:
      'The five musicians of Mariachi El Cuis in charro suits, holding violins, trumpet, guitarrón, and vihuela.',
    bandVideoTitle: 'Música para Bailar — Mariachi El Cuis live',
    quoteHeading: 'Book us in Maui: Dec 4 or Dec 6',
    quoteBody:
      "Tell us your restaurant or venue, the date (Friday Dec 4 or Sunday Dec 6), and the time you have in mind. We'll reply with a quote.",
    messagePlaceholder: 'Restaurant, date, time, and any event details',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/hawaii',
    title: t.title,
    description: t.description,
    titleAbsolute: true,
    noindex: true,
  })
}

const linkCls =
  'text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline'

export default async function MauiPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const dict = await getDictionary(locale)
  const t = COPY[locale]

  const photos = [
    { src: tiffanyWinner, alt: t.photoAlts.winner },
    { src: tiffanyAward, alt: t.photoAlts.award },
    { src: tiffanySpotify, alt: t.photoAlts.spotify },
    { src: tiffanyPresident, alt: t.photoAlts.president },
  ]

  return (
    <main id="main">
      <Section className="overflow-hidden border-b border-charcoal-border bg-surface-container-lowest">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-12">
          <div className="md:w-1/2">
            <p className="inline-flex items-center gap-2 rounded-full border border-burnished-gold/60 bg-burnished-gold/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-burnished-gold">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              {t.badge}
            </p>
            <h1 className="mt-5 font-display text-4xl text-burnished-gold md:text-6xl">
              {t.heading}
            </h1>
            <p className="mt-3 font-display text-3xl text-crema-white md:text-5xl">
              {t.dateRange}
            </p>
            <p className="mt-5 text-lg font-semibold text-crema-white">{t.bookingLine}</p>
            <p className="mt-3 max-w-xl text-on-surface-variant">{t.intro}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href={`tel:${siteConfig.phoneTel}`} className={buttonClasses('primary')}>
                {t.call} {siteConfig.phoneDisplay}
              </a>
              <a href="#quote" className={buttonClasses('ghost')}>
                {t.quoteCta}
              </a>
            </div>
          </div>
          {/* Warm sunset glow behind the transparent group photo. */}
          <div className="relative w-full md:w-1/2">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_60%,rgba(242,166,68,0.38),rgba(214,84,84,0.2)_45%,transparent_70%)]"
            />
            <Image
              src={groupPhoto}
              alt={t.groupAlt}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="relative h-auto w-full"
            />
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.datesHeading}</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {t.dates.map((d) => {
            const isBooked = d.status === 'booked'
            return (
              <li
                key={d.day}
                className={`flex items-center gap-5 rounded-xl border p-5 ${
                  isBooked
                    ? 'border-charcoal-border bg-surface-container-lowest'
                    : 'border-burnished-gold bg-surface-container'
                }`}
              >
                {/* Calendar-page tile: month strip over a big day number */}
                <div
                  className={`flex w-20 shrink-0 flex-col items-center overflow-hidden rounded-lg border ${
                    isBooked ? 'border-charcoal-border' : 'border-burnished-gold'
                  }`}
                >
                  <span
                    className={`w-full py-1 text-center text-xs font-bold tracking-widest ${
                      isBooked
                        ? 'bg-charcoal-elevated text-muted-silver'
                        : 'bg-burnished-gold text-on-primary'
                    }`}
                  >
                    {t.month}
                  </span>
                  <span
                    className={`font-display text-4xl leading-tight ${
                      isBooked ? 'text-muted-silver' : 'text-crema-white'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
                <div>
                  <p className="font-display text-xl text-crema-white">{d.weekday}</p>
                  <p
                    className={`mt-1 text-sm font-semibold uppercase tracking-wider ${
                      isBooked ? 'text-muted-silver' : 'text-burnished-gold'
                    }`}
                  >
                    {isBooked ? t.booked : t.available}
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">{d.note}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section className="border-y border-charcoal-border bg-surface-container-lowest">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-12">
          <div className="md:w-1/2">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-silver">
              {t.guestEyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl text-burnished-gold md:text-4xl">
              {t.guestHeading}
            </h2>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-crema-white">
              {t.guestRole}
            </p>
            <ul className="mt-5 list-disc space-y-2 pl-5 text-on-surface">
              {t.guestPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <ul className="grid grid-cols-2 gap-3 md:w-1/2">
            {photos.map((photo) => (
              <li key={photo.alt} className="relative aspect-[4/3] overflow-hidden rounded">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 320px"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10 grid items-start gap-6 sm:grid-cols-2 md:mx-auto md:max-w-2xl">
          <AutoplayVideo
            src={TIFFANY_VIDEO.src}
            poster={TIFFANY_VIDEO.poster}
            title={t.videoTitle}
            className="aspect-[4/5]"
          />
          <div>
            <VideoFacade youtubeId={TIFFANY_YOUTUBE_ID} title={t.youtubeTitle} vertical />
            <a
              href={`https://www.youtube.com/shorts/${TIFFANY_YOUTUBE_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-3 inline-block ${linkCls}`}
            >
              {t.youtubeLink}
            </a>
          </div>
        </div>
      </Section>

      <Section>
        {/* The group photo lives in the hero; repeating it here read as a mistake. */}
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
              {t.bandHeading}
            </h2>
            <p className="mt-3 text-on-surface-variant">{t.bandBody}</p>
            <Link
              href={localizedPath('/media', locale)}
              className={`mt-4 inline-block ${linkCls}`}
            >
              {t.bandLink}
            </Link>
          </div>
          <VideoFacade src={BAND_VIDEO.src} poster={BAND_VIDEO.poster} title={t.bandVideoTitle} />
        </div>
      </Section>

      <Section id="quote" className="border-t border-charcoal-border bg-surface-container">
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.quoteHeading}</h2>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t.quoteBody}</p>
        <div className="mt-8">
          <ContactForm
            dict={dict}
            locale={locale}
            source="maui"
            messagePlaceholder={t.messagePlaceholder}
          />
        </div>
      </Section>
    </main>
  )
}
