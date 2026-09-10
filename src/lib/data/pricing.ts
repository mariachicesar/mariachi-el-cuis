import type { Locale } from '@/lib/i18n/locales'

export const PRICING = {
  sevenSongsFlat: 380,
  hourlyWeekday: 500,
  hourlyWeekend: 550,
  weekdayRadiusMi: 25,
  minimumTable: [
    { maxMi: 15, hours: 2 },
    { maxMi: 30, hours: 3 },
    { maxMi: 50, hours: 4 },
  ],
  minimumStepMi: 20,
  deposit: 100,
  hoursWindow: { start: '07:00', end: '24:00' },
  weekendEarliestStart: '15:00',
  leadTimeCallHours: 3,
  leadTimeRushHours: 24,
  cancellationRefundDays: 7,
} as const

export function pricingLines(locale: Locale): string[] {
  const es = [
    'Lunes a viernes (dentro de 25 millas del 90011): paquete de 7 canciones por $380, o $500 por hora sin mínimo de horas.',
    'Sábado y domingo: $550 por hora, comenzando a las 3:00 PM o más tarde.',
    'Mínimo de horas según la distancia: 2 horas dentro de 15 millas, 3 horas dentro de 30, 4 horas dentro de 50, y 1 hora más por cada 20 millas adicionales.',
    'El depósito es de $100 para reservar la fecha; el saldo se paga después directamente al mariachi.',
    'Cancelación: el depósito es reembolsable solo si cancela 7 días o más antes del evento.',
    'Cotización instantánea únicamente dentro del Condado de Los Ángeles.',
  ]
  const en = [
    'Monday–Friday (within 25 miles of 90011): 7-song package for $380, or $500/hour with no hour minimum.',
    'Saturday & Sunday: $550/hour, starting 3:00 PM or later.',
    'Minimum hours by distance: 2 hours within 15 miles, 3 hours within 30, 4 hours within 50, then +1 hour per additional 20 miles.',
    'A $100 deposit reserves your date; the balance is paid later directly to the band.',
    'Cancellation: the deposit is refundable only if you cancel 7 or more days before the event.',
    'Instant quotes are available for Los Angeles County only.',
  ]
  return locale === 'es' ? es : en
}
