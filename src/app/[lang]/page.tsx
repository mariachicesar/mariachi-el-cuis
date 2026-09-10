// src/app/[lang]/page.tsx  (temporary smoke page — replaced in Task 6/12)
export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

export default function TempHome() {
  return <main>Mariachi El Cuis — build smoke test</main>
}
