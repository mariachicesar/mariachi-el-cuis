import { notFound } from 'next/navigation'
import { Section } from '@/components/ui/section'
import { siteConfig } from '@/lib/config/site'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const COPY = {
  es: {
    title: 'Reserva en proceso',
    description: 'Tu depósito se está procesando.',
    heading: '¡Gracias!',
    body: 'Tu depósito se está procesando. Te enviaremos un correo de confirmación en cuanto el pago se complete.',
  },
  en: {
    title: 'Booking in progress',
    description: 'Your deposit is being processed.',
    heading: 'Thank you!',
    body: "Your deposit is being processed. We'll email you a confirmation as soon as the payment completes.",
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({ locale, path: '/book/success', title: t.title, description: t.description, noindex: true })
}

export default async function BookSuccessPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const t = COPY[lang]

  return (
    <main id="main">
      <Section>
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.heading}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.body}</p>
        <p className="mt-4 text-on-surface-variant">{siteConfig.phoneDisplay}</p>
      </Section>
    </main>
  )
}
