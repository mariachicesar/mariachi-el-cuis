import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarCheck, MessageCircle, Phone, Star } from 'lucide-react'
import { FacebookIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from '@/components/ui/social-icons'
import logo from '@/assets/brand/logo.png'
import { siteConfig } from '@/lib/config/site'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'
import { buildMetadata } from '@/lib/seo/metadata'

// Link-in-bio page behind the QR code on our business cards: Google review
// first, then socials and booking. Shared by QR/link only — noindex (meta tag
// and X-Robots-Tag in next.config.ts) and left out of the sitemap and nav.

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const COPY = {
  es: {
    title: 'Mariachi El Cuis · Enlaces',
    description: 'Déjanos una reseña en Google y síguenos en Instagram, TikTok y Facebook.',
    tagline: 'Mariachi en Los Ángeles · Sin sustitutos',
    reviewHeading: '¿Te gustó la música?',
    review: 'Déjanos una reseña en Google',
    reviewNote: 'Toma menos de un minuto y nos ayuda muchísimo. ¡Gracias!',
    followHeading: 'Síguenos',
    contactHeading: 'Contrátanos',
    book: 'Ver precio y reservar',
    whatsapp: 'WhatsApp',
    call: `Llamar ${siteConfig.phoneDisplay}`,
  },
  en: {
    title: 'Mariachi El Cuis · Links',
    description: 'Leave us a Google review and follow us on Instagram, TikTok, and Facebook.',
    tagline: 'Los Angeles mariachi · No substitutes',
    reviewHeading: 'Enjoyed the music?',
    review: 'Leave us a Google review',
    reviewNote: 'It takes less than a minute and helps us a lot. Thank you!',
    followHeading: 'Follow us',
    contactHeading: 'Book us',
    book: 'See pricing & book',
    whatsapp: 'WhatsApp',
    call: `Call ${siteConfig.phoneDisplay}`,
  },
} satisfies Record<Locale, Record<string, string>>

const SOCIALS = [
  { name: 'Instagram', href: siteConfig.instagramUrl, Icon: InstagramIcon },
  { name: 'TikTok', href: siteConfig.tiktokUrl, Icon: TiktokIcon },
  { name: 'Facebook', href: siteConfig.facebookUrl, Icon: FacebookIcon },
  { name: 'YouTube', href: siteConfig.youtubeUrl, Icon: YoutubeIcon },
]

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/links',
    title: t.title,
    description: t.description,
    titleAbsolute: true,
    noindex: true,
  })
}

const rowCls =
  'flex min-h-14 w-full items-center gap-4 rounded-lg border border-charcoal-border bg-charcoal-elevated px-5 py-3 text-base font-semibold text-crema-white transition-colors hover:border-burnished-gold'

function ExternalRow({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={rowCls}>
      <span className="text-burnished-gold">{icon}</span>
      {children}
    </a>
  )
}

export default async function LinksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const t = COPY[lang]

  return (
    <main id="main" className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <Image src={logo} alt="Mariachi El Cuis" width={112} height={112} priority className="h-28 w-28 object-contain" />
        <h1 className="mt-4 text-3xl text-crema-white">{siteConfig.name}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">{t.tagline}</p>
      </div>

      <section aria-labelledby="links-review" className="mt-8">
        <h2 id="links-review" className="text-center text-lg text-crema-white">
          {t.reviewHeading}
        </h2>
        <a
          href={siteConfig.googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex min-h-16 w-full flex-col items-center justify-center rounded-lg bg-primary-container px-5 py-3 font-semibold text-on-primary transition-colors hover:bg-burnished-gold"
        >
          <span className="flex gap-0.5" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </span>
          <span className="mt-1 text-base uppercase tracking-wider">{t.review}</span>
        </a>
        <p className="mt-2 text-center text-xs text-on-surface-variant">{t.reviewNote}</p>
      </section>

      <section aria-labelledby="links-follow" className="mt-8">
        <h2 id="links-follow" className="mb-3 text-center text-lg text-crema-white">
          {t.followHeading}
        </h2>
        <ul className="flex flex-col gap-3">
          {SOCIALS.map(({ name, href, Icon }) => (
            <li key={name}>
              <ExternalRow href={href} icon={<Icon className="h-6 w-6" />}>
                {name}
              </ExternalRow>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="links-contact" className="mt-8">
        <h2 id="links-contact" className="mb-3 text-center text-lg text-crema-white">
          {t.contactHeading}
        </h2>
        <ul className="flex flex-col gap-3">
          <li>
            <Link href={localizedPath('/book', lang)} className={rowCls}>
              <span className="text-burnished-gold">
                <CalendarCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              {t.book}
            </Link>
          </li>
          <li>
            <ExternalRow href={siteConfig.whatsappUrl} icon={<MessageCircle className="h-6 w-6" aria-hidden="true" />}>
              {t.whatsapp}
            </ExternalRow>
          </li>
          <li>
            <a href={`tel:${siteConfig.phoneTel}`} className={rowCls}>
              <span className="text-burnished-gold">
                <Phone className="h-6 w-6" aria-hidden="true" />
              </span>
              {t.call}
            </a>
          </li>
        </ul>
      </section>
    </main>
  )
}
