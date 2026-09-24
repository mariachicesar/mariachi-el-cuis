import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { Locale } from '@/lib/i18n/locales'
import { formatStartTime } from '@/lib/contract/terms'

const COPY = {
  es: {
    preview: 'Paga tu depósito para confirmar tu reserva',
    heading: 'Confirma tu reserva — Mariachi El Cuis',
    intro: 'Gracias por reservar con nosotros. Para confirmar tu evento, paga el depósito con el siguiente enlace seguro:',
    date: 'Fecha',
    time: 'Hora',
    address: 'Dirección',
    deposit: 'Depósito a pagar',
    balance: 'Saldo (se paga el día del evento)',
    button: 'Pagar depósito',
    expires: 'Este enlace de pago expira en 30 minutos. Si expira, contáctanos para generar uno nuevo.',
  },
  en: {
    preview: 'Pay your deposit to confirm your booking',
    heading: 'Confirm your booking — Mariachi El Cuis',
    intro: 'Thanks for booking with us. To confirm your event, pay the deposit using the secure link below:',
    date: 'Date',
    time: 'Time',
    address: 'Address',
    deposit: 'Deposit due',
    balance: 'Balance (paid on the event day)',
    button: 'Pay deposit',
    expires: 'This payment link expires in 30 minutes. If it expires, contact us for a new one.',
  },
} as const

export function PaymentLinkEmail({
  locale,
  checkoutUrl,
  eventDate,
  startTime,
  address,
  deposit,
  balanceDue,
}: {
  locale: Locale
  checkoutUrl: string
  eventDate: string
  startTime: string
  address: string
  deposit: number
  balanceDue: number
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
            <Text>{t.intro}</Text>
            <Text>
              {t.date}: {eventDate}
            </Text>
            <Text>
              {t.time}: {startTime ? formatStartTime(startTime, locale) : ''}
            </Text>
            <Text>
              {t.address}: {address}
            </Text>
            <Text>
              {t.deposit}: ${deposit}
            </Text>
            <Text>
              {t.balance}: ${balanceDue}
            </Text>
          </Section>
          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button
              href={checkoutUrl}
              style={{
                backgroundColor: '#efb049',
                color: '#131315',
                padding: '12px 24px',
                borderRadius: '6px',
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              {t.button}
            </Button>
          </Section>
          <Text style={{ fontSize: '12px', marginTop: '16px' }}>{t.expires}</Text>
        </Container>
      </Body>
    </Html>
  )
}
