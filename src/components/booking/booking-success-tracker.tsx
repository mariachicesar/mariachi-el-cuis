'use client'

import { useEffect } from 'react'
import { pushDataLayerEvent } from '@/lib/gtm'

// Fires once on mount: landing on /book/success means Stripe returned the
// customer here after deposit checkout, so it marks a confirmed booking
// for GTM/Meta. The page is the source of truth for the customer-visible
// "done" state; the Stripe webhook remains the source of truth for the
// booking itself.
export function BookingSuccessTracker() {
  useEffect(() => {
    pushDataLayerEvent('booking_confirmed')
  }, [])
  return null
}
