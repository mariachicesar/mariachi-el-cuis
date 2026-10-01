import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Check, ChevronDown, MailX, MessageCircle, Phone, ShieldCheck, Zap } from 'lucide-react'
import { notFound } from 'next/navigation'
import { BookingWizard } from '@/components/booking/booking-wizard'
import { buttonClasses } from '@/components/ui/button'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { BOOK_PAGE } from '@/lib/data/book-page'
import { MUSICIANS } from '@/lib/data/musicians'
import { pricingLines } from '@/lib/data/pricing'
import { siteConfig } from '@/lib/config/site'
import { features } from '@/lib/env'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'
import { breadcrumb, faqPage } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

// SEO metadata only; the visible selling copy lives in BOOK_PAGE.
const COPY = {
  es: {
    title: 'Contrata al mariachi — cotización y reserva',
    description:
      'Contrata a Mariachi El Cuis para tu evento en el Condado de Los Ángeles. Cotización exacta al instante; reserva con depósito en línea.',
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Hire the mariachi — get a quote & book',
    description:
      'Hire Mariachi El Cuis for your event in Los Angeles County. Instant exact quote; book online with a deposit.',
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

const asideHeadingCls = 'font-display text-xl text-burnished-gold'

export default async function BookPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const t = COPY[locale]
  const p = BOOK_PAGE[locale]

  const bookUrl = alternatesFor('/book').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!
  const whatsappHref = `${siteConfig.whatsappUrl}?text=${encodeURIComponent(p.whatsappText)}`
  const pricing = pricingLines(locale)
  const chips = [
    { Icon: Zap, label: p.chips.price },
    { Icon: ShieldCheck, label: p.chips.noSubs },
    { Icon: MailX, label: p.chips.noEmail },
  ]

  return (
    <main id="main">
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: bookUrl },
        ])}
      />
      <JsonLd
        data={faqPage([...p.faq, { q: p.pricingQuestion, a: pricing.join(' ') }])}
      />

      {/* Hero and form share one section with tight top padding, so the first
          form field sits on the first screen of a phone. */}
      <section className="w-full pb-16 pt-8 md:pb-20 md:pt-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{p.heroTitle}</h1>
          <p className="mt-3 max-w-2xl font-semibold text-crema-white">{p.guarantee}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {chips.map(({ Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-charcoal-border bg-surface-container px-3 py-1 text-sm text-crema-white"
              >
                <Icon className="h-4 w-4 text-burnished-gold" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
            <BookingWizard locale={locale} features={features} />

            <aside className="space-y-10 lg:border-l lg:border-charcoal-border lg:pl-12">
              <div>
                <h2 className={asideHeadingCls}>{p.guaranteeHeading}</h2>
                <ul className="mt-4 space-y-3">
                  {p.guaranteeItems.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-on-surface">
                      <Check
                        className="mt-0.5 h-5 w-5 shrink-0 text-burnished-gold"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className={asideHeadingCls}>{p.meetMusicians}</h2>
                <ul className="mt-4 flex flex-wrap gap-3">
                  {MUSICIANS.map((m) => (
                    <li key={m.slug}>
                      <Link
                        href={localizedPath(`/about/${m.slug}`, locale)}
                        className="flex flex-col items-center gap-1 text-xs text-on-surface hover:text-burnished-gold"
                      >
                        <Image
                          src={m.photo}
                          alt=""
                          width={56}
                          height={56}
                          sizes="56px"
                          loading="lazy"
                          className="h-14 w-14 rounded-full border border-charcoal-border object-cover object-top"
                        />
                        {m.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div data-track-location="book_talk">
                <h2 className={asideHeadingCls}>{p.talkHeading}</h2>
                <p className="mt-2 text-on-surface-variant">{p.talkIntro}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses('primary', 'min-h-11')}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    {p.whatsappLabel}
                  </a>
                  <a
                    href={`tel:${siteConfig.phoneTel}`}
                    className={buttonClasses('ghost', 'min-h-11')}
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {p.callLabel} {siteConfig.phoneDisplay}
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Section className="border-t border-charcoal-border bg-surface-container-lowest">
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{p.faqHeading}</h2>
        <div className="mt-6 max-w-3xl space-y-3">
          {p.faq.map((item) => (
            <FaqItem key={item.q} question={item.q}>
              <p>{item.a}</p>
            </FaqItem>
          ))}
          <FaqItem question={p.pricingQuestion}>
            <ul className="list-disc space-y-2 pl-5">
              {pricing.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </FaqItem>
        </div>
      </Section>
    </main>
  )
}

// Native <details> accordion: works with no JavaScript, so it adds nothing to
// the page's hydration cost.
function FaqItem({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details className="group rounded border border-charcoal-border bg-surface-container">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-lg text-crema-white [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown
          className="h-5 w-5 shrink-0 text-burnished-gold transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="px-5 pb-5 text-on-surface-variant">{children}</div>
    </details>
  )
}
