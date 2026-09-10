// src/app/[lang]/layout.tsx
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'
import '@/app/globals.css'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { SkipLink } from '@/components/layout/skip-link'
import { siteConfig } from '@/lib/config/site'
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

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  applicationName: siteConfig.name,
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
      </body>
    </html>
  )
}
