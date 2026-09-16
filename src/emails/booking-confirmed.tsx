import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { Locale } from '@/lib/i18n/locales'
import { formatStartTime } from '@/lib/contract/terms'
import { laWallTimeToUtc } from '@/lib/quote/timezone'

const COPY = {
  es: {
    preview: 'Tu reserva está confirmada',
    heading: '¡Reserva confirmada!',
    date: 'Fecha',
    time: 'Hora',
    address: 'Dirección',
    paid: 'Depósito pagado',
    balance: 'Saldo pendiente (se paga el día del evento)',
    cancellation:
      'El depósito es reembolsable solo si cancelas 7 días o más antes del evento.',
    payment:
      'El saldo se paga el día del evento en efectivo o por Zelle. No se aceptan cheques, salvo cheques entregados al menos 3 días hábiles antes del evento.',
    contract:
      'Adjuntamos tu contrato de presentación firmado. Guárdalo para tus registros.',
    addToCalendar: 'Agregar a Google Calendar',
    calendarTitle: 'Mariachi El Cuis — Evento',
  },
  en: {
    preview: 'Your booking is confirmed',
    heading: 'Booking confirmed!',
    date: 'Date',
    time: 'Time',
    address: 'Address',
    paid: 'Deposit paid',
    balance: 'Balance due (paid on the event day)',
    cancellation: 'The deposit is refundable only if you cancel 7 or more days before the event.',
    payment:
      'The balance is paid on the day of the event in cash or by Zelle. No checks are accepted, except checks delivered at least 3 business days before the event.',
    contract: 'Your signed performance agreement is attached. Please keep it for your records.',
    addToCalendar: 'Add to Google Calendar',
    calendarTitle: 'Mariachi El Cuis — Event',
  },
} as const

function toGoogleStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function googleCalendarUrl(metadata: Record<string, string>, title: string): string | null {
  const { eventDate, startTime, enforcedHours, address } = metadata
  if (!eventDate || !startTime || !enforcedHours) return null
  const hours = Number(enforcedHours)
  if (!Number.isFinite(hours) || hours <= 0) return null
  const startUtc = laWallTimeToUtc(eventDate, startTime)
  const endUtc = new Date(startUtc.getTime() + hours * 60 * 60 * 1000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toGoogleStamp(startUtc)}/${toGoogleStamp(endUtc)}`,
    location: address ?? '',
    details: `${metadata.name ?? ''} — ${metadata.packageType ?? ''}`.trim(),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function BookingConfirmedEmail({
  locale,
  metadata,
}: {
  locale: Locale
  metadata: Record<string, string>
}) {
  const t = COPY[locale]
  const calendarUrl = googleCalendarUrl(metadata, t.calendarTitle)
  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={{ fontFamily: 'Georgia, serif', backgroundColor: '#131315', color: '#F5EFE3' }}>
        <Container>
          <Heading>{t.heading}</Heading>
          <Section>
            <Text>
              {t.date}: {metadata.eventDate}
            </Text>
            <Text>
              {t.time}: {metadata.startTime ? formatStartTime(metadata.startTime, locale) : ''}
            </Text>
            <Text>
              {t.address}: {metadata.address}
            </Text>
            <Text>
              {t.paid}: ${metadata.deposit}
            </Text>
            <Text>
              {t.balance}: ${metadata.balanceDue}
            </Text>
            <Text>{t.payment}</Text>
            <Text>{t.cancellation}</Text>
            {metadata.signatureName && <Text>{t.contract}</Text>}
          </Section>
          {calendarUrl && (
            <Section style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button
                href={calendarUrl}
                style={{
                  backgroundColor: '#efb049',
                  color: '#131315',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                }}
              >
                {t.addToCalendar}
              </Button>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  )
}
