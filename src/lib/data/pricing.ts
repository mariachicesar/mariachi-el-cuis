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
  depositPerHour: 50,
  rushFlatDeposit: 150,
  hoursWindow: { start: '07:00', end: '24:00' },
  weekendSevenSongsFlat: 470, // shared Saturday + Sunday serenata package price
  saturdayEarliestStart: '07:00',
  sundayEarliestStart: '08:00',
  saturdayMaxDistanceMi: 30, // beyond this, Saturday is contact_required
  saturdaySerenataEnd: '10:00', // 07:00-10:00 serenata window (Saturday only)
  saturdayMidDayEnd: '15:00', // 10:00-15:00 midday tier
  saturdayPeakEnd: '21:30', // 15:00-21:30 peak tier; >=21:30 is the late tier
  saturdayMidDayMinHours: 1,
  saturdayPeakMinHours: 2,
  saturdayLateMinHours: 1,
  travelBufferMinutes: 30, // replaces the literal 30*60*1000 in availability.ts
  leadTimeCallHours: 3,
  leadTimeRushHours: 24,
  cancellationRefundDays: 7,
} as const

export function pricingLines(locale: Locale): string[] {
  const es = [
    'Lunes a viernes (dentro de 25 millas del 90011): paquete de 7 canciones o paquete de 1 hora, solo entre semana.',
    'Sábado, 7:00–10:00 AM (serenata): paquete de 7 canciones o mínimo 1 hora.',
    'Sábado, 10:00 AM–3:00 PM: mínimo 1 hora.',
    'Sábado, 3:00–9:30 PM (hora pico): mínimo 2 horas.',
    'Sábado, después de las 9:30 PM: mínimo 1 hora.',
    'Reservas de sábado solo dentro de 30 millas del 90011 — más lejos, llámanos.',
    'Domingo, desde las 8:00 AM: paquete de 7 canciones o 1 hora con el mínimo de horas según la distancia.',
    'Mínimo de horas por distancia (domingo y entre semana con paquete por hora fuera de las 25 millas): 2 horas dentro de 15 millas, 3 horas dentro de 30, 4 horas dentro de 50, y 1 hora más por cada 20 millas adicionales.',
    'El depósito es de $50 por cada hora reservada (o $50 para el paquete de 7 canciones). Si reservas con menos de 24 horas de anticipación, el depósito mínimo es de $150. El saldo se paga después directamente al mariachi.',
    'Cancelación: el depósito es reembolsable solo si cancelas 7 días o más antes del evento.',
    'Cotización instantánea únicamente dentro del Condado de Los Ángeles.',
  ]
  const en = [
    'Monday–Friday (within 25 miles of 90011): 7-song package or 1 hr package weekdays only.',
    'Saturday, 7:00–10:00am ("serenata"): 7-song package or 1 hour minimum.',
    'Saturday, 10:00am–3:00pm: 1-hour minimum.',
    'Saturday, 3:00–9:30pm (peak): 2-hour minimum.',
    'Saturday, after 9:30pm: 1-hour minimum.',
    'Saturday bookings only within 30 miles of 90011 — farther out, please call.',
    'Sunday, from 8:00am: 7-song package or 1 hour with the standard distance-based hour minimum.',
    'Distance-based hour minimum (Sunday, and weekday hourly bookings beyond 25 miles): 2 hours within 15 miles, 3 hours within 30, 4 hours within 50, then +1 hour per additional 20 miles.',
    'The deposit is $50 per hour booked (or $50 for the 7-songs package). If you book less than 24 hours before the event, the minimum deposit is $150. The balance is paid later directly to the band.',
    'Cancellation: the deposit is refundable only if you cancel 7 or more days before the event.',
    'Instant quotes are available for Los Angeles County only.',
  ]
  return locale === 'es' ? es : en
}
