import { Music4 } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { MUSICIANS } from '@/lib/data/musicians'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'

const OFFSETS: { tx: number; ty: number; rotate: number; bg: string }[] = [
  { tx: -432, ty: 48.6, rotate: -14.08, bg: '#2c2113' },
  { tx: -216, ty: 16.2, rotate: -7.04, bg: '#241f1a' },
  { tx: 0, ty: -5.4, rotate: 0, bg: '#231a14' },
  { tx: 216, ty: 16.2, rotate: 7.04, bg: '#201f21' },
  { tx: 432, ty: 48.6, rotate: 14.08, bg: '#2a1c12' },
]

/** Fan-of-cards placeholder for musician photos, styled after the hero card layout. */
export function MusicianFan({ locale, comingSoon }: { locale: Locale; comingSoon: string }) {
  return (
    <div className="relative mt-8 flex h-[360px] w-full justify-center overflow-visible md:h-[440px]">
      <div className="relative flex origin-center scale-[0.55] items-center justify-center sm:scale-75 md:scale-100">
        {MUSICIANS.map((musician, i) => {
          const card = OFFSETS[i]!
          return (
            <Link
              key={musician.slug}
              href={localizedPath(`/about/${musician.slug}`, locale)}
              aria-label={`${musician.role[locale]} — ${comingSoon}`}
              className="fan-card absolute flex h-[280px] w-[200px] flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border-[1.5px] border-white/10 text-center shadow-[0_20px_40px_rgba(0,0,0,0.25)] outline-none md:h-[320px] md:w-[240px]"
              style={
                {
                  '--tx': `${card.tx}px`,
                  '--ty': `${card.ty}px`,
                  '--rotate': `${card.rotate}deg`,
                  transform: 'translate(var(--tx), var(--ty)) rotate(var(--rotate))',
                  backgroundColor: card.bg,
                  zIndex: 10 + i,
                  animationDelay: `${i * 90}ms`,
                } as CSSProperties
              }
            >
              <Music4 className="h-8 w-8 text-burnished-gold/70" aria-hidden="true" />
              <span className="px-4 text-sm font-semibold text-crema-white">
                {musician.role[locale]}
              </span>
              <span className="px-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                {comingSoon}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
