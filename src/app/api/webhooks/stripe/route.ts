import { render } from '@react-email/render'
import { Resend } from 'resend'
import type Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { BookingConfirmedEmail } from '@/emails/booking-confirmed'
import { OwnerNotificationEmail } from '@/emails/owner-notification'
import { confirmEvent, releaseHoldEvent } from '@/lib/calendar/google'
import { siteConfig } from '@/lib/config/site'
import { env, features } from '@/lib/env'
import type { Locale } from '@/lib/i18n/locales'
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
    if (m.calendarEventId && features.calendar) {
      const result = await confirmEvent(m.calendarEventId, {
        summary: `Booking confirmed — ${m.name}`,
        description: `Package: ${m.packageType}\nHours: ${m.enforcedHours}\nAddress: ${m.address}\nPhone: ${m.phone || '—'}\nDeposit paid: $${m.deposit}\nBalance due: $${m.balanceDue}`,
      })
      alreadyConfirmed = result.alreadyConfirmed
    }

    if (!alreadyConfirmed && features.email) {
      const locale = (m.locale as Locale) ?? 'es'
      const resend = new Resend(env.RESEND_API_KEY)
      const fromAddress = `${siteConfig.name} <noreply@${new URL(siteConfig.url).hostname}>`

      const customerHtml = await render(BookingConfirmedEmail({ locale, metadata: m }))
      await resend.emails.send({
        from: fromAddress,
        to: m.email!,
        subject:
          locale === 'es' ? 'Reserva confirmada — Mariachi El Cuis' : 'Booking confirmed — Mariachi El Cuis',
        html: customerHtml,
      })

      const ownerHtml = await render(OwnerNotificationEmail({ metadata: m }))
      await resend.emails.send({
        from: fromAddress,
        to: env.CONTACT_TO_EMAIL!,
        subject: `New booking — ${m.name}`,
        html: ownerHtml,
      })
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
