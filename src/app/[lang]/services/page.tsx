import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CtaBand } from '@/components/home/cta-band'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { FAQ } from '@/lib/data/faq'
import { PRICING, pricingLines } from '@/lib/data/pricing'
import { SERVICES } from '@/lib/data/services'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'
import { breadcrumb, faqPage, service } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const COPY = {
  es: {
    title: 'Servicios de mariachi y precios',
    description:
      'Mariachi para bodas, quinceañeras, misas, serenatas, eventos corporativos y homenajes en el Condado de Los Ángeles, con los precios exactos.',
    intro:
      'Contrata mariachi en vivo en Los Ángeles para seis tipos de eventos. Cubrimos todo el Condado de Los Ángeles y abajo están los servicios que ofrecemos y las reglas de precio completas que aplicamos a cada cotización.',
    servicesHeading: 'Lo que tocamos',
    occasionsLabel: 'Momentos que cubrimos',
    hearLiveLabel: 'Escúchanos en vivo',
    seeRepertoireLabel: 'Ver el repertorio',
    pricingHeading: 'Precios',
    pricingIntro: 'Las reglas completas, tal como se aplican a cada cotización:',
    tableCaption: 'Resumen de tarifas',
    colOption: 'Opción',
    colRate: 'Tarifa',
    colWhen: 'Cuándo aplica',
    rows: {
      package: 'Paquete de 7 canciones',
      packageWhen: 'Lunes a viernes, dentro de 25 millas del 90011',
      weekday: 'Por hora entre semana',
      weekdayWhen: 'Lunes a viernes, sin mínimo de horas dentro de 25 millas',
      weekend: 'Por hora en fin de semana',
      weekendWhen: 'Sábado y domingo, comenzando a las 3:00 PM o más tarde',
      deposit: 'Depósito para apartar',
      depositWhen: `Se resta del total; mínimo $${PRICING.rushFlatDeposit} si reservas con menos de 24 h de anticipación`,
      flat: ' fijo',
      perHour: ' por hora',
      none: '',
    },
    faqHeading: 'Preguntas comunes',
    faqNote: 'Las reglas de precio y de cancelación están completas en la lista de arriba.',
    faqLink: 'Ver todas las preguntas frecuentes',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Mariachi services & pricing',
    description:
      'Mariachi for weddings, quinceañeras, masses, serenatas, corporate events, and memorials across Los Angeles County, with exact pricing.',
    intro:
      'Hire live mariachi in Los Angeles for six kinds of events. We cover all of Los Angeles County — below are the services we offer and the complete pricing rules we apply to every quote.',
    servicesHeading: 'What we play',
    occasionsLabel: 'Moments we cover',
    hearLiveLabel: 'Hear us live',
    seeRepertoireLabel: 'See the repertoire',
    pricingHeading: 'Pricing',
    pricingIntro: 'The complete rules, exactly as they apply to every quote:',
    tableCaption: 'Rate summary',
    colOption: 'Option',
    colRate: 'Rate',
    colWhen: 'When it applies',
    rows: {
      package: '7-song package',
      packageWhen: 'Monday–Friday, within 25 miles of 90011',
      weekday: 'Weekday hourly',
      weekdayWhen: 'Monday–Friday, no hour minimum within 25 miles',
      weekend: 'Weekend hourly',
      weekendWhen: 'Saturday & Sunday, starting 3:00 PM or later',
      deposit: 'Deposit to reserve',
      depositWhen: `Applied to the total; minimum $${PRICING.rushFlatDeposit} if you book less than 24h ahead`,
      flat: ' flat',
      perHour: '/hr',
      none: '',
    },
    faqHeading: 'Common questions',
    faqNote: 'The full pricing and cancellation rules are in the list above.',
    faqLink: 'See all frequently asked questions',
    breadcrumbHome: 'Home',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/services',
    title: t.title,
    description: t.description,
  })
}

const linkCls =
  'text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline'

export default async function ServicesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const dict = await getDictionary(locale)
  const t = COPY[locale]

  const servicesUrl = alternatesFor('/services').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  const rate = (amount: number, unit: string) => `$${amount}${unit}`
  const rows = [
    {
      label: t.rows.package,
      rate: rate(PRICING.sevenSongsFlat, t.rows.flat),
      when: t.rows.packageWhen,
    },
    {
      label: t.rows.weekday,
      rate: rate(PRICING.hourlyWeekday, t.rows.perHour),
      when: t.rows.weekdayWhen,
    },
    {
      label: t.rows.weekend,
      rate: rate(PRICING.hourlyWeekend, t.rows.perHour),
      when: t.rows.weekendWhen,
    },
    {
      label: t.rows.deposit,
      rate: `$${PRICING.depositPerHour}${t.rows.perHour}`,
      when: t.rows.depositWhen,
    },
  ]

  // The FAQPage schema mirrors exactly the Q&A pairs rendered below it; the
  // pricing and cancellation answers are covered by /faq, which carries all
  // nine entries, and their content is visible here as the pricing rules list.
  const faqVisible = FAQ.slice(1, 4)
  const faqSchemaItems = faqVisible.map((f) => ({ q: f.q[locale], a: f.a[locale] }))

  return (
    <main id="main">
      <JsonLd data={service({ locale, url: servicesUrl })} />
      <JsonLd data={faqPage(faqSchemaItems)} />
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: servicesUrl },
        ])}
      />

      <Section className="border-b border-charcoal-border bg-surface-container-lowest">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.intro}</p>
      </Section>

      <Section>
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
          {t.servicesHeading}
        </h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((item) => (
            <li
              key={item.slug}
              className="rounded border border-charcoal-border bg-surface-container p-5"
            >
              <h3 className="font-display text-xl text-crema-white">{item.title[locale]}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{item.summary[locale]}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-silver">
                {t.occasionsLabel}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-on-surface-variant">
                {item.occasions.map((occasion) => (
                  <li key={occasion.en}>{occasion[locale]}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-6">
          <Link href={localizedPath('/media', locale)} className={linkCls}>
            {t.hearLiveLabel}
          </Link>
          <Link href={localizedPath('/repertoire', locale)} className={linkCls}>
            {t.seeRepertoireLabel}
          </Link>
        </div>
      </Section>

      <Section className="border-y border-charcoal-border bg-surface-container-lowest">
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
          {t.pricingHeading}
        </h2>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t.pricingIntro}</p>
        <ul className="mt-6 max-w-3xl list-disc space-y-3 pl-5 text-on-surface">
          {pricingLines(locale).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <div
          role="region"
          aria-label={t.tableCaption}
          tabIndex={0}
          className="mt-10 overflow-x-auto rounded border border-charcoal-border"
        >
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <caption className="px-4 pt-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-silver">
              {t.tableCaption}
            </caption>
            <thead>
              <tr className="border-b border-charcoal-border">
                <th scope="col" className="px-4 py-3 font-semibold text-crema-white">
                  {t.colOption}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-crema-white">
                  {t.colRate}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-crema-white">
                  {t.colWhen}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-charcoal-border last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium text-on-surface">
                    {row.label}
                  </th>
                  <td className="px-4 py-3 whitespace-nowrap text-burnished-gold">{row.rate}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{row.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.faqHeading}</h2>
          <Link href={localizedPath('/faq', locale)} className={linkCls}>
            {t.faqLink}
          </Link>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted-silver">{t.faqNote}</p>
        <dl className="mt-8 max-w-3xl space-y-6">
          {faqVisible.map((item) => (
            <div
              key={item.q.en}
              className="rounded border border-charcoal-border bg-surface-container p-5"
            >
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
