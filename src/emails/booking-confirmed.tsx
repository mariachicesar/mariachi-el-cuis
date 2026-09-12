import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { Locale } from '@/lib/i18n/locales'

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
  },
} as const

export function BookingConfirmedEmail({
  locale,
  metadata,
}: {
  locale: Locale
  metadata: Record<string, string>
}) {
  const t = COPY[locale]
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
              {t.time}: {metadata.startTime}
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
            <Text>{t.cancellation}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
