import Link from 'next/link'
import { BookOpen, CalendarCheck, Film, Home, Phone, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { siteConfig } from '@/lib/config/site'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'

export function MobileTabBar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const link = (href: string) => localizedPath(href, locale)
  const tabs: { href: string; label: string; Icon: LucideIcon }[] = [
    { href: '/', label: dict.nav.home, Icon: Home },
    { href: '/about', label: dict.nav.musicians, Icon: Users },
    { href: '/media', label: dict.nav.media, Icon: Film },
    { href: '/guides', label: dict.nav.guides, Icon: BookOpen },
    { href: '/book', label: dict.nav.quote, Icon: CalendarCheck },
  ]

  return (
    <nav
      aria-label="Bottom"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal-border bg-surface xl:hidden"
    >
      <div className="flex items-stretch gap-2 px-3 py-2">
        <a
          href={`tel:${siteConfig.phoneTel}`}
          className="flex flex-1 items-center justify-center gap-2 rounded bg-charcoal-elevated px-3 py-2 text-xs font-semibold uppercase tracking-wider text-crema-white"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          {dict.cta.call}
        </a>
        <Link
          href={link('/book')}
          className="flex flex-1 items-center justify-center gap-2 rounded bg-primary-container px-3 py-2 text-xs font-semibold uppercase tracking-wider text-on-primary"
        >
          {dict.cta.getQuote}
        </Link>
      </div>
      <ul className="flex items-stretch justify-between border-t border-charcoal-border">
        {tabs.map(({ href, label, Icon }) => (
          <li key={href} className="flex-1">
            <Link
              href={link(href)}
              className="flex flex-col items-center gap-1 px-1 py-2 text-[0.6875rem] text-on-surface transition-colors hover:text-burnished-gold"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
