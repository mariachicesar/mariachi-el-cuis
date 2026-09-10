# Mariachi El Cuis — Phase 1 (Public Site + SEO Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the bilingual, statically-generated Mariachi El Cuis marketing site — all content
pages, city landing pages, full SEO/structured-data/AI-crawler setup, a working contact form, and a
green Lighthouse + accessibility CI gate — deployable to Vercel on the `*.vercel.app` URL.

**Architecture:** One Next.js 16 App Router app in TypeScript. Every route lives under
`src/app/[lang]/…` (`lang ∈ {es, en}`). A `proxy.ts` rewrite serves Spanish at the URL root (`/…`)
and English at `/en/…` without exposing the `[lang]` segment. All marketing pages are Server
Components, statically generated for both locales. The only client JS islands are the repertoire
filter and the media-embed facade. SEO plumbing (`generateMetadata`, `sitemap.ts`, `robots.ts`,
`/llms.txt`, JSON-LD) is driven by typed data modules and a small `src/lib/seo/` helper layer.

**Tech Stack:** Next.js 16.3.4 (App Router, Turbopack), React 19.2, TypeScript 5, Tailwind CSS v4,
`next/font`, `lucide-react`, `zod`, `resend` + `react-email`, MDX (`@next/mdx`), Vitest,
Playwright + `@axe-core/playwright`, `@lhci/cli`, pnpm, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-10-mariachi-el-cuis-website-design.md` — read it alongside
this plan. This plan implements **Phase 1 only** (spec §14). Phases 2–5 (quote engine, payments,
calendar, WhatsApp bot, e-signature) are out of scope here and get their own plans.

## Global Constraints

- **Next.js is 16.3.4** and differs from training data. Before writing framework code for a task,
  read the matching guide under `node_modules/next/dist/docs/` (e.g. `01-app/02-guides/internationalization.md`,
  `.../03-api-reference/03-file-conventions/01-metadata/sitemap.md`, `.../robots.md`,
  `.../03-file-conventions/proxy.md`, `.../04-functions/generate-metadata.md`, `.../02-guides/mdx.md`).
- `params` and `searchParams` are **async** — always `await` them. Page/layout props typed via
  `PageProps<'/[lang]'>` / `LayoutProps<'/[lang]'>` (run `pnpm next typegen` after route changes).
- Locale routing file convention is `middleware`→**`proxy.ts`** (Node runtime, no `runtime` config).
- Turbopack is the default bundler — do **not** add a `webpack` key to `next.config`.
- No `next lint` — lint via the ESLint CLI (`eslint`), flat config only.
- **Locales:** `es` (default, at URL `/…`) and `en` (at `/en/…`). Same English slugs for both.
  `x-default` hreflang points at the Spanish (root) URL.
- **Brand tokens** (Tailwind `@theme`, exact hex): `--color-surface: #131315`,
  `--color-surface-container-lowest: #0e0e10`, `--color-charcoal-surface: #1A1A1E`,
  `--color-charcoal-elevated: #24242A`, `--color-charcoal-border: #363640`,
  `--color-burnished-gold: #EFB049`, `--color-primary: #ffd08a`, `--color-primary-container: #efb049`,
  `--color-on-primary: #442c00`, `--color-fiesta-crimson: #C92A2A`, `--color-crema-white: #FDFBF7`,
  `--color-on-surface: #e5e1e4`, `--color-on-surface-variant: #d5c4b0`, `--color-muted-silver: #9CA3AF`.
- **Fonts:** Playfair Display (headings), Plus Jakarta Sans (body/labels), via `next/font/google`,
  `display: 'swap'`, exposed as CSS vars `--font-playfair` / `--font-jakarta`.
- **Body copy never uses `burnished-gold` as its color** (contrast) — gold is for headings, accents,
  icons, borders only. Target **WCAG 2.2 AA**.
- **Business facts** (verbatim): name `Mariachi El Cuis`; phone `(626) 922-0091` /
  tel `+16269220091`; email `booking@mariachielcuis.com`; base ZIP `90011`
  (lat `34.0074`, lng `-118.2587`); WhatsApp deep link `https://wa.me/16269220091`;
  domain `mariachielcuis.com` (apex). Service area for quotes = **Los Angeles County only**.
- **Pricing copy** (Services page + city pages + FAQ + llms.txt must match the spec §1 exactly):
  - Mon–Fri, within 25 mi of 90011: "7 Songs" package **$380 flat** (1-hour calendar block) **or**
    **$500 / hour** with no hour minimum.
  - Mon–Fri, beyond 25 mi (still LA County): $500 / hour + the distance-minimum-hours rule.
  - Sat & Sun: **$550 / hour**, start time **3:00 PM or later**, distance minimum always applies.
  - Distance minimum hours (driving miles from 90011): **2h if ≤15 mi**, **3h if ≤30 mi**,
    **4h if ≤50 mi**, then **+1 hour per additional 20 mi**.
  - All days: events between 7:00 AM and midnight; no maximum length.
  - Deposit is **$100** for every booking; the balance is paid later directly to the band.
  - Lead time: under 3 hours before start = phone only; under 24 hours = allowed (rush).
  - Cancellation: deposit **refundable only if cancelled 7 or more days before the event**;
    within 7 days it is non-refundable.
  - Out of area (outside LA County or outside California): no instant quote — "contact us".
  In Phase 1 there is no quote calculator; these rules are presented as **static content** on the
  Services page, city pages, FAQ, and `llms.txt`. Keep the wording in `src/lib/data/pricing.ts` so
  every surface reads from one place.
- **No invented trust claims.** Do not state review counts, ratings, awards, insurance/COI, years in
  business, musician names/bios, or Orange County service. Placeholder-friendly copy only, marked
  for the owner to supply real content.
- `NEXT_PUBLIC_SITE_URL` is the single source of the canonical origin. Never hardcode the domain in
  components — import from `src/lib/config/site.ts` (which reads env with a localhost fallback).
- The app must **build and run with every optional env var absent** — a missing key disables that
  feature with a visible fallback, never a crash.
- **Commit after every task** (each task ends with a commit step). Conventional Commit messages.
  Branch: work on `master` is fine for this greenfield repo unless the executor prefers a feature
  branch.

---

## File Structure

```
src/
  app/
    [lang]/
      layout.tsx                   # THE root layout: <html>/<body>, fonts, shell, generateStaticParams
      page.tsx                     # Home
      services/page.tsx
      faq/page.tsx
      book/page.tsx                # Phase-1: intro + "contact us"/WhatsApp; wizard is Phase 2
      repertoire/page.tsx
      repertoire/repertoire-filter.tsx   # 'use client'
      about/page.tsx
      media/page.tsx
      contact/page.tsx
      contact/contact-form.tsx     # 'use client'
      guides/page.tsx
      guides/[slug]/page.tsx
      mariachi/[city]/page.tsx
      terms/page.tsx
      privacy/page.tsx
      not-found.tsx
      error.tsx                    # 'use client'
    actions/contact.ts             # 'use server'
    sitemap.ts
    robots.ts
    llms.txt/route.ts
    manifest.ts
    opengraph-image.tsx
    icon.tsx
    not-found.tsx                  # global 404, renders its own <html>
  content/
    guides/
      mariachi-cost-los-angeles.{es,en}.mdx
      quinceanera-song-guide.{es,en}.mdx
      how-booking-works.{es,en}.mdx
      wedding-mariachi-timeline.{es,en}.mdx
  components/
    layout/site-header.tsx
    layout/site-footer.tsx
    layout/mobile-tab-bar.tsx
    layout/skip-link.tsx
    layout/locale-switch.tsx
    ui/section.tsx
    ui/button.tsx
    ui/json-ld.tsx
    media/video-facade.tsx         # 'use client'
  lib/
    env.ts
    config/site.ts
    i18n/locales.ts                # LOCALES, DEFAULT_LOCALE, type Locale, isLocale
    i18n/dictionaries.ts           # getDictionary(), Dictionary type
    i18n/paths.ts                  # localizedPath(), alternatesFor()
    seo/metadata.ts                # buildMetadata()
    seo/jsonld.ts                  # localBusiness(), service(), faqPage(), breadcrumb(), article()
    geo/distance.ts                # haversineMiles()
    data/cities.ts
    data/services.ts
    data/faq.ts
    data/repertoire.ts
    data/pricing.ts                # PRICING defaults (mirrors spec §1; Phase 2 moves to DB)
  messages/
    es.json
    en.json
tests/
  unit/**/*.test.ts
  e2e/**/*.spec.ts
  e2e/axe.ts
lighthouserc.json
vitest.config.ts
playwright.config.ts
next.config.ts
mdx-components.tsx
proxy.ts
.github/workflows/ci.yml
```

---

## Task 1: Toolchain — TypeScript, `src/`, deps, lint, strip scaffold

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`, `next-env.d.ts` (generated), `src/app/[lang]/page.tsx` (temporary smoke page)
- Modify: `next.config.mjs` → `next.config.ts`
- Modify: `eslint.config.mjs`
- Delete: `src/pages/` (entire dir), `jsconfig.json`, `public/*.svg` (next/vercel/file/globe/window)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: a TypeScript App Router project that `pnpm build`s. Path alias `@/*` → `src/*`.
  `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` scripts.

- [ ] **Step 1: Install dependencies**

```bash
pnpm add zod resend @react-email/components @react-email/render lucide-react
pnpm add -D typescript @types/react @types/react-dom @types/node \
  vitest @vitejs/plugin-react vite-tsconfig-paths \
  @playwright/test @axe-core/playwright @lhci/cli \
  eslint @eslint/js typescript-eslint eslint-config-next globals
pnpm exec playwright install --with-deps chromium
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Replace `next.config.mjs` with `next.config.ts`**

```bash
rm next.config.mjs
```

```ts
// next.config.ts
import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: { formats: ['image/avif', 'image/webp'] },
}

const withMDX = createMDX({})
export default withMDX(nextConfig)
```

```bash
pnpm add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

- [ ] **Step 4: Rewrite `eslint.config.mjs` as flat config**

```js
// eslint.config.mjs
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import next from 'eslint-config-next'

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'playwright-report/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next.flatConfig ? [next.flatConfig.coreWebVitals] : [],
  { rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
)
```

> If `eslint-config-next` in this version does not expose `flatConfig`, follow its README in
> `node_modules/eslint-config-next/` for the flat-config entry and adjust the spread above.

- [ ] **Step 5: Update `package.json` scripts + remove stale config**

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lhci": "lhci autorun"
  }
}
```

```bash
rm jsconfig.json
rm -rf src/pages
rm public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
```

- [ ] **Step 6: Add a temporary smoke page so the build has a route**

```tsx
// src/app/[lang]/page.tsx  (replaced in Task 6/12)
export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}
export default function TempHome() {
  return <main>Mariachi El Cuis — build smoke test</main>
}
```

```tsx
// src/app/[lang]/layout.tsx  (replaced in Task 6)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: Verify build + typecheck + lint**

Run: `pnpm typecheck && pnpm build`
Expected: build succeeds; `/es` and `/en` prerendered.

> Next 16 does **not** require `src/app/layout.tsx` when the root layout is `app/[lang]/layout.tsx`
> (this is the documented i18n pattern — see `01-app/02-guides/internationalization.md`). Do **not**
> add a passthrough `src/app/layout.tsx` — it would prevent `src/app/not-found.tsx` (Task 20) from
> rendering its own `<html>`. If the build genuinely errors asking for a root layout, re-read that
> guide and the `layout.js` file-convention doc before adding anything.

Run: `pnpm lint`
Expected: passes (fix any import/order errors reported).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: migrate scaffold to App Router + TypeScript with src/ layout"
```

---

## Task 2: Design system — Tailwind v4 theme, fonts, global CSS

**Files:**
- Create: `src/app/globals.css`
- Modify: `src/app/[lang]/layout.tsx`
- Modify: `postcss.config.mjs` (verify only)
- Delete: `src/styles/globals.css` (old scaffold copy) if present

**Interfaces:**
- Consumes: Task 1 project.
- Produces: `globals.css` imported in the root layout; Tailwind utilities using the brand tokens;
  `--font-playfair` / `--font-jakarta` CSS vars available; `font-display`/`font-body` utilities.

- [ ] **Step 1: Write `src/app/globals.css`**

```css
@import 'tailwindcss';

@theme {
  --color-surface: #131315;
  --color-surface-container-lowest: #0e0e10;
  --color-surface-container: #201f21;
  --color-charcoal-surface: #1a1a1e;
  --color-charcoal-elevated: #24242a;
  --color-charcoal-border: #363640;
  --color-burnished-gold: #efb049;
  --color-primary: #ffd08a;
  --color-primary-container: #efb049;
  --color-on-primary: #442c00;
  --color-fiesta-crimson: #c92a2a;
  --color-crema-white: #fdfbf7;
  --color-on-surface: #e5e1e4;
  --color-on-surface-variant: #d5c4b0;
  --color-muted-silver: #9ca3af;

  --font-display: var(--font-playfair), Georgia, 'Times New Roman', serif;
  --font-body: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
}

:root { color-scheme: dark; }

body {
  background-color: var(--color-surface);
  color: var(--color-on-surface);
  font-family: var(--font-body);
}

h1, h2, h3, h4 { font-family: var(--font-display); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* visible focus for keyboard users */
:focus-visible { outline: 2px solid var(--color-burnished-gold); outline-offset: 2px; }
```

- [ ] **Step 2: Wire fonts + global CSS in the root layout**

```tsx
// src/app/[lang]/layout.tsx
import type { ReactNode } from 'react'
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'
import '@/app/globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
})
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
})

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return (
    <html lang={lang} className={`${playfair.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Delete the stale scaffold stylesheet**

```bash
rm -f src/styles/globals.css
rmdir src/styles 2>/dev/null || true
```

- [ ] **Step 4: Verify**

Run: `pnpm build`
Expected: build succeeds. Then `pnpm dev`, open `http://localhost:3000/es` — background is
near-black `#131315`, text is light. (Proxy routing comes in Task 6; hit `/es` directly for now.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind v4 brand theme, fonts, and global styles"
```

---

## Task 3: Test harness — Vitest, Playwright, axe

**Files:**
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/setup-env.ts`, `tests/e2e/axe.ts`,
  `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `.gitignore` (add `coverage/`, `playwright-report/`, `test-results/`, `.lighthouseci/`)

**Interfaces:**
- Consumes: Task 1 scripts.
- Produces: `pnpm test` runs Vitest against `tests/unit/**` and `src/**/*.test.ts` with
  `NEXT_PUBLIC_SITE_URL=https://mariachielcuis.com` forced; `pnpm test:e2e` runs Playwright against a
  `next build && next start` server (same env var); `checkA11y(page)` helper.

- [ ] **Step 1: Write `tests/setup-env.ts` and `vitest.config.ts`**

```ts
// tests/setup-env.ts
process.env.NEXT_PUBLIC_SITE_URL ||= 'https://mariachielcuis.com'
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    setupFiles: ['tests/setup-env.ts'],
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: { provider: 'v8', include: ['src/lib/**'] },
  },
})
```

```bash
pnpm add -D @vitest/coverage-v8
```

- [ ] **Step 2: Write the failing unit smoke test**

```ts
// tests/unit/smoke.test.ts
import { expect, test } from 'vitest'

test('vitest is wired up', () => {
  expect(1 + 1).toBe(2)
})
```

- [ ] **Step 3: Run it**

Run: `pnpm test`
Expected: 1 passed.

- [ ] **Step 4: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

const SITE_URL = 'https://mariachielcuis.com'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000/es',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { NEXT_PUBLIC_SITE_URL: SITE_URL },
  },
})
```

- [ ] **Step 5: Write the axe helper**

```ts
// tests/e2e/axe.ts
import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export async function checkA11y(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}
```

- [ ] **Step 6: Write the failing e2e smoke test**

```ts
// tests/e2e/smoke.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('home renders and is accessible', async ({ page }) => {
  await page.goto('/es')
  await expect(page.locator('body')).toBeVisible()
  await checkA11y(page)
})
```

- [ ] **Step 7: Run it**

Run: `pnpm test:e2e`
Expected: PASS (the temp home page from Task 1 has no a11y violations). If the temp page trips a
"document must have one main landmark" / "page must have h1" rule, wrap its text in
`<main><h1>…</h1></main>` — it is replaced in Task 12 anyway.

- [ ] **Step 8: Update `.gitignore` and commit**

```
# add to .gitignore
coverage/
playwright-report/
test-results/
.lighthouseci/
```

```bash
git add -A
git commit -m "test: add Vitest + Playwright + axe harness with smoke tests"
```

---

## Task 4: Environment validation module

**Files:**
- Create: `src/lib/env.ts`, `tests/unit/env.test.ts`
- Create: `.env.example`

**Interfaces:**
- Consumes: `zod`.
- Produces:
  - `env: { NEXT_PUBLIC_SITE_URL: string; RESEND_API_KEY?: string; CONTACT_TO_EMAIL?: string }`
  - `features: { email: boolean }`
  - `parseEnv(source: Record<string, string | undefined>): { env, features }` (pure, for tests)

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/env.test.ts
import { expect, test } from 'vitest'
import { parseEnv } from '@/lib/env'

test('falls back to localhost when NEXT_PUBLIC_SITE_URL is absent', () => {
  const { env } = parseEnv({})
  expect(env.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
})

test('email feature is off without RESEND_API_KEY', () => {
  const { features } = parseEnv({ NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' })
  expect(features.email).toBe(false)
})

test('email feature is on with key + recipient', () => {
  const { features } = parseEnv({
    RESEND_API_KEY: 're_x',
    CONTACT_TO_EMAIL: 'booking@mariachielcuis.com',
  })
  expect(features.email).toBe(true)
})

test('rejects a non-URL site url', () => {
  expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: 'not-a-url' })).toThrow()
})
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test tests/unit/env.test.ts`
Expected: FAIL (`@/lib/env` not found).

- [ ] **Step 3: Implement `src/lib/env.ts`**

```ts
import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_TO_EMAIL: z.string().email().optional(),
})

export function parseEnv(source: Record<string, string | undefined>) {
  const env = schema.parse({
    NEXT_PUBLIC_SITE_URL: source.NEXT_PUBLIC_SITE_URL,
    RESEND_API_KEY: source.RESEND_API_KEY,
    CONTACT_TO_EMAIL: source.CONTACT_TO_EMAIL,
  })
  return {
    env,
    features: { email: Boolean(env.RESEND_API_KEY && env.CONTACT_TO_EMAIL) },
  }
}

const parsed = parseEnv(process.env as Record<string, string | undefined>)
export const env = parsed.env
export const features = parsed.features
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test tests/unit/env.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Write `.env.example`**

```
# Public origin — set to the real domain in production
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Contact form email (Phase 1). Both required to enable sending.
RESEND_API_KEY=
CONTACT_TO_EMAIL=booking@mariachielcuis.com
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add zod-validated env module with feature flags"
```

---

## Task 5: Site config, i18n locales, dictionaries

**Files:**
- Create: `src/lib/i18n/locales.ts`, `src/lib/config/site.ts`,
  `src/lib/i18n/dictionaries.ts`, `src/messages/es.json`, `src/messages/en.json`
- Create: `tests/unit/i18n.test.ts`

**Interfaces:**
- Consumes: `src/lib/env.ts`.
- Produces:
  - `LOCALES = ['es','en'] as const`; `type Locale = 'es' | 'en'`; `DEFAULT_LOCALE = 'es'`;
    `isLocale(x: string): x is Locale`
  - `siteConfig`: `{ name, url, phoneDisplay, phoneTel, email, whatsappUrl, baseZip, baseLat,
    baseLng, serviceCountyLabel }`
  - `getDictionary(locale: Locale): Promise<Dictionary>` where `Dictionary = typeof import('@/messages/en.json')`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/i18n.test.ts
import { expect, test } from 'vitest'
import { DEFAULT_LOCALE, LOCALES, isLocale } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'

test('locale set', () => {
  expect(LOCALES).toEqual(['es', 'en'])
  expect(DEFAULT_LOCALE).toBe('es')
  expect(isLocale('es')).toBe(true)
  expect(isLocale('fr')).toBe(false)
})

test('dictionaries share the same key shape', async () => {
  const es = await getDictionary('es')
  const en = await getDictionary('en')
  expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort())
  expect(es.nav.home).not.toBe('')
  expect(en.nav.home).not.toBe('')
})
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test tests/unit/i18n.test.ts` → FAIL (modules missing).

- [ ] **Step 3: Implement `locales.ts`**

```ts
export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'es'
export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x)
}
```

- [ ] **Step 4: Implement `config/site.ts`**

```ts
import { env } from '@/lib/env'

export const siteConfig = {
  name: 'Mariachi El Cuis',
  url: env.NEXT_PUBLIC_SITE_URL,
  phoneDisplay: '(626) 922-0091',
  phoneTel: '+16269220091',
  email: 'booking@mariachielcuis.com',
  whatsappUrl: 'https://wa.me/16269220091',
  baseZip: '90011',
  baseLat: 34.0074,
  baseLng: -118.2587,
  serviceCountyLabel: 'Los Angeles County',
} as const
```

- [ ] **Step 5: Implement `dictionaries.ts`**

```ts
import 'server-only'
import type { Locale } from './locales'

const dictionaries = {
  es: () => import('@/messages/es.json').then((m) => m.default),
  en: () => import('@/messages/en.json').then((m) => m.default),
}

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)['en']>>
export const getDictionary = (locale: Locale): Promise<Dictionary> => dictionaries[locale]()
```

```bash
pnpm add server-only
```

- [ ] **Step 6: Create `src/messages/en.json` and `src/messages/es.json`**

Seed with the keys used across Phase 1 (extend in later tasks as needed; keep both files
key-identical). Minimum set:

```json
{
  "nav": { "home": "Home", "musicians": "Musicians", "repertoire": "Repertoire", "media": "Media", "guides": "Guides", "quote": "Instant Quote" },
  "cta": { "checkAvailability": "Check availability", "getQuote": "Get a quote", "call": "Call", "whatsapp": "WhatsApp us" },
  "footer": { "tagline": "Traditional mariachi for Los Angeles celebrations.", "areasHeading": "Service areas", "contactHeading": "Contact", "rights": "All rights reserved." },
  "common": { "skipToContent": "Skip to content", "languageName": "English" }
}
```

```json
{
  "nav": { "home": "Inicio", "musicians": "Músicos", "repertoire": "Repertorio", "media": "Media", "guides": "Guías", "quote": "Cotización" },
  "cta": { "checkAvailability": "Consultar disponibilidad", "getQuote": "Obtener cotización", "call": "Llamar", "whatsapp": "Escríbenos por WhatsApp" },
  "footer": { "tagline": "Mariachi tradicional para celebraciones en Los Ángeles.", "areasHeading": "Áreas de servicio", "contactHeading": "Contacto", "rights": "Todos los derechos reservados." },
  "common": { "skipToContent": "Saltar al contenido", "languageName": "Español" }
}
```

- [ ] **Step 7: Run — verify pass**

Run: `pnpm test tests/unit/i18n.test.ts` → 2 passed. Then `pnpm typecheck`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add i18n locales, dictionaries, and site config"
```

---

## Task 6: Locale routing — `proxy.ts` rewrite + `[lang]` layout + path helpers

**Files:**
- Create: `proxy.ts` (project root), `src/lib/i18n/paths.ts`, `tests/unit/paths.test.ts`,
  `tests/unit/proxy.test.ts`
- Modify: `src/app/[lang]/layout.tsx` (add `dynamicParams = false`, `<head>` nothing, keep fonts)

**Interfaces:**
- Consumes: `LOCALES`, `DEFAULT_LOCALE`, `isLocale`, `siteConfig`.
- Produces:
  - URL `/…` renders `[lang]=es`; `/en/…` renders `[lang]=en`; unknown first segments still resolve
    to `es` (e.g. `/services` → `es`, `/en/services` → `en`).
  - `localizedPath(path: string, locale: Locale): string` — `('/services','es') => '/services'`,
    `('/services','en') => '/en/services'`, `('/', 'en') => '/en'`.
  - `alternatesFor(path: string): { canonical: string; languages: Record<string,string> }` — absolute
    URLs from `siteConfig.url`, includes `'x-default'` → the `es` URL.

- [ ] **Step 1: Write failing tests for `paths.ts`**

```ts
// tests/unit/paths.test.ts
import { expect, test } from 'vitest'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'

test('localizedPath', () => {
  expect(localizedPath('/', 'es')).toBe('/')
  expect(localizedPath('/', 'en')).toBe('/en')
  expect(localizedPath('/services', 'es')).toBe('/services')
  expect(localizedPath('/services', 'en')).toBe('/en/services')
  expect(localizedPath('/mariachi/downey', 'en')).toBe('/en/mariachi/downey')
})

test('alternatesFor builds absolute canonical + hreflang incl. x-default', () => {
  const a = alternatesFor('/services')
  expect(a.canonical).toBe('https://mariachielcuis.com/services')
  expect(a.languages).toEqual({
    es: 'https://mariachielcuis.com/services',
    en: 'https://mariachielcuis.com/en/services',
    'x-default': 'https://mariachielcuis.com/services',
  })
})
```

> The `alternatesFor` test assumes `NEXT_PUBLIC_SITE_URL=https://mariachielcuis.com`. Add a
> `tests/setup-env.ts` that sets it, and reference it from `vitest.config.ts` via
> `test.setupFiles: ['tests/setup-env.ts']`. Content: `process.env.NEXT_PUBLIC_SITE_URL ||= 'https://mariachielcuis.com'`.

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test tests/unit/paths.test.ts` → FAIL.

- [ ] **Step 3: Implement `src/lib/i18n/paths.ts`**

```ts
import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales'
import { siteConfig } from '@/lib/config/site'

export function localizedPath(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : path.replace(/\/$/, '')
  if (locale === DEFAULT_LOCALE) return clean === '' ? '/' : clean
  return `/${locale}${clean}`
}

export function alternatesFor(path: string) {
  const abs = (p: string) => new URL(p, siteConfig.url).toString().replace(/\/$/, '') || siteConfig.url
  const languages: Record<string, string> = {}
  for (const l of LOCALES) languages[l] = abs(localizedPath(path, l))
  languages['x-default'] = abs(localizedPath(path, DEFAULT_LOCALE))
  return { canonical: abs(localizedPath(path, DEFAULT_LOCALE)), languages }
}
```

> Note: `canonical` here is always the `es` URL. Page-level `generateMetadata` (Task 7) overrides
> `canonical` with the **current locale's** URL and passes `languages` through unchanged.

- [ ] **Step 4: Run — verify pass** → `pnpm test tests/unit/paths.test.ts`

- [ ] **Step 5: Write `proxy.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { LOCALES } from '@/lib/i18n/locales'

const PUBLIC_FILE = /\.[a-z0-9]+$/i
// Root-level routes that must NOT be rewritten under /[lang]
const ROOT_ROUTES = new Set([
  '/', // handled below (rewritten to /es)
])
const ROOT_PREFIXES = ['/_next', '/api', '/opengraph-image', '/icon', '/apple-icon', '/manifest']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (ROOT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}-`))) {
    return NextResponse.next()
  }
  if (pathname !== '/' && PUBLIC_FILE.test(pathname)) return NextResponse.next()

  const first = pathname.split('/')[1]
  // /en/... already maps to [lang]=en
  if ((LOCALES as readonly string[]).includes(first)) return NextResponse.next()

  // everything else is Spanish: rewrite to /es/<path> so [lang]=es renders it.
  // The browser URL stays "/services"; usePathname() on the client sees the original path.
  const url = request.nextUrl.clone()
  url.pathname = `/es${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|llms.txt|opengraph-image|icon|apple-icon|manifest).*)',
  ],
}
```

> `ROOT_ROUTES` is declared for readability but only `/` is special-cased in the body; keep it or
> inline the check. `opengraph-image` / `icon` are Next metadata routes emitted at the app root (Task
> 20), so both the matcher and the function must let them through untouched.

- [ ] **Step 6: Write `tests/unit/proxy.test.ts`**

```ts
import { expect, test } from 'vitest'
import { unstable_doesProxyMatch } from 'next/experimental/testing/server'
import { config } from '../../proxy'

const nextConfig = {}

test('proxy skips static + api', () => {
  expect(unstable_doesProxyMatch({ config, nextConfig, url: '/_next/static/chunk.js' })).toBe(false)
  expect(unstable_doesProxyMatch({ config, nextConfig, url: '/api/quote' })).toBe(false)
})

test('proxy runs for content routes', () => {
  expect(unstable_doesProxyMatch({ config, nextConfig, url: '/' })).toBe(true)
  expect(unstable_doesProxyMatch({ config, nextConfig, url: '/services' })).toBe(true)
  expect(unstable_doesProxyMatch({ config, nextConfig, url: '/en/services' })).toBe(true)
})
```

> `next/experimental/testing/server` and `unstable_doesProxyMatch` exist in 15.1+ but the exact
> argument shape shifts between minors — check `node_modules/next/experimental/testing/server.d.ts`.
> If it is missing or incompatible, delete this file; the rewrite behavior is still covered by the
> e2e assertions in Task 11 (`/services` serves `<html lang="es">`, `/en/services` serves `en`) and
> Task 20 (404 route).

- [ ] **Step 7: Finalize `[lang]/layout.tsx`**

Add below `generateStaticParams`:

```ts
export const dynamicParams = false
```

- [ ] **Step 8: Verify routing end-to-end**

Run: `pnpm build && pnpm start`, then:
- `curl -s localhost:3000/ | grep '<html'` → `lang="es"`
- `curl -s localhost:3000/en | grep '<html'` → `lang="en"`
- `curl -s -o /dev/null -w '%{http_code}' localhost:3000/services` → `200` (temp page renders for any
  path because `[lang]/page.tsx` is the only route; that's fine until Task 12+).

Run: `pnpm test` → all green. `pnpm typecheck`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: locale routing via proxy rewrite + path helpers"
```

---

## Task 7: SEO — `buildMetadata` helper

**Files:**
- Create: `src/lib/seo/metadata.ts`, `tests/unit/metadata.test.ts`
- Modify: `src/app/[lang]/layout.tsx` (add `metadata` base + `metadataBase`)

**Interfaces:**
- Consumes: `siteConfig`, `alternatesFor`, `localizedPath`, `Locale`.
- Produces: `buildMetadata(opts): Metadata` where
  `opts = { locale: Locale; path: string; title: string; description: string; titleAbsolute?: boolean; ogImagePath?: string; noindex?: boolean }`.
  Sets `title` (plain string → the layout template wraps it as `%s · Mariachi El Cuis`; with
  `titleAbsolute: true` → `{ absolute: title }` so nothing is appended — used by the home page),
  `description`, `alternates.canonical` (current-locale absolute URL), `alternates.languages` (from
  `alternatesFor`), `openGraph` (type website, locale, url, siteName, title, description, images),
  `twitter` (summary_large_image), and `robots` when `noindex`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/metadata.test.ts
import { expect, test } from 'vitest'
import { buildMetadata } from '@/lib/seo/metadata'

test('canonical is the current-locale absolute url', () => {
  const es = buildMetadata({ locale: 'es', path: '/services', title: 'Servicios', description: 'x' })
  const en = buildMetadata({ locale: 'en', path: '/services', title: 'Services', description: 'x' })
  expect(es.alternates?.canonical).toBe('https://mariachielcuis.com/services')
  expect(en.alternates?.canonical).toBe('https://mariachielcuis.com/en/services')
})

test('hreflang languages include es, en, x-default', () => {
  const m = buildMetadata({ locale: 'es', path: '/', title: 'Inicio', description: 'x' })
  expect(Object.keys(m.alternates?.languages ?? {}).sort()).toEqual(['en', 'es', 'x-default'])
})

test('noindex sets robots', () => {
  const m = buildMetadata({ locale: 'en', path: '/book', title: 'Book', description: 'x', noindex: true })
  expect(m.robots).toMatchObject({ index: false })
})

test('og image defaults to the site opengraph image', () => {
  const m = buildMetadata({ locale: 'es', path: '/', title: 'x', description: 'y' })
  expect(JSON.stringify(m.openGraph?.images)).toContain('/opengraph-image')
})

test('titleAbsolute wraps the title so the layout template is not applied', () => {
  const plain = buildMetadata({ locale: 'es', path: '/', title: 'Home', description: 'x' })
  const abs = buildMetadata({ locale: 'es', path: '/', title: 'Home', description: 'x', titleAbsolute: true })
  expect(plain.title).toBe('Home')
  expect(abs.title).toEqual({ absolute: 'Home' })
})
```

- [ ] **Step 2: Run — verify fail** → `pnpm test tests/unit/metadata.test.ts`

- [ ] **Step 3: Implement `src/lib/seo/metadata.ts`**

```ts
import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config/site'
import { alternatesFor, localizedPath } from '@/lib/i18n/paths'
import type { Locale } from '@/lib/i18n/locales'

interface Opts {
  locale: Locale
  path: string
  title: string
  description: string
  titleAbsolute?: boolean
  ogImagePath?: string
  noindex?: boolean
}

export function buildMetadata(opts: Opts): Metadata {
  const { locale, path, title, description, noindex } = opts
  const { languages } = alternatesFor(path)
  const canonical = languages[locale]!
  const ogImage = new URL(opts.ogImagePath ?? '/opengraph-image', siteConfig.url).toString()

  return {
    title: opts.titleAbsolute ? { absolute: title } : title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      locale: locale === 'es' ? 'es_MX' : 'en_US',
      url: canonical,
      siteName: siteConfig.name,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
```

- [ ] **Step 4: Run — verify pass**

- [ ] **Step 5: Add root `metadataBase` + title template in `[lang]/layout.tsx`**

```ts
import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config/site'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  applicationName: siteConfig.name,
}
```

- [ ] **Step 6: Verify** → `pnpm test && pnpm typecheck`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add buildMetadata SEO helper with canonical + hreflang"
```

---

## Task 8: SEO — JSON-LD builders + `<JsonLd>` component

**Files:**
- Create: `src/lib/seo/jsonld.ts`, `src/components/ui/json-ld.tsx`, `tests/unit/jsonld.test.ts`

**Interfaces:**
- Consumes: `siteConfig`.
- Produces:
  - `localBusiness(opts: { areaServed: string[]; sameAs?: string[] }): object`
  - `service(opts: { locale: Locale; url: string }): object`
  - `faqPage(items: { q: string; a: string }[]): object`
  - `breadcrumb(items: { name: string; url: string }[]): object`
  - `article(opts: { headline: string; description: string; url: string; datePublished: string; dateModified: string }): object`
  - `<JsonLd data={object} />` — renders `<script type="application/ld+json">` with `<` escaped to `<`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/jsonld.test.ts
import { expect, test } from 'vitest'
import { breadcrumb, faqPage, localBusiness, service } from '@/lib/seo/jsonld'

test('localBusiness has required fields', () => {
  const ld = localBusiness({ areaServed: ['Los Angeles', 'Downey'] }) as Record<string, unknown>
  expect(ld['@context']).toBe('https://schema.org')
  expect(ld['@type']).toEqual(['LocalBusiness', 'MusicGroup'])
  expect(ld.name).toBe('Mariachi El Cuis')
  expect(ld.telephone).toBe('+16269220091')
  expect((ld.areaServed as string[]).length).toBe(2)
})

test('faqPage maps items to Question/Answer', () => {
  const ld = faqPage([{ q: 'How much?', a: '$500/hr' }]) as any
  expect(ld['@type']).toBe('FAQPage')
  expect(ld.mainEntity[0]['@type']).toBe('Question')
  expect(ld.mainEntity[0].acceptedAnswer.text).toBe('$500/hr')
})

test('breadcrumb positions are 1-indexed', () => {
  const ld = breadcrumb([{ name: 'Home', url: 'https://x/' }, { name: 'Services', url: 'https://x/services' }]) as any
  expect(ld.itemListElement[1].position).toBe(2)
})

test('service references the business', () => {
  const ld = service({ locale: 'en', url: 'https://mariachielcuis.com/en/services' }) as any
  expect(ld['@type']).toBe('Service')
  expect(ld.provider.name).toBe('Mariachi El Cuis')
})
```

- [ ] **Step 2: Run — verify fail**

- [ ] **Step 3: Implement `src/lib/seo/jsonld.ts`**

```ts
import { siteConfig } from '@/lib/config/site'
import type { Locale } from '@/lib/i18n/locales'

const ORG = {
  '@type': 'MusicGroup',
  name: siteConfig.name,
  telephone: siteConfig.phoneTel,
  email: siteConfig.email,
  url: siteConfig.url,
}

export function localBusiness(opts: { areaServed: string[]; sameAs?: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'MusicGroup'],
    name: siteConfig.name,
    url: siteConfig.url,
    telephone: siteConfig.phoneTel,
    email: siteConfig.email,
    image: new URL('/opengraph-image', siteConfig.url).toString(),
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Los Angeles',
      addressRegion: 'CA',
      postalCode: siteConfig.baseZip,
      addressCountry: 'US',
    },
    areaServed: opts.areaServed,
    ...(opts.sameAs?.length ? { sameAs: opts.sameAs } : {}),
  }
}

export function service(opts: { locale: Locale; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: opts.locale === 'es' ? 'Servicio de mariachi' : 'Mariachi band service',
    provider: ORG,
    areaServed: { '@type': 'AdministrativeArea', name: siteConfig.serviceCountyLabel },
    url: opts.url,
  }
}

export function faqPage(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  }
}

export function breadcrumb(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  }
}

export function article(opts: {
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    url: opts.url,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: ORG,
    publisher: ORG,
  }
}
```

- [ ] **Step 4: Implement `src/components/ui/json-ld.tsx`**

```tsx
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
```

- [ ] **Step 5: Run — verify pass** → `pnpm test tests/unit/jsonld.test.ts`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add JSON-LD builders and JsonLd component"
```

---

## Task 9: Data — cities + distance

**Files:**
- Create: `src/lib/geo/distance.ts`, `src/lib/data/cities.ts`,
  `tests/unit/distance.test.ts`, `tests/unit/cities.test.ts`

**Interfaces:**
- Consumes: `siteConfig` (base lat/lng).
- Produces:
  - `haversineMiles(a: {lat:number;lng:number}, b: {lat:number;lng:number}): number`
  - `type City = { slug: string; name: string; lat: number; lng: number; blurb: { es: string; en: string }; neighborhoods: string[] }`
  - `CITIES: City[]` (15–20 entries)
  - `getCity(slug: string): City | undefined`
  - `cityDistanceMi(city: City): number` (straight-line, rounded to 1 decimal — approximate, labelled
    as such in UI; the real driving-distance quote is Phase 2)

- [ ] **Step 1: Write failing distance test**

```ts
// tests/unit/distance.test.ts
import { expect, test } from 'vitest'
import { haversineMiles } from '@/lib/geo/distance'

test('zero distance for identical points', () => {
  expect(haversineMiles({ lat: 34, lng: -118 }, { lat: 34, lng: -118 })).toBe(0)
})

test('downtown LA to Downey is roughly 11-13 miles', () => {
  const d = haversineMiles({ lat: 34.0074, lng: -118.2587 }, { lat: 33.94, lng: -118.1326 })
  expect(d).toBeGreaterThan(9)
  expect(d).toBeLessThan(15)
})
```

- [ ] **Step 2: Run — verify fail**

- [ ] **Step 3: Implement `src/lib/geo/distance.ts`**

```ts
type Point = { lat: number; lng: number }

export function haversineMiles(a: Point, b: Point): number {
  const R = 3958.7613 // Earth radius, miles
  const toRad = (n: number) => (n * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10
}
```

- [ ] **Step 4: Run — verify pass**

- [ ] **Step 5: Write failing cities test**

```ts
// tests/unit/cities.test.ts
import { expect, test } from 'vitest'
import { CITIES, cityDistanceMi, getCity } from '@/lib/data/cities'

test('15-20 cities, all fields present, slugs unique', () => {
  expect(CITIES.length).toBeGreaterThanOrEqual(15)
  expect(CITIES.length).toBeLessThanOrEqual(20)
  const slugs = new Set(CITIES.map((c) => c.slug))
  expect(slugs.size).toBe(CITIES.length)
  for (const c of CITIES) {
    expect(c.slug).toMatch(/^[a-z-]+$/)
    expect(c.name.length).toBeGreaterThan(1)
    expect(c.blurb.es.length).toBeGreaterThan(40)
    expect(c.blurb.en.length).toBeGreaterThan(40)
    expect(Math.abs(c.lat)).toBeGreaterThan(0)
  }
})

test('every city is within ~35 miles of base (sanity)', () => {
  for (const c of CITIES) expect(cityDistanceMi(c)).toBeLessThan(35)
})

test('getCity', () => {
  expect(getCity('downey')?.name).toBe('Downey')
  expect(getCity('nope')).toBeUndefined()
})
```

- [ ] **Step 6: Run — verify fail**

- [ ] **Step 7: Implement `src/lib/data/cities.ts`**

Full file — 16 cities, centroid coordinates, distinct blurbs (no fabricated claims):

```ts
import { siteConfig } from '@/lib/config/site'
import { haversineMiles } from '@/lib/geo/distance'

export type City = {
  slug: string
  name: string
  lat: number
  lng: number
  neighborhoods: string[]
  blurb: { es: string; en: string }
}

export const CITIES: City[] = [
  {
    slug: 'huntington-park', name: 'Huntington Park', lat: 33.9819, lng: -118.2251,
    neighborhoods: ['Pacific Boulevard', 'Walnut Park'],
    blurb: {
      es: 'Tocamos en Huntington Park casi cada semana, desde salones sobre Pacific Boulevard hasta patios familiares en Walnut Park. Está a pocos minutos de nuestra base en el 90011.',
      en: 'We play Huntington Park nearly every week, from halls along Pacific Boulevard to backyard parties in Walnut Park. It is minutes from our 90011 home base.',
    },
  },
  {
    slug: 'boyle-heights', name: 'Boyle Heights', lat: 34.0339, lng: -118.2078,
    neighborhoods: ['Mariachi Plaza', 'Estrada Courts'],
    blurb: {
      es: 'Boyle Heights es el corazón del mariachi en Los Ángeles. Damos serenatas cerca de Mariachi Plaza y tocamos en misas de la Iglesia de la Soledad y fiestas familiares en todo el barrio.',
      en: 'Boyle Heights is the heart of mariachi in Los Angeles. We play serenatas near Mariachi Plaza and perform at church masses and family parties throughout the neighborhood.',
    },
  },
  {
    slug: 'east-los-angeles', name: 'East Los Angeles', lat: 34.0239, lng: -118.1720,
    neighborhoods: ['City Terrace', 'Belvedere'],
    blurb: {
      es: 'En East LA tocamos quinceañeras, bodas y aniversarios en salones sobre Whittier Boulevard y en casas de City Terrace y Belvedere.',
      en: 'In East LA we play quinceañeras, weddings, and anniversaries at halls along Whittier Boulevard and at homes in City Terrace and Belvedere.',
    },
  },
  {
    slug: 'south-gate', name: 'South Gate', lat: 33.9547, lng: -118.2120,
    neighborhoods: ['Hollydale', 'South Gate Park'],
    blurb: {
      es: 'South Gate está dentro de nuestra zona sin recargo. Tocamos en South Gate Park, en salones de Tweedy Boulevard y en fiestas de Hollydale.',
      en: 'South Gate is inside our no-surcharge zone. We play South Gate Park, halls along Tweedy Boulevard, and parties in Hollydale.',
    },
  },
  {
    slug: 'downey', name: 'Downey', lat: 33.9401, lng: -118.1326,
    neighborhoods: ['Downtown Downey', 'Rancho Estates'],
    blurb: {
      es: 'Downey es una de nuestras ciudades más solicitadas para bodas y galas. Tocamos en hoteles cerca del centro y en recepciones familiares por todo Rancho Estates.',
      en: 'Downey is one of our most-requested cities for weddings and galas. We play hotels near downtown and family receptions across Rancho Estates.',
    },
  },
  {
    slug: 'bell', name: 'Bell', lat: 33.9775, lng: -118.1870,
    neighborhoods: ['Bell Gardens border', 'Atlantic Avenue'],
    blurb: {
      es: 'Bell está a un paso de nuestra base. Damos serenatas de cumpleaños y del Día de las Madres y tocamos en salones sobre Atlantic Avenue.',
      en: 'Bell is a short drive from our base. We play birthday and Mother’s Day serenatas and perform at halls along Atlantic Avenue.',
    },
  },
  {
    slug: 'bell-gardens', name: 'Bell Gardens', lat: 33.9653, lng: -118.1514,
    neighborhoods: ['Ford Boulevard', 'Clara Street'],
    blurb: {
      es: 'En Bell Gardens tocamos quinceañeras y bautizos en salones sobre Eastern Avenue y fiestas en casas cerca de Ford Boulevard.',
      en: 'In Bell Gardens we play quinceañeras and baptism parties at halls along Eastern Avenue and at homes near Ford Boulevard.',
    },
  },
  {
    slug: 'cudahy', name: 'Cudahy', lat: 33.9611, lng: -118.1845,
    neighborhoods: ['Live Oak', 'Atlantic Avenue'],
    blurb: {
      es: 'Cudahy es una de las ciudades más compactas del condado y está en nuestra zona local. Tocamos serenatas a domicilio y fiestas de barrio durante todo el año.',
      en: 'Cudahy is one of the county’s most compact cities and sits in our local zone. We play doorstep serenatas and block parties year-round.',
    },
  },
  {
    slug: 'maywood', name: 'Maywood', lat: 33.9867, lng: -118.1853,
    neighborhoods: ['Slauson Avenue', 'Heliotrope'],
    blurb: {
      es: 'Maywood está a menos de 15 minutos del 90011. Damos serenatas sorpresa y tocamos en aniversarios y bodas pequeñas.',
      en: 'Maywood is under 15 minutes from 90011. We play surprise serenatas and perform at anniversaries and small weddings.',
    },
  },
  {
    slug: 'lynwood', name: 'Lynwood', lat: 33.9303, lng: -118.2115,
    neighborhoods: ['Long Beach Boulevard', 'Century'],
    blurb: {
      es: 'En Lynwood tocamos misas panamericanas, quinceañeras y graduaciones en salones sobre Long Beach Boulevard.',
      en: 'In Lynwood we play Panamerican masses, quinceañeras, and graduations at halls along Long Beach Boulevard.',
    },
  },
  {
    slug: 'montebello', name: 'Montebello', lat: 34.0165, lng: -118.1137,
    neighborhoods: ['Montebello Town Center', 'Beverly Boulevard'],
    blurb: {
      es: 'Montebello es una parada habitual para bodas y galas corporativas. Tocamos en salones sobre Beverly Boulevard y en el Quiet Cannon.',
      en: 'Montebello is a regular stop for weddings and corporate galas. We play halls along Beverly Boulevard and the Quiet Cannon.',
    },
  },
  {
    slug: 'pico-rivera', name: 'Pico Rivera', lat: 33.9830, lng: -118.0967,
    neighborhoods: ['Rivera', 'Smith Park'],
    blurb: {
      es: 'En Pico Rivera tocamos aniversarios, bodas y fiestas familiares cerca de Smith Park y en salones sobre Whittier Boulevard.',
      en: 'In Pico Rivera we play anniversaries, weddings, and family parties near Smith Park and at halls along Whittier Boulevard.',
    },
  },
  {
    slug: 'whittier', name: 'Whittier', lat: 33.9792, lng: -118.0328,
    neighborhoods: ['Uptown Whittier', 'East Whittier'],
    blurb: {
      es: 'Whittier está cerca del límite de nuestra zona de tarifa base. Tocamos bodas en Uptown Whittier y misas en las parroquias de la zona.',
      en: 'Whittier sits near the edge of our base-rate zone. We play weddings in Uptown Whittier and masses at parishes across the area.',
    },
  },
  {
    slug: 'norwalk', name: 'Norwalk', lat: 33.9022, lng: -118.0817,
    neighborhoods: ['Norwalk Square', 'Studebaker'],
    blurb: {
      es: 'En Norwalk tocamos quinceañeras y bodas en salones cerca de Norwalk Square y recepciones familiares por toda la ciudad.',
      en: 'In Norwalk we play quinceañeras and weddings at halls near Norwalk Square and family receptions across the city.',
    },
  },
  {
    slug: 'commerce', name: 'Commerce', lat: 33.9950, lng: -118.1559,
    neighborhoods: ['The Citadel', 'Rosewood Park'],
    blurb: {
      es: 'Commerce está a minutos de nuestra base. Tocamos eventos corporativos cerca de los hoteles de la ciudad y fiestas familiares en Rosewood Park.',
      en: 'Commerce is minutes from our base. We play corporate events near the city’s hotels and family parties at Rosewood Park.',
    },
  },
  {
    slug: 'los-angeles', name: 'Los Angeles', lat: 34.0074, lng: -118.2587,
    neighborhoods: ['Downtown', 'South LA', 'Historic South-Central'],
    blurb: {
      es: 'Nuestra base está en el 90011, en el sur de Los Ángeles. Tocamos en todo el centro, en South LA y en los barrios históricos que rodean nuestra sede.',
      en: 'Our home base is 90011 in South Los Angeles. We play across Downtown, South LA, and the historic neighborhoods surrounding our headquarters.',
    },
  },
]

export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug)
}

export function cityDistanceMi(city: City): number {
  return haversineMiles({ lat: siteConfig.baseLat, lng: siteConfig.baseLng }, city)
}
```

> Verify each coordinate against a map before shipping (they are approximate centroids). The
> `cities.test.ts` `< 35` sanity check will catch a bad one.

- [ ] **Step 8: Run — verify pass** → `pnpm test tests/unit/cities.test.ts`

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add city data with haversine distance from base"
```

---

## Task 10: Data — pricing, services, FAQ, repertoire

**Files:**
- Create: `src/lib/data/pricing.ts`, `src/lib/data/services.ts`, `src/lib/data/faq.ts`,
  `src/lib/data/repertoire.ts`, `tests/unit/data.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `PRICING` — typed object mirroring spec §1 (rates, radii, minimum table, deposit, hoursWindow,
    leadTime, cancellationDays) + `pricingLines(locale): string[]` (human-readable bullets).
  - `SERVICES: { slug: string; title: {es;en}; summary: {es;en}; occasions: {es;en}[] }[]` (wedding,
    quinceañera, serenata/birthday, church mass, corporate, memorial).
  - `FAQ: { q: {es;en}; a: {es;en} }[]` (≥ 8 entries; pricing/area/lead-time/deposit/cancellation).
  - `REPERTOIRE: { title: string; genre: string; composer?: string }[]` (≥ 40 standard songs).

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/data.test.ts
import { expect, test } from 'vitest'
import { PRICING, pricingLines } from '@/lib/data/pricing'
import { SERVICES } from '@/lib/data/services'
import { FAQ } from '@/lib/data/faq'
import { REPERTOIRE } from '@/lib/data/repertoire'

test('pricing matches the spec', () => {
  expect(PRICING.hourlyWeekday).toBe(500)
  expect(PRICING.hourlyWeekend).toBe(550)
  expect(PRICING.sevenSongsFlat).toBe(380)
  expect(PRICING.weekdayRadiusMi).toBe(25)
  expect(PRICING.deposit).toBe(100)
  expect(PRICING.cancellationRefundDays).toBe(7)
  expect(PRICING.minimumTable).toEqual([
    { maxMi: 15, hours: 2 },
    { maxMi: 30, hours: 3 },
    { maxMi: 50, hours: 4 },
  ])
})

test('pricingLines returns non-empty localized bullets', () => {
  expect(pricingLines('es').length).toBeGreaterThan(4)
  expect(pricingLines('en').every((l) => l.length > 0)).toBe(true)
})

test('services + faq + repertoire have content', () => {
  expect(SERVICES.length).toBe(6)
  expect(FAQ.length).toBeGreaterThanOrEqual(8)
  expect(REPERTOIRE.length).toBeGreaterThanOrEqual(40)
})
```

- [ ] **Step 2: Run — verify fail**

- [ ] **Step 3: Implement `src/lib/data/pricing.ts`**

```ts
import type { Locale } from '@/lib/i18n/locales'

export const PRICING = {
  sevenSongsFlat: 380,
  hourlyWeekday: 500,
  hourlyWeekend: 550,
  weekdayRadiusMi: 25,
  minimumTable: [
    { maxMi: 15, hours: 2 },
    { maxMi: 30, hours: 3 },
    { maxMi: 50, hours: 4 },
  ],
  minimumStepMi: 20,
  deposit: 100,
  hoursWindow: { start: '07:00', end: '24:00' },
  weekendEarliestStart: '15:00',
  leadTimeCallHours: 3,
  leadTimeRushHours: 24,
  cancellationRefundDays: 7,
} as const

export function pricingLines(locale: Locale): string[] {
  const es = [
    'Lunes a viernes (dentro de 25 millas del 90011): paquete de 7 canciones por $380, o $500 por hora sin mínimo de horas.',
    'Sábado y domingo: $550 por hora, comenzando a las 3:00 PM o más tarde.',
    'Mínimo de horas según la distancia: 2 horas dentro de 15 millas, 3 horas dentro de 30, 4 horas dentro de 50, y 1 hora más por cada 20 millas adicionales.',
    'El depósito es de $100 para reservar la fecha; el saldo se paga después directamente al mariachi.',
    'Cancelación: el depósito es reembolsable solo si cancela 7 días o más antes del evento.',
    'Cotización instantánea únicamente dentro del Condado de Los Ángeles.',
  ]
  const en = [
    'Monday–Friday (within 25 miles of 90011): 7-song package for $380, or $500/hour with no hour minimum.',
    'Saturday & Sunday: $550/hour, starting 3:00 PM or later.',
    'Minimum hours by distance: 2 hours within 15 miles, 3 hours within 30, 4 hours within 50, then +1 hour per additional 20 miles.',
    'A $100 deposit reserves your date; the balance is paid later directly to the band.',
    'Cancellation: the deposit is refundable only if you cancel 7 or more days before the event.',
    'Instant quotes are available for Los Angeles County only.',
  ]
  return locale === 'es' ? es : en
}
```

- [ ] **Step 4: Implement `src/lib/data/services.ts`**

```ts
export type Service = {
  slug: string
  title: { es: string; en: string }
  summary: { es: string; en: string }
  occasions: { es: string; en: string }[]
}

export const SERVICES: Service[] = [
  {
    slug: 'wedding',
    title: { es: 'Bodas', en: 'Weddings' },
    summary: {
      es: 'Acompañamos la ceremonia, la hora del coctel y la entrada a la recepción con mariachi en vivo.',
      en: 'We play the ceremony, cocktail hour, and the entrance to your reception with live mariachi.',
    },
    occasions: [
      { es: 'Entrada de los novios y Ave María en la ceremonia', en: 'Processional and Ave María at the ceremony' },
      { es: 'Set durante la hora del coctel', en: 'Cocktail-hour set' },
      { es: 'Primer baile o brindis con canción especial', en: 'First dance or toast with a requested song' },
    ],
  },
  {
    slug: 'quinceanera',
    title: { es: 'Quinceañeras', en: 'Quinceañeras' },
    summary: {
      es: 'Desde la misa hasta el vals y el baile sorpresa, con las rancheras que llenan la pista.',
      en: 'From the mass to the vals and the surprise dance, plus the rancheras that fill the floor.',
    },
    occasions: [
      { es: 'Misa de acción de gracias', en: 'Thanksgiving mass' },
      { es: 'Vals con el papá y la corte', en: 'Vals with dad and the court' },
      { es: 'Set de rancheras y sones para la fiesta', en: 'Ranchera and son set for the party' },
    ],
  },
  {
    slug: 'serenata',
    title: { es: 'Serenatas y cumpleaños', en: 'Serenatas & birthdays' },
    summary: {
      es: 'Llegada sorpresa a la casa, al restaurante o al trabajo con Las Mañanitas y canciones a pedido.',
      en: 'A surprise arrival at the house, restaurant, or workplace with Las Mañanitas and requests.',
    },
    occasions: [
      { es: 'Cumpleaños y Día de las Madres', en: 'Birthdays and Mother’s Day' },
      { es: 'Aniversarios y pedidas de mano', en: 'Anniversaries and proposals' },
      { es: 'Sorpresas en restaurantes', en: 'Restaurant surprises' },
    ],
  },
  {
    slug: 'church-mass',
    title: { es: 'Misas', en: 'Church masses' },
    summary: {
      es: 'Misa panamericana con los cantos de entrada, ofertorio, santo, cordero y salida.',
      en: 'Panamerican mass with entrance, offertory, Santo, Cordero, and recessional hymns.',
    },
    occasions: [
      { es: 'Bautizos y presentaciones', en: 'Baptisms and presentations' },
      { es: 'Misas de quinceañera y aniversario', en: 'Quinceañera and anniversary masses' },
      { es: 'Misas de acción de gracias', en: 'Thanksgiving masses' },
    ],
  },
  {
    slug: 'corporate',
    title: { es: 'Eventos corporativos', en: 'Corporate events' },
    summary: {
      es: 'Recepciones, cenas de premiación y celebraciones de fin de año con un set profesional.',
      en: 'Receptions, awards dinners, and year-end celebrations with a professional set.',
    },
    occasions: [
      { es: 'Recepciones y mezcladores', en: 'Receptions and mixers' },
      { es: 'Cenas de gala y premiaciones', en: 'Gala dinners and awards nights' },
      { es: 'Celebraciones del 5 de mayo y 16 de septiembre', en: 'Cinco de Mayo and Mexican Independence celebrations' },
    ],
  },
  {
    slug: 'memorial',
    title: { es: 'Homenajes y funerales', en: 'Memorials & funerals' },
    summary: {
      es: 'Un homenaje sereno con Amor Eterno, Las Golondrinas y las canciones que pida la familia.',
      en: 'A calm tribute with Amor Eterno, Las Golondrinas, and the songs the family requests.',
    },
    occasions: [
      { es: 'Servicios en capilla o panteón', en: 'Chapel or graveside services' },
      { es: 'Misas de cuerpo presente', en: 'Funeral masses' },
      { es: 'Aniversarios luctuosos', en: 'Memorial anniversaries' },
    ],
  },
]
```

- [ ] **Step 5: Implement `src/lib/data/faq.ts`**

```ts
export type FaqItem = { q: { es: string; en: string }; a: { es: string; en: string } }

export const FAQ: FaqItem[] = [
  {
    q: { es: '¿Cómo funcionan los precios?', en: 'How does pricing work?' },
    a: {
      es: 'De lunes a viernes, dentro de 25 millas del 90011, ofrecemos un paquete de 7 canciones por $380 o $500 por hora sin mínimo de horas. Sábados y domingos son $550 por hora, comenzando a las 3:00 PM o más tarde.',
      en: 'Monday to Friday, within 25 miles of 90011, we offer a 7-song package for $380 or $500 per hour with no hour minimum. Saturday and Sunday are $550 per hour, starting at 3:00 PM or later.',
    },
  },
  {
    q: { es: '¿A qué áreas van?', en: 'What areas do you serve?' },
    a: {
      es: 'Damos cotización instantánea únicamente dentro del Condado de Los Ángeles. Para eventos fuera del condado o del estado, contáctenos y lo revisamos caso por caso.',
      en: 'We give instant quotes for Los Angeles County only. For events outside the county or state, contact us and we’ll review it case by case.',
    },
  },
  {
    q: { es: '¿Con cuánta anticipación debo reservar?', en: 'How far in advance should I book?' },
    a: {
      es: 'Entre más pronto mejor, sobre todo para fines de semana. Se puede reservar con menos de 24 horas de anticipación. Con menos de 3 horas de anticipación hay que llamarnos por teléfono.',
      en: 'The sooner the better, especially for weekends. Bookings under 24 hours out are allowed. Under 3 hours before the start you need to call us.',
    },
  },
  {
    q: { es: '¿Cómo aparto la fecha?', en: 'How do I hold the date?' },
    a: {
      es: 'Un depósito de $100 aparta su fecha. El saldo se paga después, directamente al mariachi el día del evento.',
      en: 'A $100 deposit holds your date. The balance is paid later, directly to the band on the event day.',
    },
  },
  {
    q: { es: '¿Cuál es la política de cancelación?', en: 'What is the cancellation policy?' },
    a: {
      es: 'El depósito es reembolsable solo si cancela 7 días o más antes del evento. Dentro de los 7 días previos, el depósito no es reembolsable.',
      en: 'The deposit is refundable only if you cancel 7 or more days before the event. Within 7 days, the deposit is non-refundable.',
    },
  },
  {
    q: { es: '¿Por qué los sábados empiezan a las 3 PM?', en: 'Why do Saturdays start at 3 PM?' },
    a: {
      es: 'Los sábados y domingos tomamos eventos que comienzan a las 3:00 PM o más tarde. Para eventos más temprano en fin de semana, contáctenos.',
      en: 'On Saturdays and Sundays we take events that start at 3:00 PM or later. For earlier weekend events, contact us.',
    },
  },
  {
    q: { es: '¿Qué incluye el paquete de 7 canciones?', en: 'What does the 7-song package include?' },
    a: {
      es: 'Es una presentación de siete canciones a elección, disponible de lunes a viernes dentro de 25 millas del 90011. Es ideal para serenatas y celebraciones cortas.',
      en: 'It is a set of seven songs of your choice, available Monday to Friday within 25 miles of 90011. It is ideal for serenatas and short celebrations.',
    },
  },
  {
    q: { es: '¿Cómo se paga?', en: 'How do I pay?' },
    a: {
      es: 'Pronto aceptaremos tarjeta, Zelle, Venmo y PayPal en línea. Por ahora, escríbanos por WhatsApp o llámenos y coordinamos el depósito.',
      en: 'We will soon accept card, Zelle, Venmo, and PayPal online. For now, message us on WhatsApp or call and we’ll arrange the deposit.',
    },
  },
  {
    q: { es: '¿Puedo pedir canciones específicas?', en: 'Can I request specific songs?' },
    a: {
      es: 'Sí. Envíe su lista al reservar y la preparamos. Tenemos más de cuarenta clásicos en el repertorio y aprendemos pedidos especiales con aviso.',
      en: 'Yes. Send your list when you book and we’ll prepare it. We carry more than forty classics and learn special requests with notice.',
    },
  },
]
```

- [ ] **Step 6: Implement `src/lib/data/repertoire.ts`**

```ts
export type Song = { title: string; genre: string; composer?: string }

export const REPERTOIRE: Song[] = [
  { title: 'El Rey', genre: 'Ranchera', composer: 'José Alfredo Jiménez' },
  { title: 'Volver, Volver', genre: 'Ranchera', composer: 'Fernando Z. Maldonado' },
  { title: 'El Son de la Negra', genre: 'Son Jalisciense' },
  { title: 'La Bikina', genre: 'Balada ranchera', composer: 'Rubén Fuentes' },
  { title: 'Cielito Lindo', genre: 'Son', composer: 'Quirino Mendoza y Cortés' },
  { title: 'Guadalajara', genre: 'Son', composer: 'Pepe Guízar' },
  { title: 'Amor Eterno', genre: 'Balada ranchera', composer: 'Juan Gabriel' },
  { title: 'Si Nos Dejan', genre: 'Ranchera', composer: 'José Alfredo Jiménez' },
  { title: 'Ella', genre: 'Ranchera', composer: 'José Alfredo Jiménez' },
  { title: 'Cucurrucucú Paloma', genre: 'Huapango', composer: 'Tomás Méndez' },
  { title: 'La Malagueña', genre: 'Son Huasteco', composer: 'Elpidio Ramírez / Pedro Galindo' },
  { title: 'México Lindo y Querido', genre: 'Ranchera', composer: 'Chucho Monge' },
  { title: 'El Mariachi Loco', genre: 'Cumbia' },
  { title: 'Las Mañanitas', genre: 'Tradicional' },
  { title: 'Hermoso Cariño', genre: 'Ranchera', composer: 'Rubén Fuentes / Rafael Cárdenas' },
  { title: 'Que Bonita es Mi Tierra', genre: 'Ranchera' },
  { title: 'Camino de Guanajuato', genre: 'Ranchera', composer: 'José Alfredo Jiménez' },
  { title: 'El Cascabel', genre: 'Son Jarocho' },
  { title: 'La Negra', genre: 'Son Jalisciense' },
  { title: 'Serenata Huasteca', genre: 'Huapango', composer: 'José Alfredo Jiménez' },
  { title: 'Paloma Querida', genre: 'Ranchera', composer: 'José Alfredo Jiménez' },
  { title: 'Que Rechula es Puebla', genre: 'Ranchera' },
  { title: 'La Media Vuelta', genre: 'Ranchera', composer: 'José Alfredo Jiménez' },
  { title: 'Un Mundo Raro', genre: 'Ranchera', composer: 'José Alfredo Jiménez' },
  { title: 'El Herradero', genre: 'Son Jalisciense', composer: 'Rubén Fuentes' },
  { title: 'La Culebra', genre: 'Son Jalisciense' },
  { title: 'Tú, Sólo Tú', genre: 'Ranchera', composer: 'Felipe Valdés Leal' },
  { title: 'Sabor a Mí', genre: 'Bolero', composer: 'Álvaro Carrillo' },
  { title: 'Bésame Mucho', genre: 'Bolero', composer: 'Consuelo Velázquez' },
  { title: 'Solamente Una Vez', genre: 'Bolero', composer: 'Agustín Lara' },
  { title: 'La Barca', genre: 'Bolero', composer: 'Roberto Cantoral' },
  { title: 'Sombras', genre: 'Bolero', composer: 'Rosario Sansores / Carlos Brito' },
  { title: 'Échame a Mí la Culpa', genre: 'Ranchera', composer: 'Ferrusquilla' },
  { title: 'Fallaste Corazón', genre: 'Ranchera', composer: 'Cuco Sánchez' },
  { title: 'Cruz de Olvido', genre: 'Ranchera', composer: 'Juan Zaizar' },
  { title: 'Las Golondrinas', genre: 'Tradicional', composer: 'Narciso Serradell' },
  { title: 'Te Vas Ángel Mío', genre: 'Ranchera', composer: 'Pepe Albarrán' },
  { title: 'Gema', genre: 'Bolero', composer: 'Guillermo González Betancourt' },
  { title: 'Mi Ranchito', genre: 'Ranchera', composer: 'Felipe Valdés Leal' },
  { title: 'El Pastor', genre: 'Son Jalisciense' },
  { title: 'Jarabe Tapatío', genre: 'Son Jalisciense' },
  { title: 'De Colores', genre: 'Tradicional' },
  { title: 'Júrame', genre: 'Bolero', composer: 'María Grever' },
  { title: 'Payaso', genre: 'Ranchera', composer: 'Fernando Z. Maldonado' },
]
```

- [ ] **Step 7: Run — verify pass** → `pnpm test tests/unit/data.test.ts` (all assertions green;
  `SERVICES.length === 6`, `FAQ.length === 9`, `REPERTOIRE.length === 44`). Adjust the test's
  `toBeGreaterThanOrEqual` bounds if you add/remove entries.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add pricing, services, FAQ, and repertoire data modules"
```

---

## Task 11: Layout shell — header, footer, mobile tab bar, skip link, locale switch

**Files:**
- Create: `src/components/layout/site-header.tsx`, `site-footer.tsx`, `mobile-tab-bar.tsx`,
  `skip-link.tsx`, `locale-switch.tsx`, `src/components/ui/section.tsx`, `src/components/ui/button.tsx`
- Modify: `src/app/[lang]/layout.tsx` (render shell around `{children}`)
- Modify: `src/app/[lang]/page.tsx` (temp: render an `<h1>` inside `<main id="main">`)
- Create: `tests/e2e/shell.spec.ts`

**Interfaces:**
- Consumes: `getDictionary`, `localizedPath`, `siteConfig`, `Locale`, `lucide-react`.
- Produces: `<SiteHeader locale dict />`, `<SiteFooter locale dict />`, `<MobileTabBar locale dict />`,
  `<SkipLink label />`, `<LocaleSwitch locale />` (client), `<Section>`, `<Button>`.
  `<main id="main">` is rendered **by each page** (not the layout) so pages own their `<h1>`.
  The layout reads no request-time APIs, so every page stays statically generated.

- [ ] **Step 1: Build the primitives**

```tsx
// src/components/ui/section.tsx
import type { ReactNode } from 'react'
export function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`w-full py-16 md:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">{children}</div>
    </section>
  )
}
```

```tsx
// src/components/ui/button.tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'ghost'
const styles: Record<Variant, string> = {
  primary:
    'bg-primary-container text-on-primary hover:bg-burnished-gold font-semibold uppercase tracking-wider',
  ghost: 'bg-charcoal-elevated text-crema-white hover:bg-charcoal-border',
}

export function Button({
  href, children, variant = 'primary', className = '',
}: { href: string; children: ReactNode; variant?: Variant; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm transition-colors ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}
```

- [ ] **Step 2: Build `skip-link.tsx`**

```tsx
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-burnished-gold focus:px-4 focus:py-2 focus:text-on-primary"
    >
      {label}
    </a>
  )
}
```

- [ ] **Step 3: Build `locale-switch.tsx` (client component)**

`proxy.ts` uses a **rewrite**, so the browser URL stays `/services` (or `/en/services`) and
`usePathname()` returns that original path — no server header needed, the layout stays fully static.

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n/locales'

export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() // "/services" or "/en/services"
  const bare = pathname.replace(/^\/en(?=\/|$)/, '') || '/'
  return (
    <div className="flex items-center gap-1 text-xs uppercase">
      {LOCALES.map((l) => {
        const href = l === DEFAULT_LOCALE ? bare : `/${l}${bare === '/' ? '' : bare}`
        return (
          <Link
            key={l}
            href={href}
            aria-current={l === locale ? 'page' : undefined}
            className={l === locale ? 'font-bold text-burnished-gold' : 'text-muted-silver'}
          >
            {l}
          </Link>
        )
      })}
    </div>
  )
}
```

> This is the only client component in the shell. It is tiny; keep it that way.

- [ ] **Step 4: Build `site-header.tsx`**

Server component. Fixed top bar: logo/wordmark (text for now — `siteConfig.name` in Playfair gold),
desktop nav (`nav.home`→`/`, `nav.musicians`→`/about`, `nav.repertoire`→`/repertoire`,
`nav.media`→`/media`, `nav.guides`→`/guides`, `nav.quote`→`/book`) via `localizedPath(path, locale)`,
a `tel:` link with the phone, a primary `Button` to `/book`, and `<LocaleSwitch>`. Use a
`<nav aria-label>`. Hide desktop nav under `xl`, show a `<details>`-based disclosure menu on mobile
(no JS).

- [ ] **Step 5: Build `site-footer.tsx`**

Server component. Columns: brand + `footer.tagline`; nav links; `footer.areasHeading` with the
first ~8 city links (`localizedPath('/mariachi/' + slug, locale)`); `footer.contactHeading` with
`tel:`, `mailto:`, WhatsApp. Bottom row: `© {year} {name}. {footer.rights}` + links to `/terms`,
`/privacy`.

- [ ] **Step 6: Build `mobile-tab-bar.tsx`**

Fixed bottom bar, `xl:hidden`, 5 items (Home, Musicians, Media, Guides, Book) with lucide icons +
labels; plus sticky Call / Get Quote buttons. `<nav aria-label>`.

- [ ] **Step 7: Wire the shell into `[lang]/layout.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n/locales'
// ...
const { lang } = await params
if (!isLocale(lang)) notFound()
const dict = await getDictionary(lang)
// inside <body>:
<SkipLink label={dict.common.skipToContent} />
<SiteHeader locale={lang} dict={dict} />
{children}
<SiteFooter locale={lang} dict={dict} />
<MobileTabBar locale={lang} dict={dict} />
```

- [ ] **Step 8: Update temp home page to own its `<main>`**

```tsx
// src/app/[lang]/page.tsx
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
```

- [ ] **Step 9: Write the e2e shell test**

```ts
// tests/e2e/shell.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

for (const { path, lang } of [
  { path: '/', lang: 'es' },
  { path: '/en', lang: 'en' },
]) {
  test(`shell renders + a11y (${path})`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.locator('#main h1')).toBeVisible()
    await checkA11y(page)
  })
}

test('locale switch keeps the current path', async ({ page }) => {
  await page.goto('/repertoire') // still temp-routed, but path is preserved
  await page.getByRole('link', { name: 'en', exact: true }).click()
  await expect(page).toHaveURL(/\/en\/repertoire$/)
})
```

- [ ] **Step 10: Run**

Run: `pnpm test:e2e tests/e2e/shell.spec.ts`
Expected: PASS. Fix any axe violations (missing `aria-label` on the two `<nav>`s, low-contrast text —
never use `text-burnished-gold` on `bg-surface` for anything smaller than a heading).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: build site shell — header, footer, mobile tab bar, locale switch"
```

---

## Task 12: Home page

**Files:**
- Modify: `src/app/[lang]/page.tsx`
- Create: `src/components/home/*` as needed (hero, service-area-grid, service-teaser, cta-band)
- Create: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `getDictionary`, `buildMetadata`, `localBusiness`, `<JsonLd>`, `CITIES`, `SERVICES`,
  `siteConfig`, `PRICING`.
- Produces: the real home route with `generateMetadata`, an `<h1>`, `LocalBusiness`+`MusicGroup`
  JSON-LD, and internal links to `/book`, `/services`, `/repertoire`, `/media`, `/guides`, and the
  city pages.

- [ ] **Step 1: Add `generateMetadata`**

```tsx
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : 'es'
  const t = locale === 'es'
    ? { title: 'Mariachi El Cuis — Mariachi en Los Ángeles', description: 'Mariachi tradicional para bodas, quinceañeras y serenatas en el Condado de Los Ángeles. Cotización y reserva directa.' }
    : { title: 'Mariachi El Cuis — Los Angeles Mariachi Band', description: 'Traditional mariachi for weddings, quinceañeras, and serenatas across Los Angeles County. Direct quotes and booking.' }
  return buildMetadata({ locale, path: '/', title: t.title, description: t.description, titleAbsolute: true })
}
```

- [ ] **Step 2: Build the page body**

Sections (use `<Section>`):
1. **Hero** — `<h1>`, subhead, primary `Button`→`/book`, ghost `Button`→`tel:`, WhatsApp link.
   Background: solid brand color + a CSS gradient (no external image in Phase 1; a real photo slot is
   marked `{/* TODO: owner hero image */}`).
2. **Quick availability strip** — static: "Mon–Fri, Sat & Sun 3 PM+" + `Button`→`/book`. No form
   (form is Phase 2).
3. **Service-area grid** — map over `CITIES`, each a `<Link>` to `/mariachi/{slug}` showing name +
   first neighborhood + approx distance (`~{cityDistanceMi(c)} mi`, labelled "approx.").
4. **Services teaser** — map over `SERVICES` (title + summary), link to `/services`.
5. **Repertoire teaser** — 6 song names + link to `/repertoire`.
6. **Guides teaser** — placeholder list, link to `/guides` (filled after Task 17).
7. **CTA band** — phone + WhatsApp + `/book`.

Render `<JsonLd data={localBusiness({ areaServed: CITIES.map(c => c.name) })} />` once.

- [ ] **Step 3: Write e2e test**

```ts
// tests/e2e/home.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('home: metadata, h1, json-ld, a11y', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Mariachi El Cuis/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://mariachielcuis.com/')
  await expect(page.locator('link[hreflang="x-default"]')).toHaveCount(1)
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://mariachielcuis.com/en')
  await expect(page.locator('#main h1')).toContainText('Mariachi El Cuis')
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(JSON.parse(ld!)['@type']).toContain('LocalBusiness')
  await checkA11y(page)
})

test('home links to key routes', async ({ page }) => {
  await page.goto('/')
  for (const p of ['/book', '/services', '/repertoire']) {
    await expect(page.locator(`a[href="${p}"]`).first()).toBeVisible()
  }
  await expect(page.locator('a[href^="/mariachi/"]').first()).toBeVisible()
})
```

> The canonical-host assertions assume `NEXT_PUBLIC_SITE_URL=https://mariachielcuis.com` is set for
> the e2e `webServer` — added to `playwright.config.ts` `webServer.env` in Task 22 Step 2.

- [ ] **Step 4: Run**

Run: `pnpm test:e2e tests/e2e/home.spec.ts` → PASS. Run Lighthouse locally on `/` (Task 22 wires
CI): `npx lighthouse http://localhost:3000/ --only-categories=performance,accessibility,seo,best-practices --view` — expect ≥95/100/100/100. Fix regressions (unsized images, missing `lang`, etc.).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: build home page with LocalBusiness JSON-LD and internal linking"
```

---

## Task 13: Services & Pricing page + FAQ page

**Files:**
- Create: `src/app/[lang]/services/page.tsx`, `src/app/[lang]/faq/page.tsx`
- Create: `tests/e2e/services.spec.ts`

**Interfaces:**
- Consumes: `SERVICES`, `PRICING`, `pricingLines`, `FAQ`, `buildMetadata`, `service`, `faqPage`,
  `breadcrumb`, `<JsonLd>`.
- Produces:
  - `/services` (+ `/en/services`) with `Service` and `FAQPage` + `BreadcrumbList` JSON-LD, and the
    exact spec §1 pricing rules as visible content.
  - `/faq` (+ `/en/faq`) — the full `FAQ` list with `FAQPage` + `BreadcrumbList` JSON-LD.

- [ ] **Step 1: Page skeleton + metadata**

`generateStaticParams` → `[{lang:'es'},{lang:'en'}]`; `dynamicParams = false`; `generateMetadata`
via `buildMetadata({ locale, path: '/services', title, description })`.

- [ ] **Step 2: Body**

- `<main id="main">`, `<h1>` (es: "Servicios y precios" / en: "Services & pricing").
- Services list from `SERVICES`.
- **Pricing block** rendered from `pricingLines(locale)` as a `<ul>`, plus an `Offer`-style summary
  table: 7-song $380, weekday $500/hr, weekend $550/hr, deposit $100.
- A short FAQ section reusing the first ~5 `FAQ` items.
- JSON-LD: `service({ locale, url })`, `faqPage(FAQ.slice(0,5).map(f => ({ q: f.q[locale], a: f.a[locale] })))`,
  `breadcrumb([{home},{services}])`.

- [ ] **Step 3: Build `faq/page.tsx`**

`generateStaticParams` → locales; `dynamicParams = false`; `generateMetadata` via
`buildMetadata({ locale, path: '/faq', title: locale==='es'?'Preguntas frecuentes':'Frequently asked questions', description })`.
Body: `<main id="main">`, `<h1>`, then `FAQ.map` rendered as a `<dl>` (`<dt>` = `q[locale]`,
`<dd>` = `a[locale]`) or an accessible `<details>`/`<summary>` list. JSON-LD:
`faqPage(FAQ.map(f => ({ q: f.q[locale], a: f.a[locale] })))` + `breadcrumb([home, faq])`.

- [ ] **Step 4: e2e test**

```ts
// tests/e2e/services.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('services page: pricing copy + schema + a11y', async ({ page }) => {
  await page.goto('/en/services')
  await expect(page.locator('#main h1')).toBeVisible()
  await expect(page.getByText('$380')).toBeVisible()
  await expect(page.getByText('$500')).toBeVisible()
  await expect(page.getByText('$550')).toBeVisible()
  await expect(page.getByText(/7 or more days/i)).toBeVisible()
  const types = await page.locator('script[type="application/ld+json"]').allTextContents()
  const parsed = types.map((t) => JSON.parse(t)['@type'])
  expect(parsed).toContain('Service')
  expect(parsed).toContain('FAQPage')
  expect(parsed).toContain('BreadcrumbList')
  await checkA11y(page)
})
```

- [ ] **Step 4: Run** → `pnpm test:e2e tests/e2e/services.spec.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: build services & pricing page with Service/FAQ/Breadcrumb schema"
```

---

## Task 14: Repertoire page + client filter island

**Files:**
- Create: `src/app/[lang]/repertoire/page.tsx`, `src/app/[lang]/repertoire/repertoire-filter.tsx`
- Create: `tests/e2e/repertoire.spec.ts`

**Interfaces:**
- Consumes: `REPERTOIRE`, `buildMetadata`, `breadcrumb`, `<JsonLd>`, `getDictionary`.
- Produces: `/repertoire` — server-rendered full list (crawlable) + a `'use client'` filter that
  hides non-matching `<li>`s. Filter input is labelled; list has an `aria-live` count.

- [ ] **Step 1: Server page**

Renders `<h1>`, intro, and `<RepertoireFilter songs={REPERTOIRE} labels={{...}} />`. Metadata +
breadcrumb JSON-LD.

- [ ] **Step 2: Client filter**

```tsx
'use client'
import { useMemo, useState } from 'react'

type Song = { title: string; genre: string; composer?: string }

export function RepertoireFilter({
  songs, labels,
}: { songs: Song[]; labels: { search: string; results: string } }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return songs
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(n) ||
        s.genre.toLowerCase().includes(n) ||
        s.composer?.toLowerCase().includes(n),
    )
  }, [q, songs])

  return (
    <div>
      <label className="block">
        <span className="mb-1 block text-sm text-on-surface-variant">{labels.search}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded bg-charcoal-elevated px-4 py-2 text-crema-white"
        />
      </label>
      <p className="mt-2 text-sm text-muted-silver" aria-live="polite">
        {filtered.length} {labels.results}
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <li key={s.title} className="rounded bg-charcoal-surface p-4">
            <span className="block font-semibold text-crema-white">{s.title}</span>
            <span className="block text-sm text-muted-silver">
              {s.genre}
              {s.composer ? ` · ${s.composer}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: e2e test**

```ts
// tests/e2e/repertoire.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('repertoire filter narrows the list and stays accessible', async ({ page }) => {
  await page.goto('/repertoire')
  const items = page.locator('#main ul li')
  const total = await items.count()
  expect(total).toBeGreaterThanOrEqual(40)
  await page.getByRole('searchbox').fill('bolero')
  await expect(items).not.toHaveCount(total)
  await checkA11y(page)
})

test('full list is in server HTML (crawlable)', async ({ request }) => {
  const html = await (await request.get('/repertoire')).text()
  expect(html).toContain('El Rey')
})
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: build repertoire page with crawlable list + client filter"
```

---

## Task 15: About + Media pages

**Files:**
- Create: `src/app/[lang]/about/page.tsx`, `src/app/[lang]/media/page.tsx`,
  `src/components/media/video-facade.tsx`
- Create: `tests/e2e/about-media.spec.ts`

**Interfaces:**
- Consumes: `buildMetadata`, `breadcrumb`, `<JsonLd>`, `getDictionary`, `siteConfig`.
- Produces: `/about` and `/media` routes. `<VideoFacade videoId title />` (client) renders a
  thumbnail button that swaps in a YouTube `<iframe>` on click (no iframe until interaction).

- [ ] **Step 1: `video-facade.tsx`**

```tsx
'use client'
import { useState } from 'react'

export function VideoFacade({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false)
  if (playing) {
    return (
      <iframe
        className="aspect-video w-full rounded-xl"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerated-download; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative flex aspect-video w-full items-center justify-center rounded-xl bg-charcoal-elevated"
      aria-label={`Play: ${title}`}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full rounded-xl object-cover opacity-70"
        loading="lazy"
      />
      <span className="relative rounded-full bg-burnished-gold px-5 py-3 font-semibold text-on-primary">
        ▶
      </span>
    </button>
  )
}
```

> CSP note (Task 21): allow `frame-src https://www.youtube-nocookie.com` and
> `img-src https://i.ytimg.com`.

- [ ] **Step 2: `about/page.tsx`**

`<h1>`, placeholder bio copy ("Somos un mariachi con base en el 90011…" — no fabricated names,
awards, or years). A clearly-marked `{/* TODO: owner — musician bios + photos */}` block. Contact
CTA. Metadata + breadcrumb JSON-LD.

- [ ] **Step 3: `media/page.tsx`**

`<h1>`, a grid of `<VideoFacade>` with a `MEDIA` array (empty placeholder array + copy "Coming
soon — follow us on YouTube/Instagram" links from `siteConfig` if set; `siteConfig` has no social
yet, so add optional `youtubeUrl`/`instagramUrl` fields defaulting to `undefined` and only render
links when present). Metadata + breadcrumb JSON-LD.

- [ ] **Step 4: e2e test**

```ts
// tests/e2e/about-media.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

for (const path of ['/about', '/media', '/en/about', '/en/media']) {
  test(`${path} renders + a11y`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('#main h1')).toBeVisible()
    await checkA11y(page)
  })
}

test('media page ships no youtube iframe before interaction', async ({ request }) => {
  const html = await (await request.get('/media')).text()
  expect(html).not.toContain('youtube-nocookie.com/embed')
})
```

- [ ] **Step 5: Run** → PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: build about + media pages with click-to-load video facade"
```

---

## Task 16: Contact page + server action + Resend

**Files:**
- Create: `src/app/[lang]/contact/page.tsx`, `src/app/[lang]/contact/contact-form.tsx`,
  `src/app/actions/contact.ts`, `src/lib/contact/schema.ts`
- Create: `tests/unit/contact-schema.test.ts`, `tests/e2e/contact.spec.ts`
- Modify: `.env.example` (already has the keys)

**Interfaces:**
- Consumes: `zod`, `resend`, `env`, `features`, `siteConfig`.
- Produces:
  - `contactSchema` (zod): `name` (2–100), `email` (email), `phone` (optional, 7–20), `message`
    (10–2000), `website` (honeypot — must be empty), `locale` (`es`|`en`).
  - `submitContact(prev, formData): Promise<{ ok: boolean; error?: 'validation' | 'not_configured' | 'send_failed'; fieldErrors?: Record<string,string> }>` — `'use server'`.
  - `<ContactForm dict locale />` (client) using `useActionState(submitContact, { ok: false })`.

- [ ] **Step 1: Write failing schema test**

```ts
// tests/unit/contact-schema.test.ts
import { expect, test } from 'vitest'
import { contactSchema } from '@/lib/contact/schema'

test('accepts a valid submission', () => {
  const r = contactSchema.safeParse({
    name: 'Ana López', email: 'ana@example.com', message: 'Necesito mariachi para una boda.',
    website: '', locale: 'es',
  })
  expect(r.success).toBe(true)
})

test('rejects short message', () => {
  const r = contactSchema.safeParse({ name: 'Ana', email: 'a@b.co', message: 'hi', website: '', locale: 'es' })
  expect(r.success).toBe(false)
})

test('rejects filled honeypot', () => {
  const r = contactSchema.safeParse({
    name: 'Ana', email: 'a@b.co', message: 'a valid long message here', website: 'spam', locale: 'en',
  })
  expect(r.success).toBe(false)
})
```

- [ ] **Step 2: Run — verify fail**

- [ ] **Step 3: Implement `src/lib/contact/schema.ts`**

```ts
import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(20).optional().or(z.literal('')),
  message: z.string().trim().min(10).max(2000),
  website: z.literal(''), // honeypot: real users never fill this
  locale: z.enum(['es', 'en']),
})

export type ContactInput = z.infer<typeof contactSchema>
```

- [ ] **Step 4: Run — verify pass**

- [ ] **Step 5: Implement `src/app/actions/contact.ts`**

```ts
'use server'

import { Resend } from 'resend'
import { contactSchema } from '@/lib/contact/schema'
import { env, features } from '@/lib/env'
import { siteConfig } from '@/lib/config/site'

type Result = {
  ok: boolean
  error?: 'validation' | 'not_configured' | 'send_failed'
  fieldErrors?: Record<string, string>
}

export async function submitContact(_prev: Result, formData: FormData): Promise<Result> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    message: formData.get('message'),
    website: formData.get('website') ?? '',
    locale: formData.get('locale'),
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message
    return { ok: false, error: 'validation', fieldErrors }
  }

  if (!features.email) {
    // No email provider configured — the UI falls back to phone/WhatsApp.
    return { ok: false, error: 'not_configured' }
  }

  const { name, email, phone, message } = parsed.data
  try {
    const resend = new Resend(env.RESEND_API_KEY)
    await resend.emails.send({
      from: `${siteConfig.name} <noreply@${new URL(siteConfig.url).hostname}>`,
      to: env.CONTACT_TO_EMAIL!,
      replyTo: email,
      subject: `Website contact — ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || '—'}\n\n${message}`,
    })
    return { ok: true }
  } catch {
    return { ok: false, error: 'send_failed' }
  }
}
```

- [ ] **Step 6: Implement `contact-form.tsx` (client)**

`useActionState(submitContact, { ok: false })`. Fields: name, email, phone, message, hidden
`website` honeypot (visually hidden, `tabIndex={-1}`, `autoComplete="off"`), hidden `locale`. Show
`fieldErrors` inline with `aria-describedby`. On `ok` → success message. On `not_configured` /
`send_failed` → "Sorry — please call {phone} or message us on WhatsApp" with links. Submit button
uses `useFormStatus`/`pending`.

- [ ] **Step 7: Implement `contact/page.tsx`**

`<h1>`, short intro, `<ContactForm>`, plus always-visible phone + WhatsApp + email. Metadata +
breadcrumb JSON-LD. `buildMetadata({ ..., path: '/contact' })`.

- [ ] **Step 8: e2e test**

```ts
// tests/e2e/contact.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('contact form validates and is accessible', async ({ page }) => {
  await page.goto('/en/contact')
  await expect(page.locator('#main h1')).toBeVisible()
  await checkA11y(page)
  await page.getByLabel(/message/i).fill('hi')
  await page.getByRole('button', { name: /send/i }).click()
  await expect(page.getByText(/at least 10/i)).toBeVisible()
})

test('contact page always shows phone + whatsapp fallback', async ({ page }) => {
  await page.goto('/contact')
  await expect(page.locator('a[href="tel:+16269220091"]').first()).toBeVisible()
  await expect(page.locator('a[href="https://wa.me/16269220091"]').first()).toBeVisible()
})
```

> The submit-success path needs `RESEND_API_KEY`/`CONTACT_TO_EMAIL`; leave those unset in CI so the
> action returns `not_configured` and assert the fallback message instead. Do **not** hit Resend in
> tests.

- [ ] **Step 9: Run** → `pnpm test tests/unit/contact-schema.test.ts && pnpm test:e2e tests/e2e/contact.spec.ts` → PASS.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: build contact page with validated server action + Resend + fallback"
```

---

## Task 17: Guides — MDX setup + listing + articles

**Files:**
- Create: `mdx-components.tsx` (project root), `src/lib/content/guides.ts`,
  `src/app/[lang]/guides/page.tsx`, `src/app/[lang]/guides/[slug]/page.tsx`
- Create: `src/content/guides/{slug}.{es,en}.mdx` — 4 slugs × 2 locales = 8 files
- Create: `tests/unit/guides.test.ts`, `tests/e2e/guides.spec.ts`

**Interfaces:**
- Consumes: `@next/mdx`, `buildMetadata`, `article`, `breadcrumb`, `<JsonLd>`.
- Produces:
  - `GUIDES: { slug: string; datePublished: string; dateModified: string; title: {es;en}; description: {es;en} }[]` (4 entries)
  - `getGuideContent(slug, locale): Promise<{ default: React.ComponentType }>` (dynamic MDX import)
  - Routes `/guides` and `/guides/[slug]` for both locales.

Slugs + topics (from spec §4):
1. `mariachi-cost-los-angeles` — "How much does a mariachi cost in Los Angeles?"
2. `quinceanera-song-guide` — "Quinceañera songs: the vals, the surprise dance, the classics"
3. `how-booking-works` — "How booking Mariachi El Cuis works, step by step"
4. `wedding-mariachi-timeline` — "Where a mariachi fits in your wedding day timeline"

- [ ] **Step 1: `mdx-components.tsx`**

```tsx
import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (p) => <h1 className="font-display text-4xl text-crema-white" {...p} />,
    h2: (p) => <h2 className="mt-10 font-display text-2xl text-crema-white" {...p} />,
    p: (p) => <p className="mt-4 text-on-surface-variant" {...p} />,
    ul: (p) => <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant" {...p} />,
    a: (p) => <a className="text-burnished-gold underline" {...p} />,
    ...components,
  }
}
```

- [ ] **Step 2: `src/lib/content/guides.ts`**

```ts
import type { Locale } from '@/lib/i18n/locales'

export const GUIDES = [
  {
    slug: 'mariachi-cost-los-angeles',
    datePublished: '2026-09-10',
    dateModified: '2026-09-10',
    title: {
      es: '¿Cuánto cuesta un mariachi en Los Ángeles?',
      en: 'How much does a mariachi cost in Los Angeles?',
    },
    description: {
      es: 'Precios reales por hora y por paquete, mínimos por distancia y cómo funciona el depósito.',
      en: 'Real hourly and package pricing, distance minimums, and how the deposit works.',
    },
  },
  {
    slug: 'quinceanera-song-guide',
    datePublished: '2026-09-10',
    dateModified: '2026-09-10',
    title: {
      es: 'Guía de canciones para quinceañera',
      en: 'Quinceañera song guide',
    },
    description: {
      es: 'El vals, el baile sorpresa y las rancheras que no pueden faltar.',
      en: 'The vals, the surprise dance, and the rancheras you cannot skip.',
    },
  },
  {
    slug: 'how-booking-works',
    datePublished: '2026-09-10',
    dateModified: '2026-09-10',
    title: { es: 'Cómo funciona la reserva', en: 'How booking works' },
    description: {
      es: 'Del primer mensaje al depósito de $100 y la confirmación de tu fecha.',
      en: 'From first message to the $100 deposit and your confirmed date.',
    },
  },
  {
    slug: 'wedding-mariachi-timeline',
    datePublished: '2026-09-10',
    dateModified: '2026-09-10',
    title: {
      es: 'El mariachi en la línea de tiempo de tu boda',
      en: 'Where a mariachi fits in your wedding timeline',
    },
    description: {
      es: 'Ceremonia, hora del coctel y entrada a la recepción: cuándo suena el mariachi.',
      en: 'Ceremony, cocktail hour, and reception entrance: when the mariachi plays.',
    },
  },
] as const

export type GuideSlug = (typeof GUIDES)[number]['slug']

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug)
}

// Explicit map (not a computed dynamic import) so Turbopack can resolve every chunk.
type GuideModule = { default: (props: Record<string, unknown>) => unknown }
const content: Record<GuideSlug, Record<Locale, () => Promise<GuideModule>>> = {
  'mariachi-cost-los-angeles': {
    es: () => import('@/content/guides/mariachi-cost-los-angeles.es.mdx'),
    en: () => import('@/content/guides/mariachi-cost-los-angeles.en.mdx'),
  },
  'quinceanera-song-guide': {
    es: () => import('@/content/guides/quinceanera-song-guide.es.mdx'),
    en: () => import('@/content/guides/quinceanera-song-guide.en.mdx'),
  },
  'how-booking-works': {
    es: () => import('@/content/guides/how-booking-works.es.mdx'),
    en: () => import('@/content/guides/how-booking-works.en.mdx'),
  },
  'wedding-mariachi-timeline': {
    es: () => import('@/content/guides/wedding-mariachi-timeline.es.mdx'),
    en: () => import('@/content/guides/wedding-mariachi-timeline.en.mdx'),
  },
}

export function getGuideContent(slug: GuideSlug, locale: Locale): Promise<GuideModule> {
  return content[slug][locale]()
}
```

- [ ] **Step 3: Write the 8 MDX files**

Drop these in verbatim (English links use `/en/...`, Spanish links use `/...`). Keep the facts
exactly as written — they must match the Services page and spec §1.

**`src/content/guides/mariachi-cost-los-angeles.en.mdx`**

```mdx
# How much does a mariachi cost in Los Angeles?

Prices for a full mariachi in Los Angeles usually run by the hour, and the total depends on the day
of the week, how long you want the group to play, and how far the event is from the band's base.

## Mariachi El Cuis pricing

Our base is ZIP 90011 in South Los Angeles, and we give instant quotes for Los Angeles County only.

- **Monday to Friday, within 25 miles of 90011:** a 7-song package for **$380 flat**, or **$500 per
  hour** with no hour minimum.
- **Saturday and Sunday:** **$550 per hour**, starting at 3:00 PM or later.
- **Minimum hours by distance:** 2 hours within 15 miles, 3 hours within 30 miles, 4 hours within 50
  miles, then one more hour for every additional 20 miles.

Events run between 7:00 AM and midnight, and there is no maximum length.

## The deposit and balance

A **$100 deposit** reserves your date. The balance is paid later, directly to the band on the day of
the event. Card, Zelle, Venmo, and PayPal checkout are coming online soon; for now we arrange the
deposit by phone or [WhatsApp](https://wa.me/16269220091).

## Cancellation

The deposit is refundable only if you cancel **7 or more days** before the event. Within 7 days it is
non-refundable.

## Get your exact price

See the full breakdown on our [services page](/en/services), or [contact us](/en/contact) with your
date, start time, and city and we'll send your exact price the same day.
```

**`src/content/guides/mariachi-cost-los-angeles.es.mdx`**

```mdx
# ¿Cuánto cuesta un mariachi en Los Ángeles?

El precio de un mariachi completo en Los Ángeles casi siempre se cobra por hora, y el total depende
del día de la semana, de cuánto tiempo quiere que toque el grupo y de qué tan lejos está el evento de
la base del mariachi.

## Precios de Mariachi El Cuis

Nuestra base es el código postal 90011, en el sur de Los Ángeles, y damos cotización instantánea
únicamente dentro del Condado de Los Ángeles.

- **Lunes a viernes, dentro de 25 millas del 90011:** paquete de 7 canciones por **$380**, o **$500
  por hora** sin mínimo de horas.
- **Sábado y domingo:** **$550 por hora**, comenzando a las 3:00 PM o más tarde.
- **Mínimo de horas según la distancia:** 2 horas dentro de 15 millas, 3 horas dentro de 30, 4 horas
  dentro de 50, y una hora más por cada 20 millas adicionales.

Los eventos son entre las 7:00 AM y la medianoche, y no hay duración máxima.

## El depósito y el saldo

Un **depósito de $100** aparta su fecha. El saldo se paga después, directamente al mariachi el día
del evento. Pronto aceptaremos tarjeta, Zelle, Venmo y PayPal en línea; por ahora coordinamos el
depósito por teléfono o [WhatsApp](https://wa.me/16269220091).

## Cancelación

El depósito es reembolsable solo si cancela **7 días o más** antes del evento. Dentro de los 7 días
previos no es reembolsable.

## Obtenga su precio exacto

Vea el desglose completo en nuestra [página de servicios](/services), o [contáctenos](/contact) con
su fecha, hora de inicio y ciudad y le enviamos su precio exacto el mismo día.
```

**`src/content/guides/how-booking-works.en.mdx`**

```mdx
# How booking Mariachi El Cuis works

Booking is direct. You deal with the band, not an agency, and there is no booking fee.

## 1. Tell us your event

Message us on [WhatsApp](https://wa.me/16269220091) or use the [contact form](/en/contact) with your
date, start time, how long you want the mariachi to play, and the event address or city. We serve
Los Angeles County.

## 2. Get your price

We send your exact price the same day, based on the day of the week, the length, and the distance
from our 90011 base. The rules are on the [services page](/en/services): $380 for the weekday 7-song
package or $500/hour on weekdays, $550/hour on weekends starting at 3:00 PM.

## 3. Reserve with a $100 deposit

A $100 deposit holds your date on the calendar. The balance is paid later, directly to the band on
the event day.

## 4. Before the event

Send your song requests and any timing notes ahead of time. The mariachi arrives ready to start at
the scheduled time.

## Cancellation

The deposit is refundable only if you cancel 7 or more days before the event.

Ready? [Start here](/en/book).
```

**`src/content/guides/how-booking-works.es.mdx`**

```mdx
# Cómo funciona la reserva con Mariachi El Cuis

La reserva es directa. Trata con el mariachi, no con una agencia, y no hay cargo por reservar.

## 1. Cuéntanos de tu evento

Escríbenos por [WhatsApp](https://wa.me/16269220091) o usa el [formulario de contacto](/contact) con
tu fecha, hora de inicio, cuánto tiempo quieres que toque el mariachi y la dirección o ciudad del
evento. Servimos el Condado de Los Ángeles.

## 2. Recibe tu precio

Enviamos tu precio exacto el mismo día, según el día de la semana, la duración y la distancia desde
nuestra base en el 90011. Las reglas están en la [página de servicios](/services): $380 por el
paquete de 7 canciones entre semana o $500 por hora entre semana, y $550 por hora los fines de
semana comenzando a las 3:00 PM.

## 3. Aparta con un depósito de $100

Un depósito de $100 aparta tu fecha en el calendario. El saldo se paga después, directamente al
mariachi el día del evento.

## 4. Antes del evento

Envía tus peticiones de canciones y cualquier nota de horario con anticipación. El mariachi llega
listo para empezar a la hora acordada.

## Cancelación

El depósito es reembolsable solo si cancelas 7 días o más antes del evento.

¿Listo? [Empieza aquí](/book).
```

**`src/content/guides/quinceanera-song-guide.en.mdx`**

```mdx
# Quinceañera song guide

A quinceañera has three musical moments the mariachi carries: the mass, the vals, and the party set.

## At the mass

Common choices are "Ave María," a gentle entrance piece, and a song of thanks at the end. Your
parish may have its own guidelines, so confirm with the church.

## The vals and the surprise dance

The vals with dad and the court is usually a slow ranchera or bolero. Popular picks include "De Niña
a Mujer," "Tiempo de Vals," and "Hermoso Cariño." The surprise dance that follows is often a faster
number to lift the energy.

## The party set

This is where the mariachi opens the floor: "El Rey," "Volver, Volver," "El Son de la Negra," "La
Culebra," and "Amor Eterno" for the emotional peak. Send us the family's must-play list when you
book.

## How long to book

Most quinceañeras book 2 to 3 hours to cover the mass or reception entrance plus a full party set.
See pricing on the [services page](/en/services) and [get a quote](/en/book).
```

**`src/content/guides/quinceanera-song-guide.es.mdx`**

```mdx
# Guía de canciones para quinceañera

Una quinceañera tiene tres momentos musicales que el mariachi acompaña: la misa, el vals y el set de
fiesta.

## En la misa

Las opciones comunes son "Ave María," una pieza suave de entrada y una canción de agradecimiento al
final. Tu parroquia puede tener sus propias indicaciones, así que confírmalo con la iglesia.

## El vals y el baile sorpresa

El vals con el papá y la corte suele ser una ranchera lenta o un bolero. Opciones populares: "De
Niña a Mujer," "Tiempo de Vals" y "Hermoso Cariño." El baile sorpresa que sigue suele ser un número
más rápido para subir la energía.

## El set de fiesta

Aquí el mariachi abre la pista: "El Rey," "Volver, Volver," "El Son de la Negra," "La Culebra" y
"Amor Eterno" para el momento más emotivo. Envíanos la lista de la familia al reservar.

## Cuánto tiempo reservar

La mayoría de las quinceañeras reservan de 2 a 3 horas para cubrir la misa o la entrada a la
recepción más un set completo de fiesta. Consulta los precios en la [página de
servicios](/services) y [pide tu cotización](/book).
```

**`src/content/guides/wedding-mariachi-timeline.en.mdx`**

```mdx
# Where a mariachi fits in your wedding timeline

A mariachi can play three parts of a wedding day. Most couples pick one or two.

## The ceremony

The mariachi plays the processional, a piece during the ceremony such as "Ave María," and the
recessional as you walk out. Plan for about 30 to 45 minutes on site.

## Cocktail hour

While guests move to the reception, the mariachi plays a standing set — sones, boleros, and a few
rancheras. This is the most popular single choice.

## The reception entrance

The mariachi announces the couple with a strong number like "El Son de la Negra" or "La Negra," then
plays through the first toast.

## Putting it together

A 2-hour booking covers a ceremony plus cocktail hour, or a cocktail hour plus reception entrance. A
3-hour booking covers all three with room for song requests. See the [services page](/en/services)
for pricing and [start your quote](/en/book).
```

**`src/content/guides/wedding-mariachi-timeline.es.mdx`**

```mdx
# El mariachi en la línea de tiempo de tu boda

Un mariachi puede tocar en tres partes del día de la boda. La mayoría de las parejas elige una o
dos.

## La ceremonia

El mariachi toca la entrada, una pieza durante la ceremonia como "Ave María," y la salida cuando
caminan hacia afuera. Considera unos 30 a 45 minutos en el lugar.

## La hora del coctel

Mientras los invitados pasan a la recepción, el mariachi toca un set de pie: sones, boleros y
algunas rancheras. Es la opción más popular.

## La entrada a la recepción

El mariachi anuncia a los novios con un número fuerte como "El Son de la Negra" o "La Negra," y sigue
tocando durante el primer brindis.

## Cómo se arma

Una reserva de 2 horas cubre la ceremonia más la hora del coctel, o la hora del coctel más la
entrada a la recepción. Una reserva de 3 horas cubre las tres con espacio para peticiones. Consulta
la [página de servicios](/services) para precios y [comienza tu cotización](/book).
```

- [ ] **Step 4: `guides/page.tsx` (listing)**

Map `GUIDES` → cards linking to `/guides/{slug}`. Metadata + breadcrumb JSON-LD.
`generateStaticParams` → locales.

- [ ] **Step 5: `guides/[slug]/page.tsx`**

```tsx
export const dynamicParams = false
export function generateStaticParams() {
  return GUIDES.flatMap((g) => [
    { lang: 'es', slug: g.slug },
    { lang: 'en', slug: g.slug },
  ])
}
```

`generateMetadata` from the guide entry. Body: `<article>` wrapping the dynamically-imported MDX
component. JSON-LD: `article({...})` + `breadcrumb([home, guides, this])`. `notFound()` if the slug
is unknown.

- [ ] **Step 6: Unit test**

```ts
// tests/unit/guides.test.ts
import { expect, test } from 'vitest'
import { GUIDES, getGuide } from '@/lib/content/guides'

test('4 guides, unique slugs, both locales titled', () => {
  expect(GUIDES.length).toBe(4)
  expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(4)
  for (const g of GUIDES) {
    expect(g.title.es).not.toBe('')
    expect(g.title.en).not.toBe('')
    expect(g.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  }
})

test('getGuide', () => {
  expect(getGuide('how-booking-works')?.slug).toBe('how-booking-works')
  expect(getGuide('x')).toBeUndefined()
})
```

- [ ] **Step 7: e2e test**

```ts
// tests/e2e/guides.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('guides listing + an article render with Article schema', async ({ page }) => {
  await page.goto('/guides')
  await expect(page.locator('#main h1')).toBeVisible()
  await page.locator('a[href^="/guides/"]').first().click()
  await expect(page.locator('article')).toBeVisible()
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(ld.map((t) => JSON.parse(t)['@type'])).toContain('Article')
  await checkA11y(page)
})

test('cost article states the real prices', async ({ page }) => {
  await page.goto('/en/guides/mariachi-cost-los-angeles')
  await expect(page.getByText('$380')).toBeVisible()
  await expect(page.getByText('$550')).toBeVisible()
})
```

- [ ] **Step 8: Run** → `pnpm test tests/unit/guides.test.ts && pnpm test:e2e tests/e2e/guides.spec.ts` → PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add MDX guides — listing, article route, and 4 bilingual articles"
```

---

## Task 18: City landing pages

**Files:**
- Create: `src/app/[lang]/mariachi/[city]/page.tsx`
- Create: `tests/e2e/city.spec.ts`

**Interfaces:**
- Consumes: `CITIES`, `getCity`, `cityDistanceMi`, `PRICING`, `pricingLines`, `FAQ`,
  `buildMetadata`, `localBusiness`, `faqPage`, `breadcrumb`, `<JsonLd>`.
- Produces: `/mariachi/[city]` for every city × both locales, statically generated.

- [ ] **Step 1: Static params + metadata**

```tsx
export const dynamicParams = false
export function generateStaticParams() {
  return CITIES.flatMap((c) => [
    { lang: 'es', city: c.slug },
    { lang: 'en', city: c.slug },
  ])
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; city: string }> }) {
  const { lang, city } = await params
  const locale = isLocale(lang) ? lang : 'es'
  const c = getCity(city)
  if (!c) return {}
  const title = locale === 'es' ? `Mariachi en ${c.name}` : `Mariachi in ${c.name}`
  const description =
    locale === 'es'
      ? `Mariachi El Cuis toca en ${c.name} y alrededores. ${c.blurb.es}`
      : `Mariachi El Cuis performs in ${c.name} and nearby. ${c.blurb.en}`
  return buildMetadata({ locale, path: `/mariachi/${c.slug}`, title, description })
}
```

- [ ] **Step 2: Body**

`notFound()` if `!getCity(city)`. Render:
- `<h1>` — "Mariachi en {name}" / "Mariachi in {name}"
- the city `blurb[locale]` + neighborhoods
- an approximate-distance line ("~{cityDistanceMi(c)} millas de nuestra base en el 90011 (aprox.)")
- the shared pricing bullets (`pricingLines(locale)`)
- 4–5 shared `FAQ` items
- CTA band (`/book`, WhatsApp, phone)
- links to 3–4 sibling city pages ("También servimos …")

JSON-LD (build absolute URLs with `alternatesFor(path).languages[locale]`):
- `localBusiness({ areaServed: [c.name, ...c.neighborhoods] })`
- `faqPage(FAQ.slice(0, 5).map((f) => ({ q: f.q[locale], a: f.a[locale] })))`
- `breadcrumb([{ name: dict.nav.home, url: homeUrl }, { name: title, url: thisPageUrl }])` — 2 levels,
  Home → this city page.

For the `los-angeles` slug, render "nuestra base está aquí, en el 90011" / "our home base is here in
90011" instead of the "~0 miles" distance line.

- [ ] **Step 3: e2e test**

```ts
// tests/e2e/city.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

test('a city page renders unique content + schema + a11y', async ({ page }) => {
  await page.goto('/mariachi/downey')
  await expect(page.locator('#main h1')).toContainText('Downey')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href', 'https://mariachielcuis.com/mariachi/downey',
  )
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  const types = ld.map((t) => JSON.parse(t)['@type'])
  expect(types).toContainEqual(['LocalBusiness', 'MusicGroup'])
  expect(types).toContain('FAQPage')
  await checkA11y(page)
})

test('unknown city 404s', async ({ page }) => {
  const res = await page.goto('/mariachi/atlantis')
  expect(res?.status()).toBe(404)
})

test('en city page has hreflang back to es', async ({ page }) => {
  await page.goto('/en/mariachi/downey')
  await expect(page.locator('link[hreflang="es"]')).toHaveAttribute(
    'href', 'https://mariachielcuis.com/mariachi/downey',
  )
})
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: build programmatic city landing pages with local schema"
```

---

## Task 19: Terms + Privacy + Book (intro) pages

**Files:**
- Create: `src/app/[lang]/terms/page.tsx`, `src/app/[lang]/privacy/page.tsx`,
  `src/app/[lang]/book/page.tsx`
- Create: `tests/e2e/static-pages.spec.ts`

**Interfaces:**
- Consumes: `buildMetadata`, `breadcrumb`, `<JsonLd>`, `PRICING`, `pricingLines`, `siteConfig`.
- Produces: `/terms`, `/privacy`, `/book` for both locales.

- [ ] **Step 1: `terms/page.tsx`**

Real, plain-language terms covering: booking is a direct agreement with the band; $100 deposit
reserves the date; balance due on the event day; **cancellation — deposit refundable only if
cancelled 7+ days before the event, non-refundable within 7 days**; performance window 7 AM–midnight;
weekend start 3 PM+; service area Los Angeles County; payment methods (card via Stripe, plus Zelle /
Venmo / PayPal — "online checkout coming soon"). Mark a `{/* TODO: owner/lawyer review */}`.

- [ ] **Step 2: `privacy/page.tsx`**

What the contact form collects (name, email, phone, message), that it is emailed to the band and not
sold, Resend as the email processor, no analytics/cookies in Phase 1, contact email for requests.
`{/* TODO: owner review */}`.

- [ ] **Step 3: `book/page.tsx`**

Phase-1 placeholder for the wizard: `<h1>` "Get a quote & book" / "Cotización y reserva", the
`pricingLines(locale)` bullets, and prominent CTAs — WhatsApp, phone, and a link to `/contact`.
Copy: "Instant online quoting and deposit checkout are coming soon. For now, message us and we'll
send your exact price the same day." `buildMetadata({ ..., path: '/book' })` — **not** `noindex`
(it's a real landing page in Phase 1; the deep wizard steps that get `noindex` don't exist yet).
Breadcrumb JSON-LD.

- [ ] **Step 4: e2e test**

```ts
// tests/e2e/static-pages.spec.ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

for (const path of ['/terms', '/privacy', '/book', '/en/terms', '/en/privacy', '/en/book']) {
  test(`${path} renders + a11y + canonical`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('#main h1')).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await checkA11y(page)
  })
}

test('terms states the 7-day cancellation rule', async ({ page }) => {
  await page.goto('/en/terms')
  await expect(page.getByText(/7 or more days/i)).toBeVisible()
})
```

- [ ] **Step 5: Run** → PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add terms, privacy, and Phase-1 book landing pages"
```

---

## Task 20: sitemap, robots, llms.txt, manifest, OG image, not-found, error, icon

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/llms.txt/route.ts`,
  `src/app/manifest.ts`, `src/app/opengraph-image.tsx`, `src/app/icon.tsx`,
  `src/app/[lang]/not-found.tsx`, `src/app/[lang]/error.tsx`, `src/app/not-found.tsx`
- Create: `src/lib/seo/routes.ts` (the canonical list of indexable paths)
- Create: `tests/unit/routes.test.ts`, `tests/e2e/seo-files.spec.ts`

**Interfaces:**
- Consumes: `CITIES`, `GUIDES`, `siteConfig`, `alternatesFor`, `localizedPath`, `PRICING`,
  `pricingLines`.
- Produces:
  - `STATIC_PATHS: string[]` = `['/', '/services', '/book', '/repertoire', '/about', '/media', '/contact', '/guides', '/terms', '/privacy']`
  - `allIndexablePaths(): string[]` = `STATIC_PATHS` + `/guides/{slug}` + `/mariachi/{slug}`
  - `sitemap()` → one entry per path with `alternates.languages` (es + en), sensible priorities.
  - `robots()` → allow all + AI crawlers explicitly allowed; `disallow: ['/admin', '/api']`; sitemap
    URL. (No `/admin` or `/api` exist yet — listing them is intentional forward-cover.)
  - `GET /llms.txt` → `text/plain` Markdown summary built from `siteConfig` + `pricingLines('en')` +
    city list + guide list.

- [ ] **Step 1: Failing test for routes**

```ts
// tests/unit/routes.test.ts
import { expect, test } from 'vitest'
import { allIndexablePaths, STATIC_PATHS } from '@/lib/seo/routes'
import { CITIES } from '@/lib/data/cities'
import { GUIDES } from '@/lib/content/guides'

test('indexable paths cover static + guides + cities, no dupes', () => {
  const all = allIndexablePaths()
  expect(all).toEqual(Array.from(new Set(all)))
  expect(all).toContain('/')
  expect(all).toContain('/services')
  for (const c of CITIES) expect(all).toContain(`/mariachi/${c.slug}`)
  for (const g of GUIDES) expect(all).toContain(`/guides/${g.slug}`)
  expect(all).not.toContain('/admin')
  expect(all.length).toBe(STATIC_PATHS.length + CITIES.length + GUIDES.length)
})
```

- [ ] **Step 2: Run — verify fail**

- [ ] **Step 3: Implement `src/lib/seo/routes.ts`**

```ts
import { CITIES } from '@/lib/data/cities'
import { GUIDES } from '@/lib/content/guides'

export const STATIC_PATHS = [
  '/', '/services', '/faq', '/book', '/repertoire', '/about', '/media', '/contact',
  '/guides', '/terms', '/privacy',
] as const

export function allIndexablePaths(): string[] {
  return [
    ...STATIC_PATHS,
    ...GUIDES.map((g) => `/guides/${g.slug}`),
    ...CITIES.map((c) => `/mariachi/${c.slug}`),
  ]
}
```

- [ ] **Step 4: Run — verify pass**

- [ ] **Step 5: Implement `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next'
import { allIndexablePaths } from '@/lib/seo/routes'
import { alternatesFor } from '@/lib/i18n/paths'

export default function sitemap(): MetadataRoute.Sitemap {
  return allIndexablePaths().map((path) => {
    const { canonical, languages } = alternatesFor(path)
    return {
      url: canonical,
      lastModified: new Date(),
      changeFrequency: path === '/' ? 'weekly' : 'monthly',
      priority: path === '/' ? 1 : path === '/book' || path === '/services' ? 0.9 : 0.7,
      alternates: { languages: { es: languages.es!, en: languages.en! } },
    }
  })
}
```

- [ ] **Step 6: Implement `src/app/robots.ts`**

```ts
import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config/site'

const AI_BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
      { userAgent: AI_BOTS, allow: '/' },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
```

- [ ] **Step 7: Implement `src/app/llms.txt/route.ts`**

```ts
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
- Service area: ${siteConfig.serviceCountyLabel} only

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
```

- [ ] **Step 8: Implement `manifest.ts`, `opengraph-image.tsx`, `icon.tsx`**

`manifest.ts` → name, short_name, `start_url: '/'`, `display: 'standalone'`, `background_color`
`#131315`, `theme_color` `#EFB049`, icon entry pointing at `/icon`.

`opengraph-image.tsx` → `ImageResponse` (from `next/og`), 1200×630, brand-dark background,
`Mariachi El Cuis` in a serif-ish system font, gold on dark. `export const size`, `contentType`.

`icon.tsx` → `ImageResponse`, 32×32, gold "M" on `#131315`.

- [ ] **Step 9: Implement `not-found.tsx` + `error.tsx`**

`src/app/[lang]/not-found.tsx` → renders inside the `[lang]` layout (header/footer present):
`<main id="main">` + `<h1>` "Página no encontrada" with an English line under it, plus a link to
`/`. It cannot read `params`, so write it Spanish-first + English (bilingual-safe).

`src/app/[lang]/error.tsx` → `'use client'`; props `{ error, reset }`; minimal card with a heading,
a bilingual "something went wrong" line, and a `<button onClick={reset}>` retry. No stack traces.

`src/app/not-found.tsx` (root) → since the root layout lives at `app/[lang]/layout.tsx`, this file
must render its **own** `<html lang="es"><body>` with a tiny inline-styled 404 + link home. It only
fires for paths outside `[lang]` that 404 (rare — proxy rewrites almost everything into `/es/...`).

- [ ] **Step 10: e2e test**

```ts
// tests/e2e/seo-files.spec.ts
import { expect, test } from '@playwright/test'

test('robots.txt allows all + names AI bots + points to sitemap', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text()
  expect(txt).toMatch(/User-Agent: \*/i)
  expect(txt).toMatch(/ClaudeBot/)
  expect(txt).toMatch(/GPTBot/)
  expect(txt).toContain('Sitemap: https://mariachielcuis.com/sitemap.xml')
  expect(txt).toMatch(/Disallow: \/admin/)
})

test('sitemap lists home + a city + a guide with hreflang alternates', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  expect(xml).toContain('<loc>https://mariachielcuis.com/</loc>')
  expect(xml).toContain('https://mariachielcuis.com/mariachi/downey')
  expect(xml).toContain('hreflang="en"')
})

test('llms.txt is plain text with pricing + cities', async ({ request }) => {
  const res = await request.get('/llms.txt')
  expect(res.headers()['content-type']).toContain('text/plain')
  const txt = await res.text()
  expect(txt).toContain('# Mariachi El Cuis')
  expect(txt).toContain('$550')
  expect(txt).toContain('/mariachi/downey')
})

test('404 route returns 404 with an h1', async ({ page }) => {
  const res = await page.goto('/definitely-not-a-page/deep')
  // proxy rewrites to /es/definitely-not-a-page/deep -> not-found
  expect(res?.status()).toBe(404)
  await expect(page.locator('#main h1')).toBeVisible()
})
```

- [ ] **Step 11: Run** → `pnpm test tests/unit/routes.test.ts && pnpm test:e2e tests/e2e/seo-files.spec.ts` → PASS.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add sitemap, robots, llms.txt, manifest, OG image, 404/error"
```

---

## Task 21: Security headers + CSP

**Files:**
- Modify: `next.config.ts` (add `headers()`)
- Create: `tests/e2e/headers.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: every response carries HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Frame-Options`, and a Content-Security-Policy that permits only what the
  site uses (self, `data:` images, Google Fonts already inlined by `next/font` so no external font
  host needed, YouTube nocookie frames, ytimg thumbnails).

- [ ] **Step 1: Add `headers()` to `next.config.ts`**

```ts
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "img-src 'self' data: https://i.ytimg.com",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''),
      "connect-src 'self'",
      "frame-src https://www.youtube-nocookie.com",
      "object-src 'none'",
    ].join('; '),
  },
]

// in nextConfig:
async headers() {
  return [{ source: '/:path*', headers: securityHeaders }]
},
```

> `next/font` self-hosts the font files under `/_next/static`, so `font-src 'self'` is enough — no
> `fonts.gstatic.com`. If a future task adds analytics or Stripe, widen `script-src`/`connect-src`
> then, not now. `'unsafe-inline'` in `script-src` is required for the JSON-LD `<script>` and Next's
> inline bootstrap; a nonce-based CSP is a possible later hardening (note in the spec's Phase 2+).

- [ ] **Step 2: e2e test**

```ts
// tests/e2e/headers.spec.ts
import { expect, test } from '@playwright/test'

test('security headers present on a page response', async ({ request }) => {
  const res = await request.get('/es')
  const h = res.headers()
  expect(h['strict-transport-security']).toContain('max-age=')
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(h['content-security-policy']).toContain("default-src 'self'")
  expect(h['content-security-policy']).toContain('youtube-nocookie.com')
})
```

- [ ] **Step 3: Run** → `pnpm test:e2e tests/e2e/headers.spec.ts` → PASS. Then re-run the **full**
  e2e suite (`pnpm test:e2e`) to confirm the CSP didn't break the media facade, MDX, or fonts.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add security headers and Content-Security-Policy"
```

---

## Task 22: CI — Lighthouse budgets + GitHub Actions + README

**Files:**
- Create: `lighthouserc.json`, `.github/workflows/ci.yml`, `README.md` (replace scaffold)
- Modify: `playwright.config.ts` (`webServer.env` with `NEXT_PUBLIC_SITE_URL`)

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a CI workflow that runs lint, typecheck, unit tests, build, Playwright, and Lighthouse
  CI with category budgets; fails the build on regression.

- [ ] **Step 1: `lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm start",
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/en",
        "http://localhost:3000/services",
        "http://localhost:3000/repertoire",
        "http://localhost:3000/mariachi/downey",
        "http://localhost:3000/guides/mariachi-cost-los-angeles"
      ],
      "numberOfRuns": 1,
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:seo": ["error", { "minScore": 1 }],
        "categories:best-practices": ["error", { "minScore": 1 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

- [ ] **Step 2: Confirm `NEXT_PUBLIC_SITE_URL` is set for every server**

`playwright.config.ts` already passes `webServer.env.NEXT_PUBLIC_SITE_URL` (Task 3). The CI workflow
below also sets it at the job level so `pnpm build` and `pnpm lhci` (which runs its own
`pnpm start`) both see `https://mariachielcuis.com`. No file change needed here — just verify both
are present.

- [ ] **Step 3: `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push: { branches: [master, main] }
  pull_request:
env:
  NEXT_PUBLIC_SITE_URL: https://mariachielcuis.com
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
      - run: pnpm lhci
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: playwright-report, path: playwright-report/, retention-days: 7 }
```

- [ ] **Step 4: Replace `README.md`**

Short: what the project is, the stack, `pnpm install`, `pnpm dev`, the env vars (link
`.env.example`), the test commands, deployment note (Vercel; set `NEXT_PUBLIC_SITE_URL` +
`RESEND_API_KEY` + `CONTACT_TO_EMAIL`), and a pointer to the spec + this plan.

- [ ] **Step 5: Run the full gate locally**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e && pnpm lhci
```
Expected: all green. Fix any Lighthouse misses (common: `<img>` without `width`/`height` in the
video facade → add them; missing `theme-color` → covered by manifest; render-blocking → ensure no
external CSS).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "ci: add Lighthouse budgets, GitHub Actions pipeline, and README"
```

---

## Done — Phase 1 exit criteria

- `pnpm build` produces static pages for every route in both locales.
- `/` serves Spanish, `/en` serves English; every page has a correct canonical + `es`/`en`/`x-default`
  hreflang; `sitemap.xml`, `robots.txt`, `/llms.txt` are correct.
- Home, Services, Repertoire, About, Media, Guides (+4 articles), Contact, Terms, Privacy, Book, and
  ~16 city pages all render, are keyboard-accessible, and pass axe with zero violations.
- Contact form validates client + server, sends via Resend when configured, and always shows the
  phone + WhatsApp fallback.
- CI runs lint + typecheck + unit + build + Playwright + Lighthouse and blocks on any category
  dropping below the budget (Perf 95, A11y/SEO/Best-Practices 100).
- No fabricated trust claims anywhere; owner-supplied content is marked with `TODO` comments.

## Deferred to later phases (do NOT build here)

Quote engine + `/api/quote`, the booking wizard, Stripe + manual payments, Supabase, admin
dashboard (`/admin`), Google Calendar, WhatsApp bot, e-signature. The `robots.ts` disallow of
`/admin` + `/api` and the `noindex` plumbing in `buildMetadata` are intentional forward-cover.
