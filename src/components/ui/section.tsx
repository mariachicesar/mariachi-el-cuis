import type { ReactNode } from 'react'

export function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`w-full py-16 md:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">{children}</div>
    </section>
  )
}
