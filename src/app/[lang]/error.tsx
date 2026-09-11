'use client'

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main id="main" className="flex min-h-[60vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-md rounded-lg border border-charcoal-border bg-surface-container p-8 text-center">
        <h1 className="font-display text-2xl text-burnished-gold">Algo salió mal</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Something went wrong.</p>
        <p className="mt-4 text-sm text-on-surface-variant">
          Intenta de nuevo o vuelve más tarde.
          <br />
          Please try again, or come back later.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-flex items-center justify-center rounded bg-primary-container px-6 py-3 text-sm font-semibold uppercase tracking-wider text-on-primary transition-colors hover:bg-burnished-gold"
        >
          Reintentar · Try again
        </button>
      </div>
    </main>
  )
}
