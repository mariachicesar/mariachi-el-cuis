'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getQuote } from '@/lib/quote'
import { laWallTimeToUtc } from '@/lib/quote/timezone'
import { geocodeAddress } from '@/lib/geo/geocode'
import { haversineMiles } from '@/lib/geo/distance'
import { createHoldEvent } from '@/lib/calendar/google'
import { createDepositCheckoutSession } from '@/lib/payments/stripe'
import { siteConfig } from '@/lib/config/site'
import { env, features } from '@/lib/env'

const inputSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.coerce.number().min(1).max(12),
  packageType: z.enum(['seven_songs', 'hourly']),
  address: z.string().trim().min(5).max(200),
  email: z.email(),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .optional()
    .or(z.literal('')),
  name: z.string().trim().min(2).max(100),
  locale: z.enum(['es', 'en']),
})

export type StartCheckoutState = { ok: boolean; error?: string }

export async function startCheckoutAction(
  _prev: StartCheckoutState,
  formData: FormData,
): Promise<StartCheckoutState> {
  const parsed = inputSchema.safeParse({
    eventDate: formData.get('eventDate'),
    startTime: formData.get('startTime'),
    durationHours: formData.get('durationHours'),
    packageType: formData.get('packageType'),
    address: formData.get('address'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    name: formData.get('name'),
    locale: formData.get('locale'),
  })
  if (!parsed.success) return { ok: false, error: 'validation' }
  if (!features.stripe) return { ok: false, error: 'not_configured' }
  if (!features.maps) return { ok: false, error: 'not_configured' }

  const geocoded = await geocodeAddress(parsed.data.address)
  if (!geocoded) return { ok: false, error: 'address_not_found' }

  const distanceMi = haversineMiles(
    { lat: siteConfig.baseLat, lng: siteConfig.baseLng },
    { lat: geocoded.lat, lng: geocoded.lng },
  )

  const quote = getQuote({
    eventDate: parsed.data.eventDate,
    startTime: parsed.data.startTime,
    durationHours: parsed.data.durationHours,
    packageType: parsed.data.packageType,
    distanceMi,
    county: geocoded.county,
    state: geocoded.state,
    now: new Date(),
  })

  if (quote.status !== 'ok') return { ok: false, error: quote.status }

  let calendarEventId = ''
  if (features.calendar) {
    const eventStartUtc = laWallTimeToUtc(parsed.data.eventDate, parsed.data.startTime)
    const blockStart = new Date(eventStartUtc.getTime() - 30 * 60 * 1000)
    const blockEnd = new Date(blockStart.getTime() + quote.calendarBlockMinutes * 60 * 1000)
    calendarEventId = await createHoldEvent({
      summary: `HOLD — awaiting deposit — ${parsed.data.name}`,
      description: `Package: ${parsed.data.packageType}\nHours: ${quote.enforcedHours}\nAddress: ${parsed.data.address}\nPhone: ${parsed.data.phone || '—'}`,
      location: parsed.data.address,
      startUtc: blockStart,
      endUtc: blockEnd,
    })
  }

  const localePrefix = parsed.data.locale === 'en' ? '/en' : ''
  const { url } = await createDepositCheckoutSession({
    depositUsd: quote.deposit,
    customerEmail: parsed.data.email,
    successUrl: `${env.NEXT_PUBLIC_SITE_URL}${localePrefix}/book/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${env.NEXT_PUBLIC_SITE_URL}${localePrefix}/book`,
    metadata: {
      calendarEventId,
      eventDate: parsed.data.eventDate,
      startTime: parsed.data.startTime,
      enforcedHours: String(quote.enforcedHours),
      packageType: parsed.data.packageType,
      address: parsed.data.address,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || '',
      total: String(quote.total),
      deposit: String(quote.deposit),
      balanceDue: String(quote.balanceDue),
      locale: parsed.data.locale,
    },
  })

  redirect(url)
}
