import type { Locale } from '@/lib/i18n/locales'
import type { PackageType } from '@/lib/quote/types'

export const CONTRACT_VERSION = '2026-09-15'

export type ContractBooking = {
  name: string
  email: string
  phone: string
  eventDate: string // "YYYY-MM-DD"
  startTime: string // "HH:mm"
  enforcedHours: number
  packageType: PackageType
  address: string
  total: number
  deposit: number
  balanceDue: number
  locale: Locale
  signatureName: string
  signedAt: string // ISO timestamp, server-generated
}

export type ContractClause = { heading: string; body: string[] }

const CLAUSES: Record<Locale, ContractClause[]> = {
  es: [
    {
      heading: 'Partes y reserva',
      body: [
        'Este contrato es un acuerdo directo entre el cliente (identificado arriba) y Mariachi El Cuis. No somos una agencia ni un intermediario que subcontrata a otro grupo: el mariachi que confirma tu fecha es el que se presenta a tu evento.',
        'El evento, la fecha, la hora de inicio, la duración, la dirección y el paquete quedan establecidos en el resumen de esta reserva.',
      ],
    },
    {
      heading: 'Precio, depósito y saldo',
      body: [
        'El precio total, el depósito pagado y el saldo pendiente son los indicados en el resumen de esta reserva.',
        'El saldo restante se paga el día del evento, directamente al mariachi, antes o al comenzar la presentación.',
        'El depósito es reembolsable únicamente si cancelas 7 días o más antes de la fecha del evento. Si cancelas dentro de los 7 días previos al evento, el depósito no es reembolsable.',
      ],
    },
    {
      heading: 'Formas de pago',
      body: [
        'El saldo se paga en efectivo o por Zelle el día del evento.',
        'No se aceptan cheques, excepto cheques entregados al menos 3 días hábiles antes de la fecha del evento.',
      ],
    },
    {
      heading: 'Sets y descansos',
      body: [
        'Tocamos durante las horas reservadas. La estructura habitual es un descanso de 15 minutos después de la primera hora, y después sets de aproximadamente 45 minutos seguidos de descansos de 15 minutos, ajustado al total de horas reservadas.',
      ],
    },
    {
      heading: 'Integrantes y sustitutos',
      body: [
        'La contratación es con Mariachi El Cuis como grupo, no con integrantes específicos.',
        'Algunos integrantes pueden ausentarse por enfermedad o asuntos personales; al menos el 80% de los integrantes habituales estará presente, y cualquier músico sustituto será de talento igual o superior.',
      ],
    },
    {
      heading: 'Cambios y cancelaciones',
      body: [
        'Un cambio de dirección o de fecha del evento puede modificar el precio y la disponibilidad del grupo. Cualquier cotización revisada se confirmará por escrito.',
        'Para cancelar o cambiar tu fecha, contáctanos lo antes posible por WhatsApp, teléfono o correo.',
      ],
    },
    {
      heading: 'Seguro',
      body: [
        'El seguro del evento o de responsabilidad civil (por ejemplo, certificados de seguro para el lugar) no está incluido en la cotización y está disponible por un costo adicional.',
      ],
    },
    {
      heading: 'Medios y producciones comerciales',
      body: [
        'Televisión, comerciales, transmisiones, cine y producciones similares se cotizan bajo un acuerdo separado. Este contrato no cubre esos usos.',
      ],
    },
  ],
  en: [
    {
      heading: 'Parties and booking',
      body: [
        'This agreement is directly between the client (identified above) and Mariachi El Cuis. We are not an agency or a broker subcontracting another group: the band that confirms your date is the band that shows up to your event.',
        'The event date, start time, duration, address, and package are set out in this booking summary.',
      ],
    },
    {
      heading: 'Price, deposit, and balance',
      body: [
        'The total price, deposit paid, and balance due are those shown in this booking summary.',
        'The remaining balance is paid on the day of the event, directly to the band, before or at the start of the performance.',
        'The deposit is refundable only if you cancel 7 or more days before the event date. If you cancel within 7 days of the event, the deposit is non-refundable.',
      ],
    },
    {
      heading: 'Payment methods',
      body: [
        'The balance is payable in cash or by Zelle on the day of the event.',
        'No checks are accepted, except checks delivered at least 3 business days before the event date.',
      ],
    },
    {
      heading: 'Sets and breaks',
      body: [
        'The band performs for the hours booked. The standard structure is a 15-minute break after the first hour, then sets of approximately 45 minutes followed by 15-minute breaks, adjusted to the total hours booked.',
      ],
    },
    {
      heading: 'Band members and substitutes',
      body: [
        'The engagement is with Mariachi El Cuis as a group, not with specific individual members.',
        'Members may be absent due to illness or personal time off; at least 80% of the regular members will be present, and any substitute musician will be of equal or greater talent.',
      ],
    },
    {
      heading: 'Changes and cancellations',
      body: [
        "A change of event address or date may change the price and the band's availability and commitment. Any revised quote will be confirmed in writing.",
        'To cancel or change your date, contact us as soon as possible by WhatsApp, phone, or email.',
      ],
    },
    {
      heading: 'Insurance',
      body: [
        'Event or liability insurance (for example, certificates of insurance for venues) is not included in the quote and is available at additional cost.',
      ],
    },
    {
      heading: 'Media and commercial productions',
      body: [
        'Television, commercials, broadcasts, film, and similar productions are priced under a separate agreement. This contract does not cover those uses.',
      ],
    },
  ],
}

export function getClauses(locale: Locale): ContractClause[] {
  return CLAUSES[locale]
}

const LABELS = {
  es: {
    title: 'Contrato de presentación',
    client: 'Cliente',
    email: 'Correo',
    phone: 'Teléfono',
    date: 'Fecha',
    time: 'Hora de inicio',
    hours: 'Horas',
    package: 'Paquete',
    address: 'Dirección',
    total: 'Total',
    depositPaid: 'Depósito pagado',
    balanceDue: 'Saldo pendiente',
    signature: 'Firma del cliente',
    signedAt: 'Firmado el',
    version: 'Versión del contrato',
  },
  en: {
    title: 'Performance Agreement',
    client: 'Client',
    email: 'Email',
    phone: 'Phone',
    date: 'Date',
    time: 'Start time',
    hours: 'Hours',
    package: 'Package',
    address: 'Address',
    total: 'Total',
    depositPaid: 'Deposit paid',
    balanceDue: 'Balance due',
    signature: 'Client signature',
    signedAt: 'Signed at',
    version: 'Contract version',
  },
} as const

function packageLabel(packageType: PackageType, locale: Locale): string {
  if (packageType === 'seven_songs') return locale === 'es' ? 'Paquete de 7 canciones' : '7-songs package'
  return locale === 'es' ? 'Por hora' : 'Hourly'
}

/** "16:30" -> "4:30 PM" / "4:30 p. m." — human-readable wall time for the agreement. */
export function formatStartTime(time: string, locale: Locale): string {
  const [hour, minute] = time.split(':').map(Number) as [number, number]
  const displayHour = hour % 12 || 12
  const mm = String(minute).padStart(2, '0')
  if (locale === 'es') {
    return `${displayHour}:${mm} ${hour < 12 ? 'a. m.' : 'p. m.'}`
  }
  return `${displayHour}:${mm} ${hour < 12 ? 'AM' : 'PM'}`
}

/** Plain-text rendering of the full personalized agreement (emails fallback, tests). */
export function buildAgreementText(booking: ContractBooking): string {
  const l = LABELS[booking.locale]
  const lines: string[] = [
    `Mariachi El Cuis — ${l.title}`,
    `${l.version}: ${CONTRACT_VERSION}`,
    '',
    `${l.client}: ${booking.name}`,
    `${l.email}: ${booking.email}`,
    `${l.phone}: ${booking.phone || '—'}`,
    `${l.date}: ${booking.eventDate}`,
    `${l.time}: ${formatStartTime(booking.startTime, booking.locale)}`,
    `${l.hours}: ${booking.enforcedHours}`,
    `${l.package}: ${packageLabel(booking.packageType, booking.locale)}`,
    `${l.address}: ${booking.address}`,
    `${l.total}: $${booking.total}`,
    `${l.depositPaid}: $${booking.deposit}`,
    `${l.balanceDue}: $${booking.balanceDue}`,
    '',
  ]
  for (const clause of getClauses(booking.locale)) {
    lines.push(`${clause.heading}`, ...clause.body, '')
  }
  lines.push(`${l.signature}: ${booking.signatureName}`, `${l.signedAt}: ${booking.signedAt}`)
  return lines.join('\n')
}
