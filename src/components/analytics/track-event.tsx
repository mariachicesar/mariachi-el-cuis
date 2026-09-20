'use client'

import { useEffect } from 'react'
import { pushDataLayerEvent } from '@/lib/gtm'

// Fires a GTM dataLayer event once when the page mounts. Used on success pages
// (booking confirmed, contact sent, quote sent) so Meta/GTM conversions are
// tied to a real page view instead of transient form state.
export function TrackEvent({ event }: { event: string }) {
  useEffect(() => {
    pushDataLayerEvent(event)
  }, [event])
  return null
}
