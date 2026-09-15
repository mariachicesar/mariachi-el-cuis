import 'server-only'
import { env } from '@/lib/env'

export type GeocodeResult = { lat: number; lng: number; county: string | null; state: string | null }

type GoogleGeocodeComponent = { long_name: string; short_name: string; types: string[] }
type GoogleGeocodeResponse = {
  status: string
  error_message?: string
  results: {
    formatted_address?: string
    geometry: { location: { lat: number; lng: number } }
    address_components: GoogleGeocodeComponent[]
  }[]
}

export class GeocodeConfigurationError extends Error {}

async function requestGeocodes(address: string): Promise<GoogleGeocodeResponse | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', address)
  url.searchParams.set('key', env.GOOGLE_MAPS_API_KEY!)

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const data = (await res.json()) as GoogleGeocodeResponse
  if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_DAILY_LIMIT') {
    throw new GeocodeConfigurationError(data.error_message ?? data.status)
  }
  return data
}

export async function suggestAddresses(query: string): Promise<string[]> {
  const data = await requestGeocodes(query)
  if (!data || data.status !== 'OK') return []
  return data.results
    .map((result) => result.formatted_address)
    .filter((address): address is string => Boolean(address))
    .slice(0, 5)
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const data = await requestGeocodes(address)
  if (!data) return null
  if (data.status !== 'OK' || data.results.length === 0) return null

  const { geometry, address_components: components } = data.results[0]!
  const county =
    components.find((c) => c.types.includes('administrative_area_level_2'))?.long_name ?? null
  const state =
    components.find((c) => c.types.includes('administrative_area_level_1'))?.short_name ?? null

  return { lat: geometry.location.lat, lng: geometry.location.lng, county, state }
}
