'use client'
import Image from 'next/image'
import { useState } from 'react'

type VideoFacadeProps =
  | { title: string; youtubeId: string; src?: never; poster?: never }
  | { title: string; src: string; poster: string; youtubeId?: never }

export function VideoFacade(props: VideoFacadeProps) {
  const { title } = props
  const [playing, setPlaying] = useState(false)

  if (playing) {
    if (props.youtubeId) {
      return (
        <iframe
          className="aspect-video w-full rounded-xl"
          src={`https://www.youtube-nocookie.com/embed/${props.youtubeId}?autoplay=1`}
          title={title}
          allow="accelerated-download; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )
    }
    return (
      <video
        className="aspect-video w-full rounded-xl bg-charcoal-elevated"
        src={props.src}
        poster={props.poster}
        controls
        autoPlay
      />
    )
  }

  const posterSrc = props.youtubeId
    ? `https://i.ytimg.com/vi/${props.youtubeId}/hqdefault.jpg`
    : props.poster

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative flex aspect-video w-full items-center justify-center rounded-xl bg-charcoal-elevated"
      aria-label={`Play: ${title}`}
    >
      {props.youtubeId ? (
        // YouTube thumbnail host isn't in remotePatterns; a raw img avoids
        // widening the image optimizer's allowlist for a facade poster.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterSrc}
          alt=""
          className="absolute inset-0 h-full w-full rounded-xl object-cover opacity-70"
          loading="lazy"
        />
      ) : (
        <Image
          src={posterSrc!}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 768px"
          className="rounded-xl object-cover opacity-70"
        />
      )}
      <span className="relative rounded-full bg-burnished-gold px-5 py-3 font-semibold text-on-primary">
        ▶
      </span>
    </button>
  )
}
