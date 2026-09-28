'use client'
import { useEffect, useRef } from 'react'

/**
 * Muted, looping clip that plays only while it's on screen. Browsers allow
 * autoplay only when muted; controls stay visible so visitors can unmute.
 * Nothing downloads until it scrolls into view, and it stays paused for
 * visitors who prefer reduced motion.
 */
export function AutoplayVideo({
  src,
  poster,
  title,
  className = '',
}: {
  src: string
  poster: string
  title: string
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    // React doesn't reflect `muted` as a DOM property reliably; set it here
    // so play() is allowed without a user gesture.
    video.muted = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.5 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      className={`w-full rounded-xl bg-charcoal-elevated object-cover ${className}`}
      src={src}
      poster={poster}
      aria-label={title}
      muted
      loop
      playsInline
      controls
      preload="none"
    />
  )
}
