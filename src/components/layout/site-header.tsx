import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import logo from '@/assets/brand/logo.png'
import { siteConfig } from '@/lib/config/site'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'
import { LocaleSwitch } from './locale-switch'
import { MobileMenu } from './mobile-menu'
import { navItems } from './nav'

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const items = navItems(dict)
  const link = (href: string) => localizedPath(href, locale)

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 lg:px-12">
        <Link href={link('/')} className="shrink-0">
          <Image src={logo} alt={siteConfig.name} priority unoptimized className="h-10 w-auto" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 xl:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={link(item.href)}
              className="text-sm text-on-surface transition-colors hover:text-burnished-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${siteConfig.phoneTel}`}
            className="hidden text-sm text-on-surface transition-colors hover:text-burnished-gold lg:inline"
          >
            {siteConfig.phoneDisplay}
          </a>
          <Button href={link('/book')} className="hidden sm:inline-flex">
            {dict.nav.quote}
          </Button>
          <LocaleSwitch locale={locale} />
        </div>
      </div>

      <MobileMenu locale={locale} dict={dict} />
    </header>
  )
}
