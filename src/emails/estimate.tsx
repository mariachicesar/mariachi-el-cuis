import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { Locale } from '@/lib/i18n/locales'
import type { QuoteResult } from '@/lib/quote/types'

const COPY = {
  es: {
    preview: 'Tu cotización de Mariachi El Cuis',
    heading: 'Tu cotización',
    address: 'Dirección del evento',
    total: 'Total estimado',
    deposit: 'Depósito requerido',
    balance: 'Saldo (se paga el día del evento)',
    rush: 'Reserva de último momento: el depósito mínimo es de $150.',
    minimum: (h: number) => `Se aplicó un mínimo de ${h} horas por la distancia del evento.`,
    contact: 'Para esta fecha necesitamos coordinar contigo directamente.',
    call: 'Necesitamos que nos llames para confirmar esta reserva.',
    phone: 'Llámanos: (626) 922-0091',
  },
  en: {
    preview: 'Your Mariachi El Cuis estimate',
    heading: 'Your estimate',
    address: 'Event address',
    total: 'Estimated total',
    deposit: 'Deposit required',
    balance: 'Balance (paid on the event day)',
    rush: 'Last-minute booking: the minimum deposit is $150.',
    minimum: (h: number) => `A ${h}-hour minimum applies for this distance.`,
    contact: "We'll need to coordinate this date with you directly.",
    call: 'Please call us to confirm this booking.',
    phone: 'Call us: (626) 922-0091',
  },
} as const

export function EstimateEmail({
  locale,
  quote,
  address,
}: {
  locale: Locale
  quote: QuoteResult
  address: string
}) {
  const t = COPY[locale]
  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={{ fontFamily: 'Georgia, serif', backgroundColor: '#131315', color: '#F5EFE3' }}>
        <Container>
          <Heading>{t.heading}</Heading>
          <Text>
            {t.address}: {address}
          </Text>
          {quote.status === 'ok' ? (
            <Section>
              <Text>
                {t.total}: ${quote.total}
              </Text>
              <Text>
                {t.deposit}: ${quote.deposit}
              </Text>
              <Text>
                {t.balance}: ${quote.balanceDue}
              </Text>
              {quote.rush && <Text>{t.rush}</Text>}
              {quote.minimumApplied && <Text>{t.minimum(quote.minimumApplied.enforced)}</Text>}
            </Section>
          ) : (
            <Section>
              <Text>{quote.status === 'call_required' ? t.call : t.contact}</Text>
              <Text>{t.phone}</Text>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  )
}
