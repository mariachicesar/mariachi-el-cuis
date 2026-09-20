// Pushes a custom event onto the Google Tag Manager dataLayer. GTM is loaded
// site-wide from src/app/[lang]/layout.tsx; it creates window.dataLayer on
// boot, but we guard with the same `|| []` pattern so an event fired before
// the GTM script evaluates is still queued for it to pick up.

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function pushDataLayerEvent(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...data })
}
