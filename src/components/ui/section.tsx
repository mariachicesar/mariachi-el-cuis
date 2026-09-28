import type { ReactNode } from 'react'

export function Section({
  children,
  className = '',
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={`w-full py-16 md:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">{children}</div>
    </section>
  )
}
