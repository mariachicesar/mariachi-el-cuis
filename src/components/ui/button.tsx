import Link from 'next/link'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'ghost'

const styles: Record<Variant, string> = {
  primary:
    'bg-primary-container text-on-primary hover:bg-burnished-gold font-semibold uppercase tracking-wider',
  ghost: 'bg-charcoal-elevated text-crema-white hover:bg-charcoal-border',
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
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm transition-colors ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}
