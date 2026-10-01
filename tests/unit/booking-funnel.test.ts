import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetBookingFunnel, trackBookingStep } from '@/lib/booking-funnel'

describe('trackBookingStep', () => {
  const gtag = vi.fn()

  beforeEach(() => {
    gtag.mockReset()
    resetBookingFunnel()
    vi.stubGlobal('window', { gtag, dataLayer: [], location: { pathname: '/en/book' } })
  })

  it('sends the step as a GA4 event with the page path', () => {
    trackBookingStep('booking_form_start')
    expect(gtag).toHaveBeenCalledWith('event', 'booking_form_start', { page_path: '/en/book' })
  })

  it('sends each step only once per page load', () => {
    trackBookingStep('booking_price_shown')
    trackBookingStep('booking_price_shown')
    trackBookingStep('booking_checkout_start')
    expect(gtag).toHaveBeenCalledTimes(2)
  })
})
