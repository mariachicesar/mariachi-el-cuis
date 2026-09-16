// src/app/layout.tsx
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config/site'

// Root layout exists only to set metadataBase globally — the [lang] layout
// renders <html>/<body>. Without a root layout, Next resolves social images
// (e.g. /opengraph-image) against localhost and prints a build warning.
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
