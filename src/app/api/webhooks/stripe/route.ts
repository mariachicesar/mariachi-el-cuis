import { render } from '@react-email/render'
import { Resend } from 'resend'
import type Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { BookingConfirmedEmail } from '@/emails/booking-confirmed'
import { OwnerNotificationEmail } from '@/emails/owner-notification'
import { confirmEvent, releaseHoldEvent } from '@/lib/calendar/google'
import { buildAgreementPdf } from '@/lib/contract/pdf'
import type { ContractBooking } from '@/lib/contract/terms'
import { siteConfig } from '@/lib/config/site'
import { env, features } from '@/lib/env'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { verifyStripeWebhook } from '@/lib/payments/stripe'

export const runtime = 'nodejs'

export async function POST(req: Request): Promise<Response> {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = verifyStripeWebhook(payload, signature)
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const m = (session.metadata ?? {}) as Record<string, string>

    let alreadyConfirmed = false
    let calendarFailed = false
    if (m.calendarEventId && features.calendar) {
      const contractLine =
        m.contractVersion && m.signatureName
          ? `\nContract v${m.contractVersion} signed by ${m.signatureName} at ${m.signedAt}`
          : ''
      try {
        const result = await confirmEvent(m.calendarEventId, {
          summary: `Booking confirmed — ${m.name}`,
          description: `Package: ${m.packageType}\nHours: ${m.enforcedHours}\nAddress: ${m.address}\nPhone: ${m.phone || '—'}\nDeposit paid: $${m.deposit}\nBalance due: $${m.balanceDue}${contractLine}`,
        })
        alreadyConfirmed = result.alreadyConfirmed
      } catch (error) {
        // A calendar failure (expired token, deleted event) must not block the
        // confirmation emails — the customer still paid. Log and continue so
        // the emails go out; the owner email notes the calendar failure.
        calendarFailed = true
        console.error('Failed to confirm calendar event', error)
      }
    }

    if (!alreadyConfirmed && features.email) {
      const locale: Locale = m.locale && isLocale(m.locale) ? m.locale : 'es'
      const resend = new Resend(env.RESEND_API_KEY)
      const fromAddress = siteConfig.emailFrom

      // Generate the countersigned performance agreement. On failure the
      // emails still send without the attachment (graceful degradation), and
      // the owner email notes the failure.
      let attachments: { filename: string; content: string }[] | undefined
      let pdfFailed = false
      if (m.signatureName && m.signedAt) {
        try {
          const booking: ContractBooking = {
            name: m.name ?? '',
            email: m.email ?? '',
            phone: m.phone ?? '',
            eventDate: m.eventDate ?? '',
            startTime: m.startTime ?? '',
            enforcedHours: Number(m.enforcedHours),
            packageType: m.packageType === 'seven_songs' ? 'seven_songs' : 'hourly',
            address: m.address ?? '',
            total: Number(m.total),
            deposit: Number(m.deposit),
            balanceDue: Number(m.balanceDue),
            locale,
            signatureName: m.signatureName,
            signedAt: m.signedAt,
          }
          const pdf = await buildAgreementPdf(booking, new Date().toISOString())
          attachments = [
            { filename: 'performance-agreement.pdf', content: pdf.toString('base64') },
          ]
        } catch (error) {
          pdfFailed = true
          console.error('Failed to generate performance agreement PDF', error)
        }
      }

      const customerHtml = await render(BookingConfirmedEmail({ locale, metadata: m }))
      const customerResult = await resend.emails.send({
        from: fromAddress,
        to: m.email!,
        subject:
          locale === 'es' ? 'Reserva confirmada — Mariachi El Cuis' : 'Booking confirmed — Mariachi El Cuis',
        html: customerHtml,
        ...(attachments ? { attachments } : {}),
      })
      if (customerResult.error) {
        console.error('Customer confirmation email failed', customerResult.error)
      }

      const ownerHtml = await render(
        OwnerNotificationEmail({ metadata: m, pdfFailed, calendarFailed }),
      )
      const ownerResult = await resend.emails.send({
        from: fromAddress,
        to: env.CONTACT_TO_EMAIL!,
        subject: `New booking — ${m.name}`,
        html: ownerHtml,
        ...(attachments ? { attachments } : {}),
      })
      if (ownerResult.error) {
        console.error('Owner notification email failed', ownerResult.error)
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const m = (session.metadata ?? {}) as Record<string, string>
    if (m.calendarEventId && features.calendar) {
      await releaseHoldEvent(m.calendarEventId)
    }
  }

  return NextResponse.json({ received: true })
}
