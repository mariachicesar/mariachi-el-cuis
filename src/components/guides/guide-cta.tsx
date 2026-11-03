import { Phone } from 'lucide-react'
import { Button, buttonClasses } from '@/components/ui/button'
import { siteConfig } from '@/lib/config/site'
import { PRICING } from '@/lib/data/pricing'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'

type CtaCopy = { heading: string; body: string; primaryLabel: string; primaryHref: string }

/**
 * Booking box shown under every guide. Guides rank for "what songs" searches;
 * this turns that reader into a booking by pointing at the matching occasion page.
 */
function copyFor(slug: string, locale: Locale): CtaCopy {
  const es = locale === 'es'
  const serenata = `$${PRICING.sevenSongsFlat}`
  const hourly = `$${PRICING.hourlyWeekend}`
  switch (slug) {
    case 'quinceanera-song-guide':
      return es
        ? {
            heading: '¿Ya tienes la fecha de tus XV años?',
            body: `Tocamos la misa, el vals y la fiesta con estas canciones y las que pida tu familia. ${hourly} la hora en fin de semana, precio fijo. Los músicos que contratas son los que llegan.`,
            primaryLabel: 'Ver mariachi para quinceañera',
            primaryHref: '/services/quinceanera',
          }
        : {
            heading: 'Have your quinceañera date yet?',
            body: `We play the Mass, the vals, and the party with these songs and any your family requests. ${hourly}/hr on weekends, fixed price. The musicians you book are the ones who show up.`,
            primaryLabel: 'See quinceañera mariachi',
            primaryHref: '/services/quinceanera',
          }
    case 'wedding-mariachi-timeline':
      return es
        ? {
            heading: '¿Quieres mariachi en tu boda?',
            body: `Cubrimos la ceremonia, el coctel y la entrada a la recepción. ${hourly} la hora en fin de semana, sin sustitutos.`,
            primaryLabel: 'Ver mariachi para bodas',
            primaryHref: '/services/wedding',
          }
        : {
            heading: 'Want mariachi at your wedding?',
            body: `We cover the ceremony, cocktail hour, and reception entrance. ${hourly}/hr on weekends, no substitutes.`,
            primaryLabel: 'See wedding mariachi',
            primaryHref: '/services/wedding',
          }
    case 'best-mariachi-songs-by-occasion':
      return es
        ? {
            heading: '¿Quieres escuchar estas canciones en vivo?',
            body: `Serenata de 7 canciones por ${serenata} entre semana, o ${hourly} la hora en fin de semana. Tú eliges las canciones.`,
            primaryLabel: 'Ver serenatas y cumpleaños',
            primaryHref: '/services/serenata',
          }
        : {
            heading: 'Want to hear these songs live?',
            body: `A 7-song serenata for ${serenata} on weekdays, or ${hourly}/hr on weekends. You pick the songs.`,
            primaryLabel: 'See serenatas & birthdays',
            primaryHref: '/services/serenata',
          }
    case 'mariachi-funeral-songs':
      return es
        ? {
            heading: '¿Necesita mariachi para un velorio, misa o sepelio?',
            body: 'Tocamos en funerarias, iglesias y cementerios de todo el Condado de Los Ángeles, muchas veces con poco aviso. Llámenos y le confirmamos en minutos.',
            primaryLabel: 'Pedir cotización',
            primaryHref: '/book',
          }
        : {
            heading: 'Need mariachi for a viewing, Mass, or burial?',
            body: 'We play funeral homes, churches, and cemeteries across Los Angeles County, often on short notice. Call and we will confirm within minutes.',
            primaryLabel: 'Request a quote',
            primaryHref: '/book',
          }
    default:
      return es
        ? {
            heading: '¿Listo para apartar tu fecha?',
            body: `Precios fijos: serenata de 7 canciones por ${serenata} o ${hourly} la hora en fin de semana. Cotización al instante.`,
            primaryLabel: 'Consultar disponibilidad',
            primaryHref: '/book',
          }
        : {
            heading: 'Ready to lock in your date?',
            body: `Fixed prices: a 7-song serenata for ${serenata} or ${hourly}/hr on weekends. Instant quote.`,
            primaryLabel: 'Check availability',
            primaryHref: '/book',
          }
  }
}

export function GuideCta({ slug, locale }: { slug: string; locale: Locale }) {
  const c = copyFor(slug, locale)
  const es = locale === 'es'
  return (
    <aside className="mt-12 max-w-3xl rounded border border-burnished-gold/60 bg-surface-container p-6">
      <h2 className="font-display text-2xl text-burnished-gold">{c.heading}</h2>
      <p className="mt-3 text-on-surface-variant">{c.body}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button href={localizedPath(c.primaryHref, locale)} variant="primary">
          {c.primaryLabel}
        </Button>
        <a href={`tel:${siteConfig.phoneTel}`} className={buttonClasses('ghost')}>
          <Phone className="h-4 w-4" aria-hidden="true" />
          {siteConfig.phoneDisplay}
        </a>
        <a href={localizedPath('/media', locale)} className={buttonClasses('ghost')}>
          {es ? 'Escúchanos tocar' : 'Hear us play'}
        </a>
      </div>
    </aside>
  )
}
