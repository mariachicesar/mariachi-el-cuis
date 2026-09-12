'use server'

import { render } from '@react-email/render'
import { Resend } from 'resend'
import { z } from 'zod'
import { EstimateEmail } from '@/emails/estimate'
import { getQuote } from '@/lib/quote'
import { geocodeAddress } from '@/lib/geo/geocode'
import { haversineMiles } from '@/lib/geo/distance'
import { siteConfig } from '@/lib/config/site'
import { env, features } from '@/lib/env'

const inputSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.coerce.number().min(1).max(12),
  packageType: z.enum(['seven_songs', 'hourly']),
  address: z.string().trim().min(5).max(200),
  email: z.email(),
  locale: z.enum(['es', 'en']),
})

export type SendEstimateState = {
  ok: boolean
  error?: 'validation' | 'not_configured' | 'address_not_found' | 'send_failed'
}

export async function sendEstimateEmailAction(
  _prev: SendEstimateState,
  formData: FormData,
): Promise<SendEstimateState> {
  const parsed = inputSchema.safeParse({
    eventDate: formData.get('eventDate'),
    startTime: formData.get('startTime'),
    durationHours: formData.get('durationHours'),
    packageType: formData.get('packageType'),
    address: formData.get('address'),
    email: formData.get('email'),
    locale: formData.get('locale'),
  })
  if (!parsed.success) return { ok: false, error: 'validation' }
  if (!features.email || !features.maps) return { ok: false, error: 'not_configured' }

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

  const html = await render(EstimateEmail({ locale: parsed.data.locale, quote }))
  const resend = new Resend(env.RESEND_API_KEY)
  try {
    await resend.emails.send({
      from: `${siteConfig.name} <noreply@${new URL(siteConfig.url).hostname}>`,
      to: parsed.data.email,
      subject:
        parsed.data.locale === 'es'
          ? 'Tu cotización de Mariachi El Cuis'
          : 'Your Mariachi El Cuis estimate',
      html,
    })
    return { ok: true }
  } catch {
    return { ok: false, error: 'send_failed' }
  }
}
