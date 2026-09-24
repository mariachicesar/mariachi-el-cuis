// Client-side analytics helpers.
//
// Three tags share window.dataLayer:
// - GA4 via gtag.js (G-YGK2HZEWXD), initialised in src/app/[lang]/layout.tsx.
//   gtag.js only reads `arguments` objects pushed by gtag(). Plain
//   `{ event }` objects are invisible to it, so GA4 needs an explicit gtag()
//   call.
// - GTM (GTM-W4RLHJDR) reads the plain `{ event }` objects. The container loads
//   the Meta Pixel and fires Meta Lead on `contact_form_submit` /
//   `estimate_sent` and Meta Purchase on `booking_confirmed`.
// - The Meta Pixel (fbq), defined by the GTM base tag after GTM boots.

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
    fbq?: (...args: unknown[]) => void
  }
}

export const GA4_MEASUREMENT_ID = 'G-YGK2HZEWXD'

// localStorage key set by visiting any page with ?internal=1 (see layout).
export const INTERNAL_TRAFFIC_KEY = 'mec_internal_traffic'

// Pushes a custom event onto the GTM dataLayer. The `|| []` guard means an
// event fired before GTM evaluates is still queued for it to pick up.
export function pushDataLayerEvent(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...data })
}

// Sends a GA4 event through gtag(). The layout's beforeInteractive init script
// defines window.gtag and queues `config` before any page code runs. The
// fallback below matches the standard snippet, so the call still queues in
// order if that script is ever missing.
export function gtagEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = function gtag() {
      // gtag.js only accepts real Arguments objects, not arrays.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
  }
  window.gtag('event', name, params)
}

// Fires a Meta Pixel standard event. fbq only exists once GTM has run the
// pixel base tag. That can happen after a success page mounts on a full page
// load, such as the Stripe redirect, so poll briefly for it. Returns a cancel
// function for effect cleanup.
export function metaTrack(event: string, { timeoutMs = 10_000, intervalMs = 250 } = {}) {
  if (typeof window === 'undefined') return () => {}
  let elapsed = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const attempt = () => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', event)
      return
    }
    elapsed += intervalMs
    if (elapsed <= timeoutMs) timer = setTimeout(attempt, intervalMs)
  }
  attempt()
  return () => clearTimeout(timer)
}

// Fires one success page's conversion tracking:
// - `event` onto the dataLayer, where GTM's Meta tags listen.
// - `event` to GA4 by name. Google Ads imports GA4 key events by name, so each
//   lead type needs its own event to carry its own value.
// - GA4 `generate_lead` with `lead_source`, kept for GA4 reporting. Not a key
//   event, so it isn't imported and doesn't double-count.
// - Meta `Lead` when `metaLead` is set (see TrackEvent).
// Returns a cleanup function for the Meta polling.
export function trackConversion({
  event,
  leadSource,
  metaLead = false,
}: {
  event: string
  leadSource: string
  metaLead?: boolean
}): () => void {
  pushDataLayerEvent(event)
  gtagEvent(event, { lead_source: leadSource })
  gtagEvent('generate_lead', { lead_source: leadSource })
  return metaLead ? metaTrack('Lead') : () => {}
}
