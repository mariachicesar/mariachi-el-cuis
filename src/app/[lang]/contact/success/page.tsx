import { notFound } from 'next/navigation'
import { Section } from '@/components/ui/section'
import { TrackEvent } from '@/components/analytics/track-event'
import { siteConfig } from '@/lib/config/site'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const COPY = {
  es: {
    title: 'Mensaje enviado',
    description: 'Recibimos tu mensaje.',
    heading: '¡Mensaje enviado!',
    body: 'Gracias por escribirnos. Te responderemos lo antes posible. Si es urgente, llámanos directamente.',
  },
  en: {
    title: 'Message sent',
    description: 'We received your message.',
    heading: 'Message sent!',
    body: 'Thanks for reaching out. We will get back to you as soon as possible. If it is urgent, call us directly.',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({ locale, path: '/contact/success', title: t.title, description: t.description, noindex: true })
}

export default async function ContactSuccessPage({ params }: { params: Promise<{ lang: string }> }) {
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
      <TrackEvent event="contact_form_submit" />
    </main>
  )
}
