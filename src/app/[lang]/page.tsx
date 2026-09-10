import { isLocale } from '@/lib/i18n/locales'
import { notFound } from 'next/navigation'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <main id="main" className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
      <h1 className="font-display text-4xl text-crema-white">Mariachi El Cuis</h1>
    </main>
  )
}
