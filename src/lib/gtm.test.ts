import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gtagEvent, metaTrack, pushDataLayerEvent, trackConversion } from './gtm'

type TestWindow = { dataLayer?: unknown[]; gtag?: unknown; fbq?: unknown }

describe('analytics helpers', () => {
  let win: TestWindow

  beforeEach(() => {
    win = {}
    vi.stubGlobal('window', win)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('pushes plain GTM events onto the dataLayer', () => {
    pushDataLayerEvent('estimate_sent', { a: 1 })
    expect(win.dataLayer).toEqual([{ event: 'estimate_sent', a: 1 }])
  })

  it('sends GA4 events through window.gtag when present', () => {
    const gtag = vi.fn()
    win.gtag = gtag
    gtagEvent('generate_lead', { lead_source: 'contact_form' })
    expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', { lead_source: 'contact_form' })
  })

  it('falls back to queuing an Arguments object that gtag.js can read', () => {
    gtagEvent('generate_lead', { lead_source: 'quote_sent' })
    const entry = win.dataLayer![0] as IArguments
    expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]')
    expect(Array.from(entry)).toEqual(['event', 'generate_lead', { lead_source: 'quote_sent' }])
  })

  it('fires the Meta event immediately when fbq is ready', () => {
    const fbq = vi.fn()
    win.fbq = fbq
    metaTrack('Lead')
    expect(fbq).toHaveBeenCalledWith('track', 'Lead')
  })

  it('waits for fbq to appear, then fires once', () => {
    vi.useFakeTimers()
    const fbq = vi.fn()
    metaTrack('Lead', { intervalMs: 100, timeoutMs: 1000 })
    vi.advanceTimersByTime(300)
    win.fbq = fbq
    vi.advanceTimersByTime(2000)
    expect(fbq).toHaveBeenCalledTimes(1)
  })

  it('stops polling when cancelled', () => {
    vi.useFakeTimers()
    const fbq = vi.fn()
    const cancel = metaTrack('Lead', { intervalMs: 100 })
    cancel()
    win.fbq = fbq
    vi.advanceTimersByTime(1000)
    expect(fbq).not.toHaveBeenCalled()
  })

  it('sends the named conversion and generate_lead to GA4, and the event to the dataLayer', () => {
    const gtag = vi.fn()
    win.gtag = gtag
    trackConversion({ event: 'booking_confirmed', leadSource: 'booking_deposit' })
    expect(win.dataLayer).toEqual([{ event: 'booking_confirmed' }])
    expect(gtag).toHaveBeenCalledWith('event', 'booking_confirmed', { lead_source: 'booking_deposit' })
    expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', { lead_source: 'booking_deposit' })
    expect(gtag).toHaveBeenCalledTimes(2)
  })

  it('fires Meta Lead only when metaLead is set', () => {
    const fbq = vi.fn()
    win.fbq = fbq
    win.gtag = vi.fn()
    trackConversion({ event: 'contact_form_submit', leadSource: 'contact_form' })
    expect(fbq).not.toHaveBeenCalled()
    trackConversion({ event: 'booking_confirmed', leadSource: 'booking_deposit', metaLead: true })
    expect(fbq).toHaveBeenCalledWith('track', 'Lead')
  })
})
