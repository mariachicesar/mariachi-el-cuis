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
    title: 'Términos de servicio',
    description:
      'Términos de reserva de Mariachi El Cuis: depósito, cancelaciones, horario de actuación, área de servicio y formas de pago en el Condado de Los Ángeles.',
    intro:
      'Estos términos explican cómo funciona una reserva con Mariachi El Cuis. Al pagar el depósito, aceptas estos términos.',
    sections: [
      {
        heading: 'Un acuerdo directo con el mariachi',
        body: [
          'Cuando reservas con nosotros, el acuerdo es directamente entre tú y Mariachi El Cuis — no somos una agencia ni un intermediario que subcontrata a otro grupo. El mariachi que confirma tu fecha es el que se presenta a tu evento.',
        ],
      },
      {
        heading: 'Depósito y saldo',
        body: [
          'El depósito es de $50 por cada hora reservada (o $50 para el paquete de 7 canciones), y aparta tu fecha y hora una vez confirmada la disponibilidad. Si reservas con menos de 24 horas de anticipación, el depósito mínimo es de $150. El saldo restante se paga el día del evento, directamente al mariachi, antes o al comenzar la presentación.',
        ],
      },
      {
        heading: 'Cancelaciones y reembolsos',
        body: [
          'El depósito es reembolsable únicamente si cancelas 7 días o más antes de la fecha del evento. Si cancelas dentro de los 7 días previos al evento, el depósito no es reembolsable.',
          'Para cancelar o cambiar tu fecha, contáctanos lo antes posible por WhatsApp, teléfono o correo.',
        ],
      },
      {
        heading: 'Horario de actuación',
        body: [
          'Tocamos entre las 7:00 AM y la medianoche. Los eventos de fin de semana (sábado y domingo) deben comenzar a las 3:00 PM o más tarde.',
        ],
      },
      {
        heading: 'Área de servicio',
        body: [
          `Damos servicio en todo el ${siteConfig.serviceCountyLabel.es}. Eventos fuera de esta área pueden coordinarse, pero podrían tener costos adicionales de viaje.`,
        ],
      },
      {
        heading: 'Formas de pago',
        body: [
          'El depósito se paga con tarjeta a través de Stripe. El saldo se paga el día del evento en efectivo o por Zelle.',
          'No se aceptan cheques, excepto cheques entregados al menos 3 días hábiles antes de la fecha del evento.',
        ],
      },
      {
        heading: 'Sets y descansos',
        body: [
          'Tocamos durante las horas reservadas, con un descanso de 15 minutos después de la primera hora y después sets de aproximadamente 45 minutos seguidos de descansos de 15 minutos, ajustado al total de horas reservadas.',
        ],
      },
      {
        heading: 'Integrantes y sustitutos',
        body: [
          'La contratación es con Mariachi El Cuis como grupo, no con integrantes específicos. Algunos integrantes pueden ausentarse por enfermedad o asuntos personales; al menos el 80% de los integrantes habituales estará presente, y cualquier sustituto será de talento igual o superior.',
        ],
      },
      {
        heading: 'Cambios de dirección o fecha',
        body: [
          'Un cambio de dirección o de fecha del evento puede modificar el precio y nuestra disponibilidad o compromiso. Cualquier cambio se confirma por escrito con una cotización revisada.',
        ],
      },
      {
        heading: 'Seguro',
        body: [
          'El seguro del evento o de responsabilidad civil no está incluido en la cotización y está disponible por un costo adicional.',
        ],
      },
      {
        heading: 'Medios y producciones comerciales',
        body: [
          'Televisión, comerciales, transmisiones y producciones similares se cotizan por separado y no están cubiertas por una reserva estándar.',
        ],
      },
    ],
    breadcrumbHome: 'Inicio',
  },
  en: {
    title: 'Terms of service',
    description:
      'Booking terms for Mariachi El Cuis: deposit, cancellations, performance hours, service area, and payment methods across Los Angeles County.',
    intro:
      'These terms explain how booking Mariachi El Cuis works. By paying the deposit, you agree to these terms.',
    sections: [
      {
        heading: 'A direct agreement with the band',
        body: [
          "When you book with us, the agreement is directly between you and Mariachi El Cuis — we are not an agency or a broker subcontracting another group. The band that confirms your date is the band that shows up to your event.",
        ],
      },
      {
        heading: 'Deposit and balance',
        body: [
          'The deposit is $50 per hour booked (or $50 for the 7-songs package), and reserves your date and time once availability is confirmed. If you book less than 24 hours before the event, the minimum deposit is $150. The remaining balance is paid on the day of the event, directly to the band, before or at the start of the performance.',
        ],
      },
      {
        heading: 'Cancellations and refunds',
        body: [
          'The deposit is refundable only if you cancel 7 or more days before the event date. If you cancel within 7 days of the event, the deposit is non-refundable.',
          'To cancel or change your date, contact us as soon as possible by WhatsApp, phone, or email.',
        ],
      },
      {
        heading: 'Performance hours',
        body: [
          'We perform between 7 AM and midnight. Weekend events (Saturday and Sunday) must start at 3 PM or later.',
        ],
      },
      {
        heading: 'Service area',
        body: [
          `We serve all of ${siteConfig.serviceCountyLabel.en}. Events outside this area can sometimes be arranged, but may carry additional travel costs.`,
        ],
      },
      {
        heading: 'Payment methods',
        body: [
          'The deposit is paid by card via Stripe. The balance is paid on the day of the event in cash or by Zelle.',
          'No checks are accepted, except checks delivered at least 3 business days before the event date.',
        ],
      },
      {
        heading: 'Sets and breaks',
        body: [
          'We perform for the hours booked, with a 15-minute break after the first hour, then sets of approximately 45 minutes followed by 15-minute breaks, adjusted to the total hours booked.',
        ],
      },
      {
        heading: 'Band members and substitutes',
        body: [
          'The engagement is with Mariachi El Cuis as a group, not with specific individual members. Members may be absent due to illness or personal time off; at least 80% of the regular members will be present, and any substitute will be of equal or greater talent.',
        ],
      },
      {
        heading: 'Address or date changes',
        body: [
          'A change of event address or date may change the price and our availability or commitment. Any change is confirmed in writing with a revised quote.',
        ],
      },
      {
        heading: 'Insurance',
        body: [
          'Event or liability insurance is not included in the quote and is available at additional cost.',
        ],
      },
      {
        heading: 'Media and commercial productions',
        body: [
          'Television, commercials, broadcasts, and similar productions are priced separately and are not covered by a standard booking.',
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
    path: '/terms',
    title: t.title,
    description: t.description,
  })
}

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const t = COPY[locale]

  const termsUrl = alternatesFor('/terms').languages[locale]!
  const homeUrl = alternatesFor('/').languages[locale]!

  return (
    <main id="main">
      {/* TODO: owner/lawyer review */}
      <JsonLd
        data={breadcrumb([
          { name: t.breadcrumbHome, url: homeUrl },
          { name: t.title, url: termsUrl },
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
