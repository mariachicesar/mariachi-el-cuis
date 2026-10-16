'use client'

import { Check, Link2, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { buttonClasses } from '@/components/ui/button'
import { FacebookIcon } from '@/components/ui/social-icons'

// Share links. WhatsApp sharing goes through api.whatsapp.com (not wa.me) so
// the site-wide ClickTracker doesn't count a share as a whatsapp_click lead.
export function ShareButtons({
  url,
  text,
  labels,
}: {
  url: string
  text: string
  labels: { copyLink: string; copied: string }
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard can be blocked in some in-app browsers; nothing else to do.
    }
  }

  const cls = buttonClasses('ghost', 'min-h-11')

  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={copy} className={cls}>
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
        <span aria-live="polite">{copied ? labels.copied : labels.copyLink}</span>
      </button>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
      >
        <FacebookIcon className="h-4 w-4" />
        Facebook
      </a>
      <a
        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        WhatsApp
      </a>
    </div>
  )
}
