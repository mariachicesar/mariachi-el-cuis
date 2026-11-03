import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Phone } from 'lucide-react'
import { CtaBand } from '@/components/home/cta-band'
import { Button, buttonClasses } from '@/components/ui/button'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { siteConfig } from '@/lib/config/site'
import { MUSICIANS } from '@/lib/data/musicians'
import { OCCASIONS, getOccasion } from '@/lib/data/occasions'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'
import { breadcrumb, faqPage, service } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return OCCASIONS.flatMap((o) => [
    { lang: 'es', occasion: o.slug },
    { lang: 'en', occasion: o.slug },
  ])
}

const COPY = {
  es: {
    home: 'Inicio',
    services: 'Servicios',
    momentsHeading: 'Lo que tocamos',
    priceHeading: 'Precio fijo, sin "desde"',
    priceNote: 'Lo que ves es lo que pagas. La cotización exacta sale al instante con tu fecha, hora y ciudad.',
    hoursHeading: '¿Cuánto tiempo reservar?',
    guaranteeHeading: 'Los músicos que contratas son los que llegan',
    guaranteeBody:
      'Muchas familias en Los Ángeles han contratado un mariachi que cancela o manda a otros músicos. Con nosotros no pasa: sin sustitutos, sin sorpresas. Conoce al grupo:',
    hearUs: 'Escúchanos tocar',
    faqHeading: 'Preguntas frecuentes',
    songsHeading: 'Ideas de canciones',
    quote: 'Consultar disponibilidad',
  },
  en: {
    home: 'Home',
    services: 'Services',
    momentsHeading: 'What we play',
    priceHeading: 'Fixed price, no "starting at"',
    priceNote: 'What you see is what you pay. Your exact quote comes back instantly with your date, time, and city.',
    hoursHeading: 'How long to book',
    guaranteeHeading: 'The musicians you book are the ones who show up',
    guaranteeBody:
      "Plenty of LA families have hired a mariachi that cancelled or sent different players. That doesn't happen with us: no subs, no surprises. Meet the group:",
    hearUs: 'Hear us play',
    faqHeading: 'Frequently asked questions',
    songsHeading: 'Song ideas',
    quote: 'Check availability',
  },
} as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; occasion: string }>
}) {
  const { lang, occasion } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const o = getOccasion(occasion)
  if (!o) return {}
  return buildMetadata({
    locale,
    path: `/services/${o.slug}`,
    title: o.seoTitle[locale],
    titleAbsolute: true,
    description: o.description[locale],
  })
}

const h2Cls = 'font-display text-2xl text-burnished-gold md:text-3xl'
const linkCls =
  'text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline'

export default async function OccasionPage({
  params,
}: {
  params: Promise<{ lang: string; occasion: string }>
}) {
  const { lang, occasion } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const o = getOccasion(occasion)
  if (!o) notFound()

  const dict = await getDictionary(locale)
  const t = COPY[locale]
  const pageUrl = alternatesFor(`/services/${o.slug}`).languages[locale]!

  return (
    <main id="main">
      <JsonLd data={service({ locale, url: pageUrl })} />
      <JsonLd data={faqPage(o.faq.map((f) => ({ q: f.q[locale], a: f.a[locale] })))} />
      <JsonLd
        data={breadcrumb([
          { name: t.home, url: alternatesFor('/').languages[locale]! },
          { name: t.services, url: alternatesFor('/services').languages[locale]! },
          { name: o.h1[locale], url: pageUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{o.h1[locale]}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{o.intro[locale]}</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button href={localizedPath('/book', locale)} variant="primary">
            {t.quote}
          </Button>
          <a href={`tel:${siteConfig.phoneTel}`} className={buttonClasses('ghost')}>
            <Phone className="h-4 w-4" aria-hidden="true" />
            {siteConfig.phoneDisplay}
          </a>
          <a
            href={siteConfig.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses('ghost')}
          >
            {dict.cta.whatsapp}
          </a>
        </div>
      </Section>

      <Section>
        <h2 className={h2Cls}>{t.momentsHeading}</h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {o.moments.map((m) => (
            <li key={m.title.en} className="rounded border border-charcoal-border bg-surface-container p-5">
              <h3 className="font-display text-xl text-crema-white">{m.title[locale]}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{m.body[locale]}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link href={localizedPath(`/guides/${o.guideSlug}`, locale)} className={linkCls}>
            {t.songsHeading}: {o.guideLabel[locale]}
          </Link>
        </p>
      </Section>

      <Section className="border-y border-charcoal-border bg-surface-container-lowest">
        <h2 className={h2Cls}>{t.priceHeading}</h2>
        <dl className="mt-6 max-w-xl divide-y divide-charcoal-border rounded border border-charcoal-border">
          {o.priceRows.map((row) => (
            <div key={row.label.en} className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-on-surface">{row.label[locale]}</dt>
              <dd className="whitespace-nowrap font-semibold text-burnished-gold">{row.value[locale]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 max-w-2xl text-sm text-muted-silver">{t.priceNote}</p>
        <h3 className="mt-8 font-display text-xl text-crema-white">{t.hoursHeading}</h3>
        <p className="mt-2 max-w-2xl text-on-surface-variant">{o.hoursTip[locale]}</p>
        <p className="mt-4">
          <Link href={localizedPath('/services', locale)} className={linkCls}>
            {locale === 'es' ? 'Ver todas las reglas de precio' : 'See the full pricing rules'}
          </Link>
        </p>
      </Section>

      <Section>
        <h2 className={h2Cls}>{t.guaranteeHeading}</h2>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t.guaranteeBody}</p>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {MUSICIANS.map((m) => (
            <li key={m.slug}>
              <Link href={localizedPath(`/about/${m.slug}`, locale)} className="group block">
                <Image
                  src={m.photo}
                  alt={`${m.name}, ${m.role[locale]}`}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="aspect-[3/4] w-full rounded object-cover"
                />
                <p className="mt-2 font-display text-lg text-crema-white group-hover:text-burnished-gold">
                  {m.name}
                </p>
                <p className="text-sm text-muted-silver">{m.role[locale]}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link href={localizedPath('/media', locale)} className={linkCls}>
            {t.hearUs}
          </Link>
        </p>
      </Section>

      <Section className="border-t border-charcoal-border">
        <h2 className={h2Cls}>{t.faqHeading}</h2>
        <dl className="mt-8 max-w-3xl space-y-6">
          {o.faq.map((item) => (
            <div key={item.q.en} className="rounded border border-charcoal-border bg-surface-container p-5">
              <dt className="font-display text-lg text-crema-white">{item.q[locale]}</dt>
              <dd className="mt-2 text-sm text-on-surface-variant">{item.a[locale]}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <CtaBand locale={locale} dict={dict} />
    </main>
  )
}
