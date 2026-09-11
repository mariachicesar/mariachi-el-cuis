import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/ui/json-ld'
import { Section } from '@/components/ui/section'
import { GUIDES, getGuide, getGuideContent } from '@/lib/content/guides'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { alternatesFor } from '@/lib/i18n/paths'
import { article, breadcrumb } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return GUIDES.flatMap((g) => [
    { lang: 'es', slug: g.slug },
    { lang: 'en', slug: g.slug },
  ])
}

const BREADCRUMB_HOME = { es: 'Inicio', en: 'Home' } as const
const BREADCRUMB_GUIDES = { es: 'Guías', en: 'Guides' } as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const guide = getGuide(slug)
  if (!guide) return {}
  return buildMetadata({
    locale,
    path: `/guides/${guide.slug}`,
    title: guide.title[locale],
    description: guide.description[locale],
  })
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const guide = getGuide(slug)
  if (!guide) notFound()

  const { default: GuideContent } = await getGuideContent(guide.slug, locale)

  const homeUrl = alternatesFor('/').languages[locale]!
  const guidesUrl = alternatesFor('/guides').languages[locale]!
  const articleUrl = alternatesFor(`/guides/${guide.slug}`).languages[locale]!

  return (
    <main id="main">
      <JsonLd
        data={article({
          headline: guide.title[locale],
          description: guide.description[locale],
          url: articleUrl,
          datePublished: guide.datePublished,
          dateModified: guide.dateModified,
        })}
      />
      <JsonLd
        data={breadcrumb([
          { name: BREADCRUMB_HOME[locale], url: homeUrl },
          { name: BREADCRUMB_GUIDES[locale], url: guidesUrl },
          { name: guide.title[locale], url: articleUrl },
        ])}
      />

      <Section>
        <article className="max-w-3xl">
          <GuideContent />
        </article>
      </Section>
    </main>
  )
}
