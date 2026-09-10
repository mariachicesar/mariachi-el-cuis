'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n/locales'

export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() // may be "/services" or "/es/services" or "/en/services"
  const bare = pathname.replace(/^\/(es|en)(?=\/|$)/, '') || '/'
  return (
    <div className="flex items-center gap-2 text-xs uppercase">
      {LOCALES.map((l) => {
        const href = l === DEFAULT_LOCALE ? bare : `/${l}${bare === '/' ? '' : bare}`
        return (
          <Link
            key={l}
            href={href}
            aria-current={l === locale ? 'page' : undefined}
            className={`inline-flex min-h-7 min-w-7 items-center justify-center rounded px-2 py-1.5 ${
              l === locale ? 'font-bold text-burnished-gold' : 'text-muted-silver'
            }`}
          >
            {l}
          </Link>
        )
      })}
    </div>
  )
}
