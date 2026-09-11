import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { siteConfig } from '@/lib/config/site'
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
    title: 'Aviso de privacidad',
    description:
      'Cómo Mariachi El Cuis maneja la información del formulario de contacto: qué recopilamos, cómo se usa y a quién puedes escribir con preguntas de privacidad.',
    intro:
      'Esta página explica qué información recopilamos a través de este sitio y cómo la usamos.',
    sections: [
      {
        heading: 'Qué recopilamos',
        body: [
          'Cuando envías nuestro formulario de contacto, recopilamos el nombre, correo electrónico, teléfono y mensaje que escribes. No recopilamos ninguna otra información personal a través del sitio.',
        ],
      },
      {
        heading: 'Cómo usamos tu información',
        body: [
          'La información del formulario se envía por correo electrónico directamente al mariachi para poder responder tu solicitud. No vendemos ni compartimos esta información con terceros para fines de mercadotecnia ni de ningún otro tipo.',
        ],
      },
      {
        heading: 'Entrega del correo',
        body: [
          'Usamos Resend como proveedor de entrega de correo electrónico para enviarnos el contenido del formulario de contacto. Resend actúa únicamente como procesador técnico del envío; no usamos tu información para ningún otro propósito.',
        ],
      },
      {
        heading: 'Sin análisis ni cookies de seguimiento',
        body: [
          'En esta primera fase del sitio no usamos herramientas de análisis (analytics) ni cookies de seguimiento. No rastreamos tu navegación en este sitio.',
        ],
      },
      {
        heading: 'Preguntas sobre privacidad',
        body: [
          `Si tienes preguntas sobre esta información o quieres que eliminemos tus datos, escríbenos a ${siteConfig.email}.`,
        ],
      },
    ],
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Privacy notice',
    description:
      'How Mariachi El Cuis handles contact-form information: what we collect, how it is used, and who to contact with privacy questions.',
    intro: 'This page explains what information we collect through this site and how we use it.',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'When you submit our contact form, we collect the name, email, phone number, and message you provide. We do not collect any other personal information through the site.',
        ],
      },
      {
        heading: 'How we use your information',
        body: [
          'Contact-form submissions are emailed directly to the band so we can respond to your request. We do not sell or share this information with third parties for marketing or any other purpose.',
        ],
      },
      {
        heading: 'Email delivery',
        body: [
          'We use Resend as our email delivery processor to send ourselves the contents of the contact form. Resend acts only as the technical processor for that delivery; we do not use your information for any other purpose.',
        ],
      },
      {
        heading: 'No analytics or tracking cookies',
        body: [
          'In this first phase of the site, we do not use analytics tools or tracking cookies. We do not track your browsing on this site.',
        ],
      },
      {
        heading: 'Privacy questions',
        body: [
          `If you have questions about this information, or want us to delete your data, email us at ${siteConfig.email}.`,
        ],
      },
    ],
    breadcrumbHome: 'Home',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/privacy',
    title: t.title,
    description: t.description,
  })
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const t = COPY[locale]

  const privacyUrl = alternatesFor('/privacy').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  return (
    <main id="main">
      {/* TODO: owner review */}
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: privacyUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.intro}</p>
      </Section>

      <Section>
        <div className="max-w-3xl space-y-10">
          {t.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="font-display text-xl text-burnished-gold md:text-2xl">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-on-surface-variant">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </main>
  )
}
