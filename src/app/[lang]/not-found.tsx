import Link from 'next/link'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'

// Cannot read `params` here (not-found renders without matching a page's dynamic
// segments), so copy is written bilingual-safe: Spanish-first heading, English line
// underneath, rather than picking a locale.
export default function NotFound() {
  return (
    <main id="main">
      <Section className="text-center">
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">
          Página no encontrada
        </h1>
        <p className="mt-2 text-lg text-on-surface-variant">Page not found</p>
        <p className="mx-auto mt-6 max-w-xl text-on-surface-variant">
          No pudimos encontrar la página que buscas.
          <br />
          We couldn&apos;t find the page you were looking for.
        </p>
        <div className="mt-8">
          <Button href="/" variant="primary">
            Volver al inicio · Back home
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-silver">
          <Link href="/" className="underline underline-offset-4 hover:text-burnished-gold">
            mariachielcuis.com
          </Link>
        </p>
      </Section>
    </main>
  )
}
