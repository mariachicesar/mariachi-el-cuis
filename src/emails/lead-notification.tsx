import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'

export function LeadNotificationEmail({
  name,
  email,
  phone,
  eventDate,
  startTime,
  address,
}: {
  name: string
  email: string
  phone: string
  eventDate: string
  startTime: string
  address: string
}) {
  return (
    <Html>
      <Head />
      <Preview>New quote request — {name || email}</Preview>
      <Body style={{ fontFamily: 'Georgia, serif', backgroundColor: '#131315', color: '#F5EFE3' }}>
        <Container>
          <Heading>New quote request</Heading>
          <Section>
            <Text>Name: {name || '—'}</Text>
            <Text>Email: {email}</Text>
            <Text>Phone: {phone || '—'}</Text>
            <Text>Date: {eventDate}</Text>
            <Text>Time: {startTime}</Text>
            <Text>Address: {address}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
