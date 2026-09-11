import { siteConfig } from '@/lib/config/site'
import { pricingLines } from '@/lib/data/pricing'
import { CITIES } from '@/lib/data/cities'
import { GUIDES } from '@/lib/content/guides'

export const dynamic = 'force-static'

export function GET() {
  const body = `# ${siteConfig.name}

> Traditional mariachi band serving Los Angeles County. Weddings, quinceañeras, serenatas,
> church masses, corporate events, and memorials.

- Website: ${siteConfig.url}
- Phone: ${siteConfig.phoneDisplay}
- WhatsApp: ${siteConfig.whatsappUrl}
- Email: ${siteConfig.email}
- Service area: ${siteConfig.serviceCountyLabel.en} only

## Pricing
${pricingLines('en').map((l) => `- ${l}`).join('\n')}

## Key pages
- Services & pricing: ${siteConfig.url}/services
- Get a quote / book: ${siteConfig.url}/book
- Repertoire: ${siteConfig.url}/repertoire
- Contact: ${siteConfig.url}/contact

## Guides
${GUIDES.map((g) => `- ${g.title.en}: ${siteConfig.url}/guides/${g.slug}`).join('\n')}

## City pages
${CITIES.map((c) => `- Mariachi in ${c.name}: ${siteConfig.url}/mariachi/${c.slug}`).join('\n')}
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
