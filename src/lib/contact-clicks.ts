import { gtagEvent } from '@/lib/gtm'

export type ContactClickEvent = 'phone_click' | 'whatsapp_click'

const WHATSAPP_LINK = /^https?:\/\/(www\.)?wa\.me\//

// Maps a link's href to the GA4 event a tap on it should send, or null.
export function contactClickEvent(href: string | null | undefined): ContactClickEvent | null {
  if (!href) return null
  const normalized = href.trim().toLowerCase()
  if (normalized.startsWith('tel:')) return 'phone_click'
  if (WHATSAPP_LINK.test(normalized)) return 'whatsapp_click'
  return null
}

type Closest = { closest?: (selector: string) => Element | null }

// Delegated click handler. The tap target may be an icon or span inside the
// link, so it walks up to the nearest <a href>. `link_location` is the nearest
// data-track-location, or the page path.
export function handleContactClick(event: { target: EventTarget | null }, pathname: string): void {
  const target = event.target as Closest | null
  const link = typeof target?.closest === 'function' ? target.closest('a[href]') : null
  if (!link) return
  const name = contactClickEvent(link.getAttribute('href'))
  if (!name) return
  const location = link.closest('[data-track-location]')?.getAttribute('data-track-location') ?? pathname
  gtagEvent(name, { link_location: location })
}
