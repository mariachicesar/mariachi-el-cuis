'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'
import { navItems } from './nav'

export function MobileMenu({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState(pathname)
  const items = navItems(dict)
  const link = (href: string) => localizedPath(href, locale)

  // Close on navigation (menu links, logo, locale switch). Render-time prev-state
  // pattern — an effect with setState trips react-hooks/set-state-in-effect.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  return (
    <div className="border-t border-charcoal-border xl:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu-nav"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2 px-6 py-3 text-sm text-on-surface"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
        {dict.nav.menu}
      </button>
      {open && (
        <nav id="mobile-menu-nav" aria-label="Mobile menu" className="flex flex-col pb-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={link(item.href)}
              onClick={() => setOpen(false)}
              className="px-6 py-2 text-sm text-on-surface transition-colors hover:text-burnished-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
