import {
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  Ticket,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import groupPhoto from '@/assets/events/oktober-fiesta-2026/group.png'
import logo from '@/assets/events/oktober-fiesta-2026/logo.png'
import { PapelPicado } from '@/components/events/papel-picado'
import { ShareButtons } from '@/components/events/share-buttons'
import { VideoFacade } from '@/components/media/video-facade'
import { JsonLd } from '@/components/ui/json-ld'
import { Button, buttonClasses } from '@/components/ui/button'
import { siteConfig } from '@/lib/config/site'
import {
  isOktoberFiestaOver,
  OKTOBER_FIESTA,
  OKTOBER_FIESTA_COPY,
  OKTOBER_FIESTA_MEDIA,
  OKTOBER_FIESTA_PATH,
} from '@/lib/data/oktober-fiesta'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale } from '@/lib/i18n/locales'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'
import { musicEvent } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

// Event page for Oktober-Fiesta 2026. Rendered statically and regenerated at
// most hourly, so it flips to the "thank you" state on its own after Oct 17.
// Colors are scoped to this page (charro black, gold, rosa mexicano, teal,
// cream) to match the event flyer without touching the global theme.

export const dynamicParams = false
export const revalidate = 3600

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const BG = '#15100D'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const t = OKTOBER_FIESTA_COPY[lang]
  const over = isOktoberFiestaOver()
  return buildMetadata({
    locale: lang,
    path: OKTOBER_FIESTA_PATH,
    title: over ? t.pastTitle : t.title,
    description: over ? t.pastDescription : t.description,
    titleAbsolute: true,
    ogImagePath: OKTOBER_FIESTA.ogImagePath,
  })
}

const sectionCls = 'mx-auto w-full max-w-5xl px-4 sm:px-6'
const h2Cls = 'font-display text-2xl text-[#E8B84E] md:text-3xl'
const linkCls =
  'inline-flex min-h-11 items-center gap-2 font-medium text-[#E8B84E] underline underline-offset-4 hover:no-underline'

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <dt className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#F6EFE3]/70">
        <span className="text-[#1FA59A]">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2 text-[#F6EFE3]">{children}</dd>
    </div>
  )
}

export default async function OktoberFiestaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const t = OKTOBER_FIESTA_COPY[locale]
  const dict = await getDictionary(locale)
  const over = isOktoberFiestaOver()
  const pageUrl = alternatesFor(OKTOBER_FIESTA_PATH).languages[locale]!
  const e = OKTOBER_FIESTA
  const iconCls = 'h-5 w-5'

  return (
    <main id="main" className="bg-[#15100D] pb-16 text-[#F6EFE3]">
      <JsonLd
        data={musicEvent({
          name: t.eventName,
          description: t.description,
          url: pageUrl,
          image: new URL(e.ogImagePath, siteConfig.url).toString(),
          startDate: e.startDate,
          endDate: e.endDate,
          location: {
            name: e.venueName,
            streetAddress: e.streetAddress,
            addressLocality: e.city,
            addressRegion: e.region,
            postalCode: e.postalCode,
          },
          organizer: { name: e.hostName, url: e.hostUrl },
        })}
      />

      {/* Hero */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-5xl">
          <PapelPicado background={BG} />
        </div>
        <div className={`${sectionCls} pt-6 md:pt-10`}>
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:gap-10 md:text-left">
            <Image
              src={logo}
              alt={t.logoAlt}
              priority
              sizes="(min-width: 768px) 224px, 112px"
              className="h-auto w-28 shrink-0 md:w-56"
            />
            <div>
              {over ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E8B84E]">
                    {t.pastEyebrow}
                  </p>
                  <h1 className="mt-3 font-display text-4xl leading-tight text-[#E0457B] md:text-5xl">
                    {t.pastHeading}
                  </h1>
                  <p className="mt-4 max-w-xl text-lg text-[#F6EFE3]/85">{t.pastIntro}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E8B84E]">
                    {t.eyebrow}
                  </p>
                  <h1 className="mt-3 font-display leading-tight">
                    <span className="block text-2xl text-[#F6EFE3] md:text-3xl">{t.heading}</span>
                    <span className="block text-4xl font-bold uppercase text-[#E0457B] sm:text-5xl md:text-6xl">
                      {t.festival}
                    </span>
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                    <p className="text-3xl font-bold text-[#E8B84E] md:text-4xl">{t.setTime}</p>
                    <span className="rounded-full bg-[#1FA59A] px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-[#15100D]">
                      {t.free}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          {!over && <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-[#F6EFE3]/85">{t.intro}</p>}
          <Image
            src={groupPhoto}
            alt={t.groupAlt}
            priority
            sizes="(min-width: 1024px) 896px, 100vw"
            className="mx-auto mt-8 h-auto w-full max-w-4xl"
          />
        </div>
      </section>

      {/* Event details (future only) */}
      {!over && (
        <section className={`${sectionCls} pt-12`} aria-labelledby="details-heading">
          <h2 id="details-heading" className={h2Cls}>
            {t.detailsHeading}
          </h2>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <Detail icon={<CalendarDays className={iconCls} aria-hidden="true" />} label={t.details.date}>
              {t.dateLong}
            </Detail>
            <Detail icon={<Music className={iconCls} aria-hidden="true" />} label={t.details.ourSet}>
              {t.setTime}
            </Detail>
            <Detail icon={<Clock className={iconCls} aria-hidden="true" />} label={t.details.festivalHours}>
              {t.details.festivalHoursValue}
            </Detail>
            <Detail icon={<Ticket className={iconCls} aria-hidden="true" />} label={t.details.admission}>
              {t.details.admissionValue}
            </Detail>
            <Detail icon={<MapPin className={iconCls} aria-hidden="true" />} label={t.details.location}>
              <span className="block">{e.venueName}</span>
              <span className="block text-[#F6EFE3]/80">
                {e.streetAddress}, {e.city}, {e.region} {e.postalCode}
              </span>
              <a href={e.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
                {t.mapsLink}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Detail>
            <Detail icon={<Users className={iconCls} aria-hidden="true" />} label={t.details.family}>
              {t.details.familyValue}
            </Detail>
          </dl>
        </section>
      )}

      {/* Photos & video from the show (past state, once added in the data file) */}
      {over && OKTOBER_FIESTA_MEDIA.length > 0 && (
        <section className={`${sectionCls} pt-12`} aria-labelledby="media-heading">
          <h2 id="media-heading" className={h2Cls}>
            {t.mediaHeading}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OKTOBER_FIESTA_MEDIA.map((m, i) =>
              m.kind === 'photo' ? (
                <Image
                  key={i}
                  src={m.image}
                  alt={m.alt[locale]}
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full rounded-lg"
                />
              ) : (
                <VideoFacade
                  key={i}
                  src={m.src}
                  poster={m.poster}
                  title={m.title[locale]}
                  vertical={m.vertical}
                />
              ),
            )}
          </div>
        </section>
      )}

      {/* About the host */}
      <section className={`${sectionCls} pt-12`} aria-labelledby="host-heading">
        <h2 id="host-heading" className={h2Cls}>
          {t.hostHeading}
        </h2>
        <p className="mt-4 max-w-3xl text-[#F6EFE3]/85">{t.hostBody}</p>
        <a href={e.hostUrl} target="_blank" rel="noopener noreferrer" className={`${linkCls} mt-2`}>
          {t.hostLink}
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>

      {/* Book us */}
      <section className={`${sectionCls} pt-12`} aria-labelledby="book-heading">
        <div
          data-track-location="event_oktober_fiesta"
          className="rounded-xl border border-[#E8B84E]/30 bg-white/[0.04] p-6 md:p-8"
        >
          <h2 id="book-heading" className={h2Cls}>
            {over ? t.pastBookHeading : t.bookHeading}
          </h2>
          <p className="mt-3 max-w-2xl text-[#F6EFE3]/85">{t.bookBody}</p>
          <p className="mt-4 max-w-2xl border-l-4 border-[#E0457B] pl-4 font-display text-xl text-[#F6EFE3]">
            {t.promise}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={localizedPath('/book', locale)} className="min-h-11">
              {dict.cta.checkAvailability}
            </Button>
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses('ghost', 'min-h-11')}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {dict.cta.whatsapp}
            </a>
            <a href={`tel:${siteConfig.phoneTel}`} className={buttonClasses('ghost', 'min-h-11')}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              {dict.cta.call} {siteConfig.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* Share */}
      <section className={`${sectionCls} pt-12`} aria-labelledby="share-heading">
        <h2 id="share-heading" className={h2Cls}>
          {over ? t.pastShareHeading : t.shareHeading}
        </h2>
        <div className="mt-4">
          <ShareButtons
            url={pageUrl}
            text={over ? t.pastShareText : t.shareText}
            labels={{ copyLink: t.copyLink, copied: t.copied }}
          />
        </div>
      </section>
    </main>
  )
}
