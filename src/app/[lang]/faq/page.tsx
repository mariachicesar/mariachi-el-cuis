import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CtaBand } from '@/components/home/cta-band'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { FAQ } from '@/lib/data/faq'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'
import { breadcrumb, faqPage } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const COPY = {
  es: {
    title: 'Preguntas frecuentes sobre mariachi',
    description:
      'Respuestas sobre precios, áreas de servicio, depósitos, cancelaciones y cómo reservar a Mariachi El Cuis en el Condado de Los Ángeles.',
    intro:
      'Lo que más nos preguntan sobre reservar mariachi. Si falta algo, escríbanos por WhatsApp o llámenos.',
    servicesLink: 'Ver servicios y precios',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Mariachi FAQ',
    description:
      'Answers about pricing, service areas, deposits, cancellations, and how to book Mariachi El Cuis across Los Angeles County.',
    intro:
      'What people ask us most about booking mariachi. If something is missing, message us on WhatsApp or call.',
    servicesLink: 'See services & pricing',
    breadcrumbHome: 'Home',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/faq',
    title: t.title,
    description: t.description,
  })
}

const linkCls =
  'text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline'

export default async function FaqPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const dict = await getDictionary(locale)
  const t = COPY[locale]

  const faqUrl = alternatesFor('/faq').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  return (
    <main id="main">
      <JsonLd data={faqPage(FAQ.map((f) => ({ q: f.q[locale], a: f.a[locale] })))} />
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: faqUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.intro}</p>
        <p className="mt-4">
          <Link href={localizedPath('/services', locale)} className={linkCls}>
            {t.servicesLink}
          </Link>
        </p>
      </Section>

      <Section>
        <dl className="max-w-3xl space-y-6">
          {FAQ.map((item) => (
            <div
              key={item.q.en}
              className="rounded border border-charcoal-border bg-surface-container p-5"
            >
              <dt className="font-display text-lg text-crema-white">{item.q[locale]}</dt>
              <dd className="mt-2 text-on-surface-variant">{item.a[locale]}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <CtaBand locale={locale} dict={dict} />
    </main>
  )
}
