'use client'

import { useEffect } from 'react'
import { handleContactClick } from '@/lib/contact-clicks'

// Sends GA4 phone_click / whatsapp_click for every tel: and wa.me link on the
// site through one document-level listener, so individual links need no
// tracking code. Capture phase, so a component that stops propagation can't
// hide the tap.
export function ClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => handleContactClick(event, window.location.pathname)
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])
  return null
}
