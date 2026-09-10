import { Phone } from 'lucide-react'
import { Button, buttonClasses } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { siteConfig } from '@/lib/config/site'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'

export function CtaBand({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const es = locale === 'es'

  return (
    <Section className="border-t border-charcoal-border bg-surface-container">
      <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
        {es ? '¿Listo para apartar tu fecha?' : 'Ready to lock in your date?'}
      </h2>
      <p className="mt-3 max-w-2xl text-on-surface-variant">
        {es
          ? 'Cuéntanos la fecha, la hora y la ciudad y te enviamos una cotización.'
          : 'Tell us the date, time, and city and we will send you a quote.'}
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
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
    </Section>
  )
}
