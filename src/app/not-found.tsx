import Link from 'next/link'

// Root `app/not-found.tsx` — outside `app/[lang]`, so there is no ambient root
// layout providing `<html>`/`<body>` here. It must render its own complete
// document. This only fires for paths outside `[lang]` that 404 (rare: the proxy
// rewrites almost everything into `/es/...` or `/en/...` first).
export default function RootNotFound() {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#131315',
          color: '#e5e1e4',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <main id="main">
          <h1 style={{ fontSize: '2rem', color: '#efb049', margin: 0 }}>
            Página no encontrada
          </h1>
          <p style={{ marginTop: '0.5rem' }}>Page not found</p>
          <p style={{ marginTop: '1.5rem' }}>
            <Link href="/" style={{ color: '#efb049', textDecoration: 'underline' }}>
              Volver al inicio · Back home
            </Link>
          </p>
        </main>
      </body>
    </html>
  )
}
