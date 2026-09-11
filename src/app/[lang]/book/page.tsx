import { MessageCircle, Phone } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Button, buttonClasses } from '@/components/ui/button'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { pricingLines } from '@/lib/data/pricing'
import { siteConfig } from '@/lib/config/site'
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
    title: 'Cotización y reserva',
    description:
      'Obtén tu cotización de mariachi para el Condado de Los Ángeles. Escríbenos por WhatsApp o llámanos y te respondemos el mismo día.',
    intro:
      'Cuéntanos la fecha, la hora, la ciudad y cuántas horas necesitas, y te enviamos tu precio exacto.',
    comingSoon:
      'La cotización instantánea y el pago del depósito en línea llegarán pronto. Por ahora, escríbenos y te enviamos tu precio exacto el mismo día.',
    pricingHeading: 'Cómo calculamos el precio',
    ctaHeading: 'Empieza tu reserva',
    whatsappLabel: 'Escríbenos por WhatsApp',
    callLabel: 'Llamar',
    contactLabel: 'Ir al formulario de contacto',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Get a quote & book',
    description:
      'Get your mariachi quote for Los Angeles County. Message us on WhatsApp or call and we will reply the same day.',
    intro:
      'Tell us the date, time, city, and how many hours you need, and we will send you your exact price.',
    comingSoon:
      "Instant online quoting and deposit checkout are coming soon. For now, message us and we'll send your exact price the same day.",
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
        <p className="mt-4 max-w-2xl rounded border border-charcoal-border bg-surface-container p-4 text-sm text-on-surface-variant">
          {t.comingSoon}
        </p>
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
