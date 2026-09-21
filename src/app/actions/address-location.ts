'use server'

import { z } from 'zod'
import { GeocodeConfigurationError, geocodeAddress } from '@/lib/geo/geocode'
import { features } from '@/lib/env'

const inputSchema = z.object({ address: z.string().trim().min(5).max(200) })

export type AddressLocationResult =
  | { ok: true; location: { lat: number; lng: number } }
  | { ok: false; error: 'validation' | 'not_configured' | 'address_not_found' }

// Geocodes just the selected address for the map preview — decoupled from
// getQuoteAction so the map can render as soon as an address is picked,
// without waiting on the date/time/duration fields the price quote needs.
export async function getAddressLocationAction(input: unknown): Promise<AddressLocationResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'validation' }
  if (!features.maps) return { ok: false, error: 'not_configured' }

  try {
    const geocoded = await geocodeAddress(parsed.data.address)
    if (!geocoded) return { ok: false, error: 'address_not_found' }
    return { ok: true, location: { lat: geocoded.lat, lng: geocoded.lng } }
  } catch (error) {
    if (error instanceof GeocodeConfigurationError) return { ok: false, error: 'not_configured' }
    throw error
  }
}
