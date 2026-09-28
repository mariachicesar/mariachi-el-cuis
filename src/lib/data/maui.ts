import type { Locale } from '@/lib/i18n/locales'

// Maui trip landing page (Dec 3–8, 2026). Shared by link only: noindex and
// left out of the sitemap/nav. Once the trip is over, src/proxy.ts redirects
// the page to the home page so nobody books a date that already passed.
export const MAUI_PATHS: Record<Locale, string> = { es: '/hawaii', en: '/en/hawaii' }

// Midnight starting Dec 9 in Hawaii time (HST is UTC−10, no DST).
const TRIP_OVER_AT = Date.parse('2026-12-09T10:00:00Z')

export function isMauiTripOver(now: Date = new Date()): boolean {
  return now.getTime() >= TRIP_OVER_AT
}
