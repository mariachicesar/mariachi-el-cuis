import type { Dictionary } from '@/lib/i18n/dictionaries'

export type NavItem = { href: string; label: string }

/** Primary navigation targets, shared by the header, footer and mobile bar. */
export function navItems(dict: Dictionary): NavItem[] {
  return [
    { href: '/', label: dict.nav.home },
    { href: '/about', label: dict.nav.musicians },
    { href: '/repertoire', label: dict.nav.repertoire },
    { href: '/media', label: dict.nav.media },
    { href: '/guides', label: dict.nav.guides },
    { href: '/book', label: dict.nav.quote },
  ]
}
