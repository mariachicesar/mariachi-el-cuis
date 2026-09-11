import { notFound } from 'next/navigation'
import { ContactForm } from './contact-form'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { siteConfig } from '@/lib/config/site'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor } from '@/lib/i18n/paths'
import { breadcrumb } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const COPY = {
  es: {
    title: 'Contacto',
    description:
      'Escríbenos para pedir tu cotización de mariachi en el Condado de Los Ángeles. También puedes llamarnos o mandarnos WhatsApp.',
    intro:
      'Cuéntanos sobre tu evento y te respondemos lo antes posible. Si prefieres, también puedes llamarnos o escribirnos por WhatsApp directamente.',
    formHeading: 'Envíanos un mensaje',
    directHeading: 'O contáctanos directamente',
    callLabel: 'Llamar',
    emailLabel: 'Correo',
    whatsappLabel: 'Escríbenos por WhatsApp',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Contact',
    description:
      'Reach out for a mariachi quote across Los Angeles County. You can also call us or message us on WhatsApp.',
    intro:
      'Tell us about your event and we will get back to you as soon as possible. You can also call or WhatsApp us directly.',
    formHeading: 'Send us a message',
    directHeading: 'Or contact us directly',
    callLabel: 'Call',
    emailLabel: 'Email',
    whatsappLabel: 'Message us on WhatsApp',
    breadcrumbHome: 'Home',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/contact',
    title: t.title,
    description: t.description,
  })
}

const linkCls =
  'text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline'

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const dict = await getDictionary(locale)
  const t = COPY[locale]

  const contactUrl = alternatesFor('/contact').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  return (
    <main id="main">
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: contactUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.intro}</p>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
              {t.formHeading}
            </h2>
            <div className="mt-6">
              <ContactForm dict={dict} locale={locale} />
            </div>
          </div>

          {/*
            Always visible regardless of form state — not a fallback hidden
            behind a submission error, so it's usable the moment the page
            loads and remains available no matter what the form does.
          */}
          <div>
            <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
              {t.directHeading}
            </h2>
            <ul className="mt-6 space-y-4">
              <li>
                <a href={`tel:${siteConfig.phoneTel}`} className={linkCls}>
                  {t.callLabel}: {siteConfig.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.email}`} className={linkCls}>
                  {t.emailLabel}: {siteConfig.email}
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkCls}
                >
                  {t.whatsappLabel}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </main>
  )
}
