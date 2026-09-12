import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'

export function OwnerNotificationEmail({ metadata }: { metadata: Record<string, string> }) {
  return (
    <Html>
      <Head />
      <Preview>New booking — {metadata.name!}</Preview>
      <Body style={{ fontFamily: 'Georgia, serif', backgroundColor: '#131315', color: '#F5EFE3' }}>
        <Container>
          <Heading>New booking confirmed</Heading>
          <Section>
            <Text>Name: {metadata.name}</Text>
            <Text>Email: {metadata.email}</Text>
            <Text>Phone: {metadata.phone || '—'}</Text>
            <Text>Date: {metadata.eventDate}</Text>
            <Text>Time: {metadata.startTime}</Text>
            <Text>Package: {metadata.packageType}</Text>
            <Text>Hours: {metadata.enforcedHours}</Text>
            <Text>Address: {metadata.address}</Text>
            <Text>Deposit paid: ${metadata.deposit}</Text>
            <Text>Balance due: ${metadata.balanceDue}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
