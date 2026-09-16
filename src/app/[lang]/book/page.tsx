import { MessageCircle, Phone } from 'lucide-react'
import { notFound } from 'next/navigation'
import { BookingWizard } from '@/components/booking/booking-wizard'
import { Button, buttonClasses } from '@/components/ui/button'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { pricingLines } from '@/lib/data/pricing'
import { siteConfig } from '@/lib/config/site'
import { features } from '@/lib/env'
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
    title: 'Contrata al mariachi — cotización y reserva',
    description:
      'Contrata a Mariachi El Cuis para tu evento en el Condado de Los Ángeles. Cotización exacta al instante; reserva con depósito en línea.',
    intro:
      'Cuéntanos la fecha, la hora, la ciudad y cuántas horas necesitas, y te enviamos tu precio exacto.',
    pricingHeading: 'Cómo calculamos el precio',
    ctaHeading: 'Empieza tu reserva',
    whatsappLabel: 'Escríbenos por WhatsApp',
    callLabel: 'Llamar',
    contactLabel: 'Ir al formulario de contacto',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Hire the mariachi — get a quote & book',
    description:
      'Hire Mariachi El Cuis for your event in Los Angeles County. Instant exact quote; book online with a deposit.',
    intro:
      'Tell us the date, time, city, and how many hours you need, and we will send you your exact price.',
    pricingHeading: 'How we calculate your price',
    ctaHeading: 'Start your booking',
    whatsappLabel: 'Message us on WhatsApp',
    callLabel: 'Call',
    contactLabel: 'Go to the contact form',
    breadcrumbHome: 'Home',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/book',
    title: t.title,
    description: t.description,
  })
}

export default async function BookPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const t = COPY[locale]

  const bookUrl = alternatesFor('/book').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  return (
    <main id="main">
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: bookUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.intro}</p>
      </Section>

      <Section>
        <BookingWizard locale={locale} features={features} />
      </Section>

      <Section>
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
          {t.pricingHeading}
        </h2>
        <ul className="mt-6 max-w-3xl list-disc space-y-3 pl-5 text-on-surface">
          {pricingLines(locale).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Section>

      <Section className="border-t border-charcoal-border bg-surface-container">
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.ctaHeading}</h2>
        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href={siteConfig.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses('primary')}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t.whatsappLabel}
          </a>
          <a href={`tel:${siteConfig.phoneTel}`} className={buttonClasses('ghost')}>
            <Phone className="h-4 w-4" aria-hidden="true" />
            {t.callLabel} {siteConfig.phoneDisplay}
          </a>
          <Button href={localizedPath('/contact', locale)} variant="ghost">
            {t.contactLabel}
          </Button>
        </div>
      </Section>
    </main>
  )
}
