import { Phone } from 'lucide-react'
import Image from 'next/image'
import { Button, buttonClasses } from '@/components/ui/button'
import heroPhoto from '@/assets/brand/cuarteto-mariachi.jpg'
import { siteConfig } from '@/lib/config/site'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'

export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const es = locale === 'es'

  return (
    <section className="relative overflow-hidden bg-surface-container">
      <Image
        src={heroPhoto}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_20%]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(239,176,73,0.16),_transparent_55%),_linear-gradient(180deg,_rgba(0,0,0,0.55),_rgba(0,0,0,0.75))]"
      />
      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 lg:px-12">
        <p className="font-display text-sm uppercase tracking-widest text-burnished-gold">
          {siteConfig.serviceCountyLabel[locale]}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-crema-white md:text-5xl">
          {es
            ? 'Mariachi El Cuis — mariachi en vivo en Los Ángeles'
            : 'Mariachi El Cuis — live mariachi in Los Angeles'}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-on-surface-variant">
          {es
            ? 'Mariachi tradicional para bodas, quinceañeras, misas y serenatas en el Condado de Los Ángeles. Cotiza y reserva directamente con la agrupación.'
            : 'Traditional mariachi for weddings, quinceañeras, masses, and serenatas across Los Angeles County. Get a quote and book directly with the group.'}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button href={localizedPath('/book', locale)} variant="primary">
            {dict.cta.checkAvailability}
          </Button>
          <a href={`tel:${siteConfig.phoneTel}`} className={buttonClasses('ghost')}>
            <Phone className="h-4 w-4" aria-hidden="true" />
            {dict.cta.call} {siteConfig.phoneDisplay}
          </a>
          <a
            href={siteConfig.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses('ghost')}
          >
            {dict.cta.whatsapp}
          </a>
        </div>
      </div>
    </section>
  )
}
