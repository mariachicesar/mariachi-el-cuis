'use server'

import { z } from 'zod'
import { getQuote } from '@/lib/quote'
import type { QuoteResult } from '@/lib/quote/types'
import { geocodeAddress } from '@/lib/geo/geocode'
import { haversineMiles } from '@/lib/geo/distance'
import { siteConfig } from '@/lib/config/site'
import { features } from '@/lib/env'

const inputSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.number().min(1).max(12),
  packageType: z.enum(['seven_songs', 'hourly']),
  address: z.string().trim().min(5).max(200),
})

export type GetQuoteActionResult =
  | { ok: true; quote: QuoteResult }
  | { ok: false; error: 'validation' | 'not_configured' | 'address_not_found' }

export async function getQuoteAction(input: unknown): Promise<GetQuoteActionResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'validation' }
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

  return { ok: true, quote }
}
