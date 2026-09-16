'use client'
import Script from 'next/script'
import { useEffect, useRef } from 'react'
import type { Locale } from '@/lib/i18n/locales'

// https://developers.google.com/search/docs/appearance/preferred-sources
// Advanced JS implementation: manual control + custom-styled trigger.
type PreferredSource = {
  init: (opts: { theme?: 'light' | 'dark'; lang?: string }) => void
  addPreferredSource: () => void
}

declare global {
  interface Window {
    PREFERRED_SOURCE?: ((preferredSource: PreferredSource) => void)[]
  }
}

export function PreferredSourceButton({
  locale,
  label,
  className,
}: {
  locale: Locale
  label: string
  className?: string
}) {
  const preferredSourceRef = useRef<PreferredSource | null>(null)

  useEffect(() => {
    window.PREFERRED_SOURCE = window.PREFERRED_SOURCE || []
    window.PREFERRED_SOURCE.push((preferredSource) => {
      preferredSource.init({ theme: 'dark', lang: locale })
      preferredSourceRef.current = preferredSource
    })
  }, [locale])

  return (
    <>
      <Script
        src="https://news.google.com/swg/js/v1/publisher.js"
        strategy="afterInteractive"
        preferred-sources-control="manual"
      />
      <button
        type="button"
        onClick={() => preferredSourceRef.current?.addPreferredSource()}
        className={className}
      >
        {label}
      </button>
    </>
  )
}
