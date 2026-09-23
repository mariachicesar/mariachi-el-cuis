'use client'

import { useEffect } from 'react'
import { gtagEvent, metaTrack, pushDataLayerEvent } from '@/lib/gtm'

// Fires conversion tracking once when a success page mounts (booking
// confirmed, contact sent, quote sent). Tying it to a page view means it
// doesn't depend on transient form state.
// - `event` goes to the GTM dataLayer, where the container's Meta tags listen.
// - `leadSource` sends GA4 `generate_lead` straight through gtag, because GTM
//   has no GA4 tags. Mark `generate_lead` as a key event in GA4 Admin.
// - `metaLead` fires Meta `Lead` directly. Use it only on pages whose GTM event
//   doesn't already trigger the container's Lead tag, to avoid double counting.
export function TrackEvent({
  event,
  leadSource,
  metaLead = false,
}: {
  event: string
  leadSource: string
  metaLead?: boolean
}) {
  useEffect(() => {
    pushDataLayerEvent(event)
    gtagEvent('generate_lead', { lead_source: leadSource })
    if (metaLead) return metaTrack('Lead')
  }, [event, leadSource, metaLead])
  return null
}
