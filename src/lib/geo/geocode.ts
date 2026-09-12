import 'server-only'
import { env } from '@/lib/env'

export type GeocodeResult = { lat: number; lng: number; county: string | null; state: string | null }

type GoogleGeocodeComponent = { long_name: string; short_name: string; types: string[] }
type GoogleGeocodeResponse = {
  status: string
  results: {
    geometry: { location: { lat: number; lng: number } }
    address_components: GoogleGeocodeComponent[]
  }[]
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', address)
  url.searchParams.set('key', env.GOOGLE_MAPS_API_KEY!)

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const data = (await res.json()) as GoogleGeocodeResponse
  if (data.status !== 'OK' || data.results.length === 0) return null

  const { geometry, address_components: components } = data.results[0]!
  const county =
    components.find((c) => c.types.includes('administrative_area_level_2'))?.long_name ?? null
  const state =
    components.find((c) => c.types.includes('administrative_area_level_1'))?.short_name ?? null

  return { lat: geometry.location.lat, lng: geometry.location.lng, county, state }
}
