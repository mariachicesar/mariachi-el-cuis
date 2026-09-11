'use client'
import { useState } from 'react'

export function VideoFacade({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false)
  if (playing) {
    return (
      <iframe
        className="aspect-video w-full rounded-xl"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerated-download; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative flex aspect-video w-full items-center justify-center rounded-xl bg-charcoal-elevated"
      aria-label={`Play: ${title}`}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full rounded-xl object-cover opacity-70"
        loading="lazy"
      />
      <span className="relative rounded-full bg-burnished-gold px-5 py-3 font-semibold text-on-primary">
        ▶
      </span>
    </button>
  )
}
