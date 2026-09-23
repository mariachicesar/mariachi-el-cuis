// src/app/[lang]/layout.tsx
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'
import '@/app/globals.css'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { SkipLink } from '@/components/layout/skip-link'
import { ClarityScript } from '@/components/layout/clarity'
import { siteConfig } from '@/lib/config/site'
import { env } from '@/lib/env'
import { GA4_MEASUREMENT_ID } from '@/lib/gtm'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale } from '@/lib/i18n/locales'

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
})
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
})

// metadataBase lives in the root layout (src/app/layout.tsx) so it also
// covers routes outside the [lang] subtree (opengraph-image, sitemap, etc.).
export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  applicationName: siteConfig.name,
  verification: { google: 'DrVKLHX6FQ0Oid3v22uYRBGW3bQFqXadeprpL67Itdc' },
}

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

export const dynamicParams = false

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <html lang={lang} className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="flex min-h-dvh flex-col pb-24 xl:pb-0">
        <SkipLink label={dict.common.skipToContent} />
        <SiteHeader locale={lang} dict={dict} />
        {children}
        <SiteFooter locale={lang} dict={dict} />
        <MobileTabBar locale={lang} dict={dict} />
        <ClarityScript projectId={env.NEXT_PUBLIC_CLARITY_PROJECT_ID} />
        {/* Init runs beforeInteractive so `config` is queued before any page
            effect (e.g. a success page's generate_lead) can push an event. */}
        <Script id="gtag-init" strategy="beforeInteractive">
          {`window.dataLayer = window.dataLayer || [];
window.gtag = function gtag(){dataLayer.push(arguments);};
gtag('js', new Date);
gtag('config', '${GA4_MEASUREMENT_ID}');`}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
      </body>
      <GoogleTagManager gtmId="GTM-W4RLHJDR" />
    </html>
  )
}
