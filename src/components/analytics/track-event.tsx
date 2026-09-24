'use client'

import { useEffect } from 'react'
import { trackConversion } from '@/lib/gtm'

// Fires conversion tracking once when a success page mounts (booking
// confirmed, contact sent, quote sent). Tying it to a page view means it
// doesn't depend on transient form state. See trackConversion for what is sent.
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
  useEffect(() => trackConversion({ event, leadSource, metaLead }), [event, leadSource, metaLead])
  return null
}
