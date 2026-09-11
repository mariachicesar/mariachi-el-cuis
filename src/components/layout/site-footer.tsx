import Link from 'next/link'
import { CITIES } from '@/lib/data/cities'
import { siteConfig } from '@/lib/config/site'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'
import { navItems } from './nav'

const linkCls = 'text-sm text-on-surface-variant transition-colors hover:text-burnished-gold'
const headingCls = 'font-display text-sm uppercase tracking-wider text-burnished-gold'

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const link = (href: string) => localizedPath(href, locale)
  const cities = CITIES.slice(0, 8)

  return (
    <footer className="mt-auto border-t border-charcoal-border bg-surface-container-lowest">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-4 lg:px-12">
        <div>
          <p className="font-display text-lg text-burnished-gold">{siteConfig.name}</p>
          <p className="mt-2 text-sm text-on-surface-variant">{dict.footer.tagline}</p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2">
          {navItems(dict).map((item) => (
            <Link key={item.href} href={link(item.href)} className={linkCls}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2">
          <h2 className={headingCls}>{dict.footer.areasHeading}</h2>
          {cities.map((city) => (
            <Link key={city.slug} href={link(`/mariachi/${city.slug}`)} className={linkCls}>
              {city.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className={headingCls}>{dict.footer.contactHeading}</h2>
          <a href={`tel:${siteConfig.phoneTel}`} className={linkCls}>
            {siteConfig.phoneDisplay}
          </a>
          <a href={`mailto:${siteConfig.email}`} className={linkCls}>
            {siteConfig.email}
          </a>
          <a
            href={siteConfig.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            {dict.cta.whatsapp}
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-xs text-muted-silver sm:flex-row sm:items-center sm:justify-between lg:px-12">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}. {dict.footer.rights}
        </p>
        <div className="flex gap-4">
          <Link href={link('/terms')} className="transition-colors hover:text-burnished-gold">
            {dict.footer.terms}
          </Link>
          <Link href={link('/privacy')} className="transition-colors hover:text-burnished-gold">
            {dict.footer.privacy}
          </Link>
        </div>
      </div>
    </footer>
  )
}
