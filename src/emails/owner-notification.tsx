import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'

export function OwnerNotificationEmail({
  metadata,
  pdfFailed,
  calendarFailed,
}: {
  metadata: Record<string, string>
  pdfFailed?: boolean
  calendarFailed?: boolean
}) {
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
            {metadata.signatureName && (
              <Text>
                Contract: v{metadata.contractVersion} signed by {metadata.signatureName} at{' '}
                {metadata.signedAt} (countersigned PDF attached)
              </Text>
            )}
            {pdfFailed && (
              <Text>
                Warning: the performance agreement PDF could not be generated — this email has no
                attachment. Generate it manually from the Stripe session metadata.
              </Text>
            )}
            {calendarFailed && (
              <Text>
                Warning: the Google Calendar event could not be confirmed (event id{' '}
                {metadata.calendarEventId}). Update the calendar manually.
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
