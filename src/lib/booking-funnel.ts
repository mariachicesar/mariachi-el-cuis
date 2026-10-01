import { gtagEvent } from '@/lib/gtm'

// GA4-only funnel steps inside the booking wizard, so reports show where
// visitors drop off between landing on /book and booking_confirmed. They are
// not GTM/Meta conversions and are never imported into Google Ads.
export type BookingStep = 'booking_form_start' | 'booking_price_shown' | 'booking_checkout_start'

const sent = new Set<BookingStep>()

// Sends a step at most once per page load; repeat calls are ignored.
export function trackBookingStep(step: BookingStep): void {
  if (typeof window === 'undefined' || sent.has(step)) return
  sent.add(step)
  gtagEvent(step, { page_path: window.location.pathname })
}

// Test-only: clears the once-per-load memory.
export function resetBookingFunnel(): void {
  sent.clear()
}
