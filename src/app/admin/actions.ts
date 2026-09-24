'use server'

import { render } from '@react-email/render'
import { Resend } from 'resend'
import { z } from 'zod'
import { laWallTimeToUtc } from '@/lib/quote/timezone'
import { createHoldEvent } from '@/lib/calendar/google'
import { createDepositCheckoutSession } from '@/lib/payments/stripe'
import { CONTRACT_VERSION, type ContractBooking } from '@/lib/contract/terms'
import { buildAgreementPdf } from '@/lib/contract/pdf'
import { BookingConfirmedEmail } from '@/emails/booking-confirmed'
import { PaymentLinkEmail } from '@/emails/payment-link'
import { siteConfig } from '@/lib/config/site'
import { env, features } from '@/lib/env'

const inputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(200),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.coerce.number().min(1).max(12),
  packageType: z.enum(['seven_songs', 'hourly']),
  total: z.coerce.number().min(0),
  deposit: z.coerce.number().min(0),
  balanceDue: z.coerce.number().min(0),
  signatureName: z.string().trim().min(2).max(100),
  locale: z.enum(['es', 'en']),
})

export type AdminActionState = {
  ok: boolean
  message?: string
  error?: 'validation' | 'not_configured' | 'send_failed'
  fieldErrors?: Partial<Record<keyof z.input<typeof inputSchema>, string[]>>
}

function parse(formData: FormData) {
  return inputSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    eventDate: formData.get('eventDate'),
    startTime: formData.get('startTime'),
    durationHours: formData.get('durationHours'),
    packageType: formData.get('packageType'),
    total: formData.get('total'),
    deposit: formData.get('deposit'),
    balanceDue: formData.get('balanceDue'),
    signatureName: formData.get('signatureName'),
    locale: formData.get('locale'),
  })
}

/** Booking already agreed and deposit already collected by phone — confirm the
 * calendar event directly and email the signed agreement. */
export async function sendAgreementAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = parse(formData)
  if (!parsed.success) {
    return { ok: false, error: 'validation', fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  if (!features.email) return { ok: false, error: 'not_configured' }
  const d = parsed.data

  let calendarEventId = ''
  if (features.calendar) {
    const startUtc = laWallTimeToUtc(d.eventDate, d.startTime)
    const endUtc = new Date(startUtc.getTime() + d.durationHours * 60 * 60 * 1000)
    calendarEventId = await createHoldEvent({
      summary: `Booking confirmed — ${d.name}`,
      description: `Package: ${d.packageType}\nHours: ${d.durationHours}\nAddress: ${d.address}\nPhone: ${d.phone}\nDeposit paid: $${d.deposit}\nBalance due: $${d.balanceDue}\nBooked by phone, signed by ${d.signatureName}`,
      location: d.address,
      startUtc,
      endUtc,
    })
  }

  const signedAt = new Date().toISOString()
  const booking: ContractBooking = {
    name: d.name,
    email: d.email,
    phone: d.phone,
    eventDate: d.eventDate,
    startTime: d.startTime,
    enforcedHours: d.durationHours,
    packageType: d.packageType,
    address: d.address,
    total: d.total,
    deposit: d.deposit,
    balanceDue: d.balanceDue,
    locale: d.locale,
    signatureName: d.signatureName,
    signedAt,
  }

  let attachments: { filename: string; content: string }[] | undefined
  try {
    const pdf = await buildAgreementPdf(booking, signedAt)
    attachments = [{ filename: 'performance-agreement.pdf', content: pdf.toString('base64') }]
  } catch (error) {
    console.error('Failed to generate performance agreement PDF', error)
  }

  const metadata: Record<string, string> = {
    eventDate: d.eventDate,
    startTime: d.startTime,
    enforcedHours: String(d.durationHours),
    packageType: d.packageType,
    address: d.address,
    name: d.name,
    deposit: String(d.deposit),
    balanceDue: String(d.balanceDue),
    signatureName: d.signatureName,
  }

  const resend = new Resend(env.RESEND_API_KEY)
  const html = await render(BookingConfirmedEmail({ locale: d.locale, metadata }))
  const result = await resend.emails.send({
    from: siteConfig.emailFrom,
    to: d.email,
    subject:
      d.locale === 'es' ? 'Reserva confirmada — Mariachi El Cuis' : 'Booking confirmed — Mariachi El Cuis',
    html,
    ...(attachments ? { attachments } : {}),
  })
  if (result.error) {
    console.error('Agreement email failed', result.error)
    return { ok: false, error: 'send_failed' }
  }

  return {
    ok: true,
    message: calendarEventId
      ? `Agreement sent to ${d.email}. Calendar event confirmed.`
      : `Agreement sent to ${d.email}.`,
  }
}

/** Booking agreed by phone but the deposit is still owed — hold the slot and
 * email the customer a Stripe Checkout link to pay it themselves. */
export async function sendPaymentLinkAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = parse(formData)
  if (!parsed.success) {
    return { ok: false, error: 'validation', fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  if (!features.email || !features.stripe) return { ok: false, error: 'not_configured' }
  const d = parsed.data

  let calendarEventId = ''
  if (features.calendar) {
    const startUtc = laWallTimeToUtc(d.eventDate, d.startTime)
    const endUtc = new Date(startUtc.getTime() + d.durationHours * 60 * 60 * 1000)
    calendarEventId = await createHoldEvent({
      summary: `HOLD — awaiting deposit — ${d.name}`,
      description: `Package: ${d.packageType}\nHours: ${d.durationHours}\nAddress: ${d.address}\nPhone: ${d.phone}\nBooked by phone`,
      location: d.address,
      startUtc,
      endUtc,
    })
  }

  const localePrefix = d.locale === 'en' ? '/en' : ''
  const { url } = await createDepositCheckoutSession({
    depositUsd: d.deposit,
    customerEmail: d.email,
    successUrl: `${env.NEXT_PUBLIC_SITE_URL}${localePrefix}/book/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${env.NEXT_PUBLIC_SITE_URL}${localePrefix}/book`,
    metadata: {
      calendarEventId,
      eventDate: d.eventDate,
      startTime: d.startTime,
      enforcedHours: String(d.durationHours),
      packageType: d.packageType,
      address: d.address,
      name: d.name,
      email: d.email,
      phone: d.phone,
      total: String(d.total),
      deposit: String(d.deposit),
      balanceDue: String(d.balanceDue),
      contractVersion: CONTRACT_VERSION,
      signatureName: d.signatureName,
      signedAt: new Date().toISOString(),
      locale: d.locale,
    },
  })

  const resend = new Resend(env.RESEND_API_KEY)
  const html = await render(
    PaymentLinkEmail({
      locale: d.locale,
      checkoutUrl: url,
      eventDate: d.eventDate,
      startTime: d.startTime,
      address: d.address,
      deposit: d.deposit,
      balanceDue: d.balanceDue,
    }),
  )
  const result = await resend.emails.send({
    from: siteConfig.emailFrom,
    to: d.email,
    subject: d.locale === 'es' ? 'Confirma tu reserva — Mariachi El Cuis' : 'Confirm your booking — Mariachi El Cuis',
    html,
  })
  if (result.error) {
    console.error('Payment link email failed', result.error)
    return { ok: false, error: 'send_failed' }
  }

  return { ok: true, message: `Payment link sent to ${d.email}: ${url}` }
}
