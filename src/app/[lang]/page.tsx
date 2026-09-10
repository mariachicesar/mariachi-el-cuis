// src/app/[lang]/page.tsx  (temporary smoke page — replaced in Task 6/12)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mariachi El Cuis',
}

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

export default function TempHome() {
  return (
    <main id="main">
      <h1>Mariachi El Cuis</h1>
    </main>
  )
}
