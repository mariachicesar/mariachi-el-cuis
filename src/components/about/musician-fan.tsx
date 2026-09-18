import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { MUSICIANS, type MusicianSlot } from '@/lib/data/musicians'
import type { Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'

const OFFSETS: { tx: number; ty: number; rotate: number; bg: string }[] = [
  { tx: -432, ty: 48.6, rotate: -14.08, bg: '#2c2113' },
  { tx: -216, ty: 16.2, rotate: -7.04, bg: '#241f1a' },
  { tx: 0, ty: -5.4, rotate: 0, bg: '#231a14' },
  { tx: 216, ty: 16.2, rotate: 7.04, bg: '#201f21' },
  { tx: 432, ty: 48.6, rotate: 14.08, bg: '#2a1c12' },
]

function MusicianCard({
  musician,
  locale,
  className,
  style,
}: {
  musician: MusicianSlot
  locale: Locale
  className: string
  style?: CSSProperties
}) {
  return (
    <Link
      href={localizedPath(`/about/${musician.slug}`, locale)}
      aria-label={`${musician.name} — ${musician.role[locale]}`}
      className={className}
      style={style}
    >
      <Image
        src={musician.photo}
        alt={`${musician.name}, ${musician.role[locale]} — Mariachi El Cuis`}
        fill
        unoptimized
        sizes="(min-width: 768px) 240px, 190px"
        className="object-cover object-top"
      />
      <div className="relative z-10 flex w-full flex-col gap-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-10">
        <span className="text-sm font-semibold text-crema-white">{musician.name}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-burnished-gold">
          {musician.role[locale]}
        </span>
      </div>
    </Link>
  )
}

const CARD_BASE =
  'flex flex-col items-center justify-end overflow-hidden rounded-3xl border-[1.5px] border-white/10 text-center shadow-[0_20px_40px_rgba(0,0,0,0.25)] outline-none'

/** Musician roster: a scrollable strip on phones, a fan-of-cards from `sm:` up. */
export function MusicianFan({ locale }: { locale: Locale }) {
  return (
    <div className="mt-8">
      <div
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {MUSICIANS.map((musician, i) => (
          <MusicianCard
            key={musician.slug}
            musician={musician}
            locale={locale}
            className={`${CARD_BASE} relative h-[280px] w-[190px] shrink-0 snap-center`}
            style={{ backgroundColor: OFFSETS[i]!.bg }}
          />
        ))}
      </div>

      <div className="relative hidden h-[360px] w-full justify-center overflow-visible sm:flex md:h-[440px]">
        <div className="relative flex origin-center scale-75 items-center justify-center md:scale-100">
          {MUSICIANS.map((musician, i) => {
            const card = OFFSETS[i]!
            return (
              <MusicianCard
                key={musician.slug}
                musician={musician}
                locale={locale}
                className={`fan-card absolute ${CARD_BASE} h-[280px] w-[200px] md:h-[320px] md:w-[240px]`}
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
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
