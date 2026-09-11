# Mariachi El Cuis — Public Site

The Phase 1 public marketing site for Mariachi El Cuis, a mariachi band serving Los Angeles and the
surrounding cities. Bilingual (Spanish default at `/`, English at `/en`), statically generated with
Next.js. It covers home, services, repertoire, about, media, guides (+ 4 articles), contact, terms,
privacy, book, ~16 city landing pages, and the usual site plumbing (sitemap, robots, `llms.txt`,
manifest, OG image, icon, 404/error, security headers).

Booking wizard, payments, quote engine, admin dashboard, and other dynamic features are deferred to
later phases — see the design spec and plan linked below.

## Stack

- [Next.js 16](https://nextjs.org) (App Router), TypeScript
- Tailwind CSS v4
- Resend for contact-form email delivery
- Vitest (unit) + Playwright + axe-core (e2e/accessibility) + Lighthouse CI (performance budgets)

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

See `.env.example` for the full list — currently `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, and
`CONTACT_TO_EMAIL`.

## Testing

```bash
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm test        # Vitest unit tests
pnpm test:e2e    # Playwright + axe-core accessibility checks
pnpm lhci        # Lighthouse CI (performance/accessibility/seo/best-practices budgets)
```

`pnpm build` must succeed before `pnpm test:e2e` or `pnpm lhci`, since both start a production
server (`pnpm start`) against the built output.

## Deployment

Deployed on [Vercel](https://vercel.com). Set the following environment variables in the Vercel
project settings:

- `NEXT_PUBLIC_SITE_URL` — the production origin (e.g. `https://mariachielcuis.com`)
- `RESEND_API_KEY` — Resend API key for contact-form email delivery
- `CONTACT_TO_EMAIL` — inbox that receives contact-form submissions

## Docs

- Design spec: `docs/superpowers/specs/2026-09-10-mariachi-el-cuis-website-design.md`
- Phase 1 implementation plan: `docs/superpowers/plans/2026-09-10-phase-1-public-site.md`
