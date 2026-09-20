import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Section } from '@/components/ui/section'
import { TrackEvent } from '@/components/analytics/track-event'
import { siteConfig } from '@/lib/config/site'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const COPY = {
  es: {
    title: 'Cotización enviada',
    description: 'Te enviamos la cotización por correo.',
    heading: '¡Cotización enviada!',
    body: 'Revisa tu correo — te enviamos la cotización con todos los detalles. Cuando estés listo, puedes volver y pagar el depósito para reservar tu fecha.',
    backToBooking: 'Volver a la cotización',
  },
  en: {
    title: 'Quote sent',
    description: 'We emailed you the quote.',
    heading: 'Quote sent!',
    body: 'Check your email — we sent the quote with all the details. When you are ready, come back and pay the deposit to reserve your date.',
    backToBooking: 'Back to booking',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({ locale, path: '/book/quote-sent', title: t.title, description: t.description, noindex: true })
}

export default async function QuoteSentPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const t = COPY[lang]

  return (
    <main id="main">
      <Section>
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.heading}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.body}</p>
        <p className="mt-4 text-on-surface-variant">{siteConfig.phoneDisplay}</p>
        <p className="mt-6">
          <Link
            href={localizedPath('/book', lang)}
            className="text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline"
          >
            {t.backToBooking}
          </Link>
        </p>
      </Section>
      <TrackEvent event="estimate_sent" />
    </main>
  )
}
