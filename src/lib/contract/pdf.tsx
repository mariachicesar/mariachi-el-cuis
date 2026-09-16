import 'server-only'
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { CONTRACT_VERSION, formatStartTime, getClauses, type ContractBooking } from './terms'
import { siteConfig } from '@/lib/config/site'

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  title: { fontSize: 18, marginBottom: 4 },
  subtitle: { fontSize: 9, color: '#666666', marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 2 },
  label: { width: 110, fontWeight: 'bold' },
  clauseHeading: { fontSize: 10, fontWeight: 'bold', marginTop: 10, marginBottom: 2 },
  clauseBody: { marginBottom: 4, lineHeight: 1.4 },
  signatureBlock: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#999999', paddingTop: 12 },
  signatureLine: { fontSize: 14, fontFamily: 'Times-Italic', marginVertical: 6 },
})

const LABELS = {
  es: {
    title: 'Contrato de presentación',
    summary: 'Resumen de la reserva',
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
    clientSignature: 'Firma del cliente',
    bandSignature: 'ConFirma — Mariachi El Cuis',
    signedAt: 'Firmado el',
    confirmedAt: 'Confirmado el',
    version: 'Versión del contrato',
    packageSevenSongs: 'Paquete de 7 canciones',
    packageHourly: 'Por hora',
  },
  en: {
    title: 'Performance Agreement',
    summary: 'Booking summary',
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
    clientSignature: 'Client signature',
    bandSignature: 'Countersignature — Mariachi El Cuis',
    signedAt: 'Signed at',
    confirmedAt: 'Confirmed at',
    version: 'Contract version',
    packageSevenSongs: '7-songs package',
    packageHourly: 'Hourly',
  },
} as const

/** Renders the personalized, countersigned performance agreement as a PDF buffer. */
export async function buildAgreementPdf(
  booking: ContractBooking,
  countersignedAt: string,
): Promise<Buffer> {
  const t = LABELS[booking.locale]
  const clauses = getClauses(booking.locale)

  const doc = (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>
          {siteConfig.name} — {t.title}
        </Text>
        <Text style={styles.subtitle}>
          {t.version}: {CONTRACT_VERSION}
        </Text>

        <Text style={styles.sectionTitle}>{t.summary}</Text>
        <View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.client}:</Text>
            <Text>{booking.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.email}:</Text>
            <Text>{booking.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.phone}:</Text>
            <Text>{booking.phone || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.date}:</Text>
            <Text>{booking.eventDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.time}:</Text>
            <Text>{formatStartTime(booking.startTime, booking.locale)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.hours}:</Text>
            <Text>{booking.enforcedHours}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.package}:</Text>
            <Text>
              {booking.packageType === 'seven_songs' ? t.packageSevenSongs : t.packageHourly}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.address}:</Text>
            <Text>{booking.address}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.total}:</Text>
            <Text>${booking.total}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.depositPaid}:</Text>
            <Text>${booking.deposit}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.balanceDue}:</Text>
            <Text>${booking.balanceDue}</Text>
          </View>
        </View>

        {clauses.map((clause) => (
          <View key={clause.heading}>
            <Text style={styles.clauseHeading}>{clause.heading}</Text>
            {clause.body.map((paragraph) => (
              <Text key={paragraph} style={styles.clauseBody}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <View style={styles.signatureBlock}>
          <Text style={styles.sectionTitle}>{t.clientSignature}</Text>
          <Text style={styles.signatureLine}>{booking.signatureName}</Text>
          <Text>
            {t.signedAt}: {booking.signedAt}
          </Text>
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t.bandSignature}</Text>
          <Text style={styles.signatureLine}>
            {siteConfig.ownerLegalName}, {siteConfig.name}
          </Text>
          <Text>
            {t.confirmedAt}: {countersignedAt}
          </Text>
        </View>
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}
