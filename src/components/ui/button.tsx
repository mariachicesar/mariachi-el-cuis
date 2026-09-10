import Link from 'next/link'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'ghost'

const styles: Record<Variant, string> = {
  primary:
    'bg-primary-container text-on-primary hover:bg-burnished-gold font-semibold uppercase tracking-wider',
  ghost: 'bg-charcoal-elevated text-crema-white hover:bg-charcoal-border',
}

/** Shared button styling for non-`<Link>` anchors (e.g. `tel:` / `wa.me`). */
export function buttonClasses(variant: Variant = 'primary', className = '') {
  return `inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm transition-colors ${styles[variant]} ${className}`
}

export function Button({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string
  children: ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <Link href={href} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  )
}
