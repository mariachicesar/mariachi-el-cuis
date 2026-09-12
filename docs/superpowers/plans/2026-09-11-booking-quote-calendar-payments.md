# Booking Wizard: Quote Engine, Calendar Availability, Deposit Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/book`'s "coming soon" placeholder with a working flow: live quote engine, address geocoding, Google Calendar availability + hold, email-delivered estimate, and Stripe-hosted deposit checkout that confirms or releases the calendar hold via webhook.

**Architecture:** A pure `src/lib/quote/` engine (no framework/IO) computes prices from data already resolved by two thin server-only adapters (`src/lib/geo/geocode.ts` for address→county/lat/lng, `src/lib/calendar/google.ts` for Calendar read/write). Server actions glue these together for the client wizard. No database: the Google Calendar event *is* the booking hold/record, and Stripe Checkout Session `metadata` is the only state carried between "checkout started" and the webhook that confirms or releases it.

**Tech Stack:** Next.js 16 App Router server actions + Route Handler, `googleapis` (Calendar v3 + OAuth2), `stripe` (Node SDK, hosted Checkout), `@react-email/components` (already a dependency, unused until now), `resend` (already used by the contact form), `zod`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-11-booking-quote-calendar-payments-design.md` — read it alongside this plan; the plan implements it task-by-task and inline comments below flag the one place this plan refines the spec's wording (`lineItems.key` instead of a free-text `label`, so the "pure" engine never bakes in English prose).

## Global Constraints

- The app must boot and run with every new env var absent — each integration is gated by a `features.*` flag (`src/lib/env.ts`), exactly like the existing `features.email`. Never crash on a missing key.
- Deposit math (money) lives **only** in `src/lib/quote/index.ts`. No other file recomputes a total or deposit — server actions call the engine, they never do arithmetic on prices themselves.
- Deposit rule (final, confirmed): `< 3h` before event start → blocked (`call_required`). `3–24h` → rush, deposit = `max($150, $50 × enforcedHours)`. `≥24h` → normal, deposit = `$50 × enforcedHours`. `seven_songs`'s `enforcedHours` is always `1`.
- Distance stays straight-line `haversineMiles` (`src/lib/geo/distance.ts`) from `siteConfig.baseLat/baseLng` — do not add a Routes/Distance-Matrix API call.
- All new server-only modules (`geocode.ts`, `google.ts`, `stripe.ts`) start with `import 'server-only'`, matching `src/lib/env.ts`'s own guard.
- No Supabase, no `/admin`, no WhatsApp, no manual-payment lane — explicitly deferred per the spec §12.
- Every new/changed page and component keeps the existing bilingual (`es`/`en`) convention: a local `COPY` object keyed by `Locale`, never a hardcoded English or Spanish string outside one.

---

## Task 1: Env vars, `features` flags, and deposit constants

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `src/lib/data/pricing.ts`
- Test: `tests/unit/env.test.ts`, `tests/unit/pricing.test.ts` (new)

**Interfaces:**
- Produces: `env.GOOGLE_MAPS_API_KEY?: string`, `env.GOOGLE_OAUTH_CLIENT_ID?: string`, `env.GOOGLE_OAUTH_CLIENT_SECRET?: string`, `env.GOOGLE_CALENDAR_REFRESH_TOKEN?: string`, `env.GOOGLE_CALENDAR_ID?: string`, `env.STRIPE_SECRET_KEY?: string`, `env.STRIPE_WEBHOOK_SECRET?: string`; `features.maps: boolean`, `features.calendar: boolean`, `features.stripe: boolean`. `PRICING.depositPerHour = 50`, `PRICING.rushFlatDeposit = 150` (replaces the old flat `PRICING.deposit = 100`).

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/env.test.ts`:

```ts
test('maps feature is off without GOOGLE_MAPS_API_KEY', () => {
  const { features } = parseEnv({})
  expect(features.maps).toBe(false)
})

test('maps feature is on with the key', () => {
  const { features } = parseEnv({ GOOGLE_MAPS_API_KEY: 'k' })
  expect(features.maps).toBe(true)
})

test('calendar feature requires all four Google Calendar vars', () => {
  expect(parseEnv({ GOOGLE_OAUTH_CLIENT_ID: 'a' }).features.calendar).toBe(false)
  expect(
    parseEnv({
      GOOGLE_OAUTH_CLIENT_ID: 'a',
      GOOGLE_OAUTH_CLIENT_SECRET: 'b',
      GOOGLE_CALENDAR_REFRESH_TOKEN: 'c',
      GOOGLE_CALENDAR_ID: 'd',
    }).features.calendar,
  ).toBe(true)
})

test('stripe feature requires both Stripe vars', () => {
  expect(parseEnv({ STRIPE_SECRET_KEY: 'sk_x' }).features.stripe).toBe(false)
  expect(
    parseEnv({ STRIPE_SECRET_KEY: 'sk_x', STRIPE_WEBHOOK_SECRET: 'whsec_x' }).features.stripe,
  ).toBe(true)
})
```

Create `tests/unit/pricing.test.ts`:

```ts
import { expect, test } from 'vitest'
import { PRICING } from '@/lib/data/pricing'

test('deposit constants replace the old flat deposit', () => {
  expect(PRICING.depositPerHour).toBe(50)
  expect(PRICING.rushFlatDeposit).toBe(150)
  expect((PRICING as { deposit?: number }).deposit).toBeUndefined()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/env.test.ts tests/unit/pricing.test.ts`
Expected: FAIL — `features.maps`/`features.calendar`/`features.stripe` are `undefined`, not `false`/`true`; `PRICING.depositPerHour` is `undefined`.

- [ ] **Step 3: Implement**

Replace `src/lib/env.ts` in full:

```ts
import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_TO_EMAIL: z.email().optional(),
  GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALENDAR_REFRESH_TOKEN: z.string().min(1).optional(),
  GOOGLE_CALENDAR_ID: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
})

// Some hosts (e.g. Vercel) can present a declared-but-unfilled env var as an
// empty string rather than omitting the key. zod's `.optional()` only treats
// `undefined` as absent, so a blank string reaches validation as a real,
// invalid value and throws. Normalize blank/whitespace-only values to
// `undefined` before parsing so "present but empty" behaves like "absent".
function normalizeOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function parseEnv(source: Record<string, string | undefined>) {
  const env = schema.parse({
    NEXT_PUBLIC_SITE_URL: normalizeOptional(source.NEXT_PUBLIC_SITE_URL),
    RESEND_API_KEY: normalizeOptional(source.RESEND_API_KEY),
    CONTACT_TO_EMAIL: normalizeOptional(source.CONTACT_TO_EMAIL),
    GOOGLE_MAPS_API_KEY: normalizeOptional(source.GOOGLE_MAPS_API_KEY),
    GOOGLE_OAUTH_CLIENT_ID: normalizeOptional(source.GOOGLE_OAUTH_CLIENT_ID),
    GOOGLE_OAUTH_CLIENT_SECRET: normalizeOptional(source.GOOGLE_OAUTH_CLIENT_SECRET),
    GOOGLE_CALENDAR_REFRESH_TOKEN: normalizeOptional(source.GOOGLE_CALENDAR_REFRESH_TOKEN),
    GOOGLE_CALENDAR_ID: normalizeOptional(source.GOOGLE_CALENDAR_ID),
    STRIPE_SECRET_KEY: normalizeOptional(source.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET: normalizeOptional(source.STRIPE_WEBHOOK_SECRET),
  })
  return {
    env,
    features: {
      email: Boolean(env.RESEND_API_KEY && env.CONTACT_TO_EMAIL),
      maps: Boolean(env.GOOGLE_MAPS_API_KEY),
      calendar: Boolean(
        env.GOOGLE_OAUTH_CLIENT_ID &&
          env.GOOGLE_OAUTH_CLIENT_SECRET &&
          env.GOOGLE_CALENDAR_REFRESH_TOKEN &&
          env.GOOGLE_CALENDAR_ID,
      ),
      stripe: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
    },
  }
}

const parsed = parseEnv(process.env as Record<string, string | undefined>)
export const env = parsed.env
export const features = parsed.features
```

In `src/lib/data/pricing.ts`, replace the `deposit: 100,` line inside `PRICING` with:

```ts
  depositPerHour: 50,
  rushFlatDeposit: 150,
```

(Leave every other `PRICING` field untouched — Task 2 rewrites `pricingLines()`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/env.test.ts tests/unit/pricing.test.ts`
Expected: PASS. Then run `pnpm typecheck` — expect it to now show 1 error at `src/app/[lang]/services/page.tsx:130` (`PRICING.deposit` no longer exists). That error is fixed in Task 2; leave it for now, it confirms Task 2 is actually needed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts src/lib/data/pricing.ts tests/unit/env.test.ts tests/unit/pricing.test.ts
git commit -m "feat: add Maps/Calendar/Stripe env vars and tiered deposit constants

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 2: Update deposit copy sitewide

The old copy states a flat "$100 deposit" in six places. This task rewrites all of them to describe
the tiered rule, and fixes the typecheck error Task 1 introduced.

**Files:**
- Modify: `src/lib/data/pricing.ts` (`pricingLines()`)
- Modify: `src/lib/data/faq.ts`
- Modify: `src/app/[lang]/services/page.tsx`
- Modify: `src/app/[lang]/terms/page.tsx`
- Modify: `src/content/guides/how-booking-works.en.mdx`, `src/content/guides/how-booking-works.es.mdx`
- Modify: `src/content/guides/mariachi-cost-los-angeles.en.mdx`, `src/content/guides/mariachi-cost-los-angeles.es.mdx`
- Test: `tests/e2e/static-pages.spec.ts`, `tests/e2e/services.spec.ts` (extend existing files)

**Interfaces:**
- Consumes: `PRICING.depositPerHour`, `PRICING.rushFlatDeposit` (Task 1).
- Produces: nothing new consumed by later tasks — this is copy-only.

- [ ] **Step 1: Write the failing tests**

Append to `tests/e2e/static-pages.spec.ts`:

```ts
test('terms states the new tiered deposit', async ({ page }) => {
  await page.goto('/en/terms')
  await expect(page.getByText('$50', { exact: false })).toBeVisible()
  await expect(page.getByText('$150', { exact: false })).toBeVisible()
})
```

Open `tests/e2e/services.spec.ts` and add:

```ts
test('services page states the new deposit rule, not the old flat $100', async ({ page }) => {
  await page.goto('/en/services')
  await expect(page.getByText('$100', { exact: false })).toHaveCount(0)
  await expect(page.getByText('$50', { exact: false }).first()).toBeVisible()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:e2e tests/e2e/static-pages.spec.ts tests/e2e/services.spec.ts`
Expected: FAIL — both pages still show "$100" and not "$50"/"$150".

- [ ] **Step 3: Implement — rewrite each file's deposit copy**

In `src/lib/data/pricing.ts`, replace the deposit line inside both `pricingLines()` arrays:

```ts
// es array, replace:
'El depósito es de $100 para reservar la fecha; el saldo se paga después directamente al mariachi.',
// with:
'El depósito es de $50 por cada hora reservada (o $50 para el paquete de 7 canciones). Si reservas con menos de 24 horas de anticipación, el depósito mínimo es de $150. El saldo se paga después directamente al mariachi.',
```

```ts
// en array, replace:
'A $100 deposit reserves your date; the balance is paid later directly to the band.',
// with:
'The deposit is $50 per hour booked (or $50 for the 7-songs package). If you book less than 24 hours before the event, the minimum deposit is $150. The balance is paid later directly to the band.',
```

In `src/lib/data/faq.ts`, replace the "how do I hold the date" answer pair:

```ts
es: 'Un depósito de $100 aparta tu fecha. El saldo se paga después, directamente al mariachi el día del evento.',
en: 'A $100 deposit holds your date. The balance is paid later, directly to the band on the event day.',
```

with:

```ts
es: 'El depósito es de $50 por hora reservada (o $50 para el paquete de 7 canciones); si reservas con menos de 24 horas de anticipación, el mínimo es de $150. El saldo se paga después, directamente al mariachi el día del evento.',
en: 'The deposit is $50 per hour booked (or $50 for the 7-songs package); if you book less than 24 hours before the event, the minimum is $150. The balance is paid later, directly to the band on the event day.',
```

And the "how do I pay" answer pair (now true — Task 12 ships Stripe checkout):

```ts
es: 'Pronto aceptaremos tarjeta, Zelle, Venmo y PayPal en línea. Por ahora, escríbenos por WhatsApp o llámanos y coordinamos el depósito.',
en: 'We will soon accept card, Zelle, Venmo, and PayPal online. For now, message us on WhatsApp or call and we\'ll arrange the deposit.',
```

with:

```ts
es: 'Puedes pagar el depósito en línea con tarjeta al reservar. El saldo se paga después directamente al mariachi (efectivo, Zelle o Venmo).',
en: 'You can pay the deposit online by card when you book. The balance is then paid directly to the band (cash, Zelle, or Venmo).',
```

In `src/app/[lang]/services/page.tsx`, replace the deposit row (line ~130):

```ts
{ label: t.rows.deposit, rate: rate(PRICING.deposit, t.rows.none), when: t.rows.depositWhen },
```

with:

```ts
{
  label: t.rows.deposit,
  rate: `$${PRICING.depositPerHour}${t.rows.perHour}`,
  when: t.rows.depositWhen,
},
```

and extend the `depositWhen` copy in both locale branches of `COPY` (lines ~44 and ~76) from:

```ts
depositWhen: 'Se resta del total; el saldo se paga el día del evento',
// and
depositWhen: 'Applied to the total; the balance is paid on the event day',
```

to:

```ts
depositWhen: `Se resta del total; mínimo $${PRICING.rushFlatDeposit} si reservas con menos de 24 h de anticipación`,
// and
depositWhen: `Applied to the total; minimum $${PRICING.rushFlatDeposit} if you book less than 24h ahead`,
```

(These are template literals inside the `COPY` object — `PRICING` is already imported in this file per line 130's existing usage.)

In `src/app/[lang]/terms/page.tsx`, replace the deposit paragraph in both locales:

```ts
// es (line ~33):
'Un depósito de $100 aparta tu fecha y hora una vez confirmada la disponibilidad. El saldo restante se paga el día del evento, directamente al mariachi, antes o al comenzar la presentación.',
// with:
'El depósito es de $50 por cada hora reservada (o $50 para el paquete de 7 canciones), y aparta tu fecha y hora una vez confirmada la disponibilidad. Si reservas con menos de 24 horas de anticipación, el depósito mínimo es de $150. El saldo restante se paga el día del evento, directamente al mariachi, antes o al comenzar la presentación.',
```

```ts
// en (line ~80):
'A $100 deposit reserves your date and time once availability is confirmed. The remaining balance is paid on the day of the event, directly to the band, before or at the start of the performance.',
// with:
'The deposit is $50 per hour booked (or $50 for the 7-songs package), and reserves your date and time once availability is confirmed. If you book less than 24 hours before the event, the minimum deposit is $150. The remaining balance is paid on the day of the event, directly to the band, before or at the start of the performance.',
```

In `src/content/guides/how-booking-works.en.mdx`, replace:

```
## 3. Reserve with a $100 deposit

A $100 deposit holds your date on the calendar. The balance is paid later, directly to the band on
```

with:

```
## 3. Reserve with a deposit

A deposit holds your date on the calendar — $50 per hour booked ($50 for the 7-songs package), or a
$150 minimum if you book less than 24 hours before the event. The balance is paid later, directly to the band on
```

In `src/content/guides/how-booking-works.es.mdx`, replace:

```
## 3. Aparta con un depósito de $100

Un depósito de $100 aparta tu fecha en el calendario. El saldo se paga después, directamente al
```

with:

```
## 3. Aparta con un depósito

Un depósito aparta tu fecha en el calendario — $50 por hora reservada ($50 para el paquete de 7
canciones), o un mínimo de $150 si reservas con menos de 24 horas de anticipación. El saldo se paga después, directamente al
```

In `src/content/guides/mariachi-cost-los-angeles.en.mdx`, replace:

```
A **$100 deposit** reserves your date. The balance is paid later, directly to the band on the day of
```

with:

```
A **deposit** reserves your date — $50 per hour booked ($50 for the 7-songs package), or a $150
minimum if booked less than 24 hours ahead. The balance is paid later, directly to the band on the day of
```

In `src/content/guides/mariachi-cost-los-angeles.es.mdx`, replace:

```
Un **depósito de $100** aparta su fecha. El saldo se paga después, directamente al mariachi el día
```

with:

```
Un **depósito** aparta su fecha — $50 por hora reservada ($50 para el paquete de 7 canciones), o un
mínimo de $150 si se reserva con menos de 24 horas de anticipación. El saldo se paga después, directamente al mariachi el día
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm typecheck` — expect no errors (the `PRICING.deposit` reference is gone).
Run: `pnpm test` — all unit tests still pass.
Run: `pnpm test:e2e tests/e2e/static-pages.spec.ts tests/e2e/services.spec.ts tests/e2e/guides.spec.ts`
Expected: PASS — including the pre-existing `guides.spec.ts` "cost article states the real prices"
test ($380/$550 untouched) and `static-pages.spec.ts`'s existing "7-day cancellation rule" test
(unchanged text).

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/pricing.ts src/lib/data/faq.ts src/app/\[lang\]/services/page.tsx src/app/\[lang\]/terms/page.tsx src/content/guides/how-booking-works.en.mdx src/content/guides/how-booking-works.es.mdx src/content/guides/mariachi-cost-los-angeles.en.mdx src/content/guides/mariachi-cost-los-angeles.es.mdx tests/e2e/static-pages.spec.ts tests/e2e/services.spec.ts
git commit -m "content: replace flat \$100 deposit copy with the tiered deposit rule sitewide

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 3: LA-timezone helpers for the quote engine

**Files:**
- Create: `src/lib/quote/timezone.ts`
- Test: `src/lib/quote/timezone.test.ts`

**Interfaces:**
- Produces: `laWallTimeToUtc(dateStr: string, timeStr: string): Date`, `weekdayIndexOf(dateStr: string): number` (0=Sun..6=Sat, per JS `Date#getUTCDay()` convention). Task 4 consumes both.

No dependency on `Intl`/timezone libraries beyond the built-in `Intl.DateTimeFormat` — this avoids
adding a date/timezone package for one conversion.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/quote/timezone.test.ts`:

```ts
import { expect, test } from 'vitest'
import { laWallTimeToUtc, weekdayIndexOf } from './timezone'

test('converts an LA summer (PDT, UTC-7) wall time to UTC', () => {
  expect(laWallTimeToUtc('2026-07-15', '15:00').toISOString()).toBe('2026-07-15T22:00:00.000Z')
})

test('converts an LA winter (PST, UTC-8) wall time to UTC', () => {
  expect(laWallTimeToUtc('2026-01-15', '15:00').toISOString()).toBe('2026-01-15T23:00:00.000Z')
})

test('weekdayIndexOf: 2026-01-01 is a Thursday', () => {
  // 2024-01-01 was a Monday (leap year, 366 days -> +2 weekdays to 2025-01-01 Wed);
  // 2025 has 365 days -> +1 weekday to 2026-01-01 Thursday.
  expect(weekdayIndexOf('2026-01-01')).toBe(4)
})

test('weekdayIndexOf: 2026-01-03/04 are Saturday/Sunday', () => {
  expect(weekdayIndexOf('2026-01-03')).toBe(6)
  expect(weekdayIndexOf('2026-01-04')).toBe(0)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/lib/quote/timezone.test.ts`
Expected: FAIL with "Cannot find module './timezone'".

- [ ] **Step 3: Implement**

Create `src/lib/quote/timezone.ts`:

```ts
const LA_TZ = 'America/Los_Angeles'

/** Minutes to ADD to a UTC instant to get LA wall-clock time, DST-aware. */
function laOffsetMinutesAt(instant: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: LA_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = Object.fromEntries(dtf.formatToParts(instant).map((p) => [p.type, p.value]))
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  )
  return (asIfUtc - instant.getTime()) / 60_000
}

/** `dateStr` "YYYY-MM-DD", `timeStr` "HH:mm" — both LA-local wall-clock values. */
export function laWallTimeToUtc(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  const naiveUtc = Date.UTC(y, m - 1, d, hh, mm, 0)
  // The offset barely varies within a single day, so computing it from the
  // naive (unshifted) guess is accurate except within seconds of a DST
  // transition at 2am local time — irrelevant for booking a live performance.
  const offsetMin = laOffsetMinutesAt(new Date(naiveUtc))
  return new Date(naiveUtc - offsetMin * 60_000)
}

/** 0=Sunday..6=Saturday, for the literal calendar date (not an instant). */
export function weekdayIndexOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/quote/timezone.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/quote/timezone.ts src/lib/quote/timezone.test.ts
git commit -m "feat: add dependency-free LA-timezone helpers for the quote engine

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 4: Quote engine core

**Files:**
- Create: `src/lib/quote/types.ts`
- Create: `src/lib/quote/index.ts`
- Test: `src/lib/quote/quote.test.ts`

**Interfaces:**
- Consumes: `PRICING` (`src/lib/data/pricing.ts`, Task 1), `laWallTimeToUtc`/`weekdayIndexOf` (Task 3).
- Produces: `getQuote(input: QuoteInput): QuoteResult`, and the `QuoteInput`/`QuoteResult`/`QuoteOk`/`QuoteContactRequired`/`QuoteCallRequired`/`QuoteLineItem` types below. Every later task that runs a quote (Tasks 9, 11, 12) imports `getQuote` from `@/lib/quote` and the types from `@/lib/quote/types`.

Note the one deliberate spec deviation: §2's `lineItems: { label: string; amount: number }[]` becomes
`{ key: 'seven_songs' | 'hourly_rate'; amount: number }[]` here — a machine-readable key, not English
prose, so the "pure, no framework imports" engine never bakes in a language. Callers (the wizard,
Task 14) map `key` to localized text themselves, the same way they already map `reason` codes.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/quote/types.ts` first (types have no runtime behavior to test, but every other file
in this task needs them to exist):

```ts
export type PackageType = 'seven_songs' | 'hourly'

export type QuoteInput = {
  eventDate: string // "YYYY-MM-DD", LA-local calendar date
  startTime: string // "HH:mm", 24h, LA-local wall time
  durationHours: number
  packageType: PackageType
  distanceMi: number
  county: string | null
  state: string | null
  now: Date
}

export type QuoteLineItem = { key: 'seven_songs' | 'hourly_rate'; amount: number }

export type QuoteOk = {
  status: 'ok'
  currency: 'USD'
  lineItems: QuoteLineItem[]
  enforcedHours: number
  total: number
  deposit: number
  balanceDue: number
  rush: boolean
  minimumApplied?: { requested: number; enforced: number }
  calendarBlockMinutes: number
}

export type QuoteContactRequired = {
  status: 'contact_required'
  reason: 'out_of_area' | 'weekend_early_start' | 'outside_hours'
}

export type QuoteCallRequired = { status: 'call_required'; reason: 'lead_time' }

export type QuoteResult = QuoteOk | QuoteContactRequired | QuoteCallRequired
```

Create `src/lib/quote/quote.test.ts`:

```ts
import { expect, test } from 'vitest'
import { getQuote } from './index'
import type { QuoteInput } from './types'

const WEEKDAY = '2026-01-01' // Thursday
const SATURDAY = '2026-01-03'
const SUNDAY = '2026-01-04'

function input(overrides: Partial<QuoteInput>): QuoteInput {
  return {
    eventDate: WEEKDAY,
    startTime: '15:00',
    durationHours: 1,
    packageType: 'seven_songs',
    distanceMi: 10,
    county: 'Los Angeles County',
    state: 'CA',
    now: new Date('2025-12-01T00:00:00Z'), // far in advance of every test event date
    ...overrides,
  }
}

test('out-of-state is contact_required/out_of_area', () => {
  expect(getQuote(input({ state: 'NV' }))).toEqual({
    status: 'contact_required',
    reason: 'out_of_area',
  })
})

test('out-of-county is contact_required/out_of_area', () => {
  expect(getQuote(input({ county: 'Orange County' }))).toEqual({
    status: 'contact_required',
    reason: 'out_of_area',
  })
})

test('weekday, seven_songs, within 25mi: $380 flat, 1h block, $50 deposit', () => {
  const q = getQuote(input({}))
  expect(q).toMatchObject({
    status: 'ok',
    total: 380,
    enforcedHours: 1,
    deposit: 50,
    balanceDue: 330,
    calendarBlockMinutes: 120,
    lineItems: [{ key: 'seven_songs', amount: 380 }],
  })
})

test('weekday, hourly, within 25mi: no minimum enforced', () => {
  const q = getQuote(input({ packageType: 'hourly', durationHours: 1, distanceMi: 20 }))
  expect(q).toMatchObject({ status: 'ok', enforcedHours: 1, total: 500, deposit: 50 })
})

test('weekday, seven_songs requested but distance > 25mi: forced to hourly', () => {
  const q = getQuote(input({ packageType: 'seven_songs', distanceMi: 26, durationHours: 3 }))
  expect(q).toMatchObject({
    status: 'ok',
    lineItems: [{ key: 'hourly_rate', amount: 1500 }],
    total: 1500,
  })
})

test('distance-minimum boundaries: 14.9/15.0 -> 2h, 15.1 -> 3h', () => {
  const base = { packageType: 'hourly' as const, durationHours: 1 }
  expect(getQuote(input({ ...base, distanceMi: 14.9 }))).toMatchObject({ enforcedHours: 2 })
  expect(getQuote(input({ ...base, distanceMi: 15.0 }))).toMatchObject({ enforcedHours: 2 })
  expect(getQuote(input({ ...base, distanceMi: 15.1 }))).toMatchObject({ enforcedHours: 3 })
})

test('distance-minimum boundaries: 29.9/30.0 -> 3h, 30.1 -> 4h', () => {
  const base = { packageType: 'hourly' as const, durationHours: 1 }
  expect(getQuote(input({ ...base, distanceMi: 29.9 }))).toMatchObject({ enforcedHours: 3 })
  expect(getQuote(input({ ...base, distanceMi: 30.0 }))).toMatchObject({ enforcedHours: 3 })
  expect(getQuote(input({ ...base, distanceMi: 30.1 }))).toMatchObject({ enforcedHours: 4 })
})

test('distance-minimum boundaries: 49.9/50.0 -> 4h, 50.1 -> 5h, 70 -> 5h', () => {
  const base = { packageType: 'hourly' as const, durationHours: 1 }
  expect(getQuote(input({ ...base, distanceMi: 49.9 }))).toMatchObject({ enforcedHours: 4 })
  expect(getQuote(input({ ...base, distanceMi: 50.0 }))).toMatchObject({ enforcedHours: 4 })
  expect(getQuote(input({ ...base, distanceMi: 50.1 }))).toMatchObject({ enforcedHours: 5 })
  expect(getQuote(input({ ...base, distanceMi: 70 }))).toMatchObject({ enforcedHours: 5 })
})

test('minimumApplied is only set when the minimum actually raised the hours', () => {
  const raised = getQuote(
    input({ packageType: 'hourly', distanceMi: 20, durationHours: 1 }),
  ) as { minimumApplied?: unknown }
  expect(raised.minimumApplied).toEqual({ requested: 1, enforced: 2 })

  const notRaised = getQuote(
    input({ packageType: 'hourly', distanceMi: 20, durationHours: 3 }),
  ) as { minimumApplied?: unknown }
  expect(notRaised.minimumApplied).toBeUndefined()
})

test('seven_songs is exempt from the distance minimum', () => {
  const q = getQuote(input({ packageType: 'seven_songs', distanceMi: 24, durationHours: 1 }))
  expect(q).toMatchObject({ enforcedHours: 1 })
})

test('weekend before 3pm is contact_required/weekend_early_start', () => {
  expect(
    getQuote(input({ eventDate: SATURDAY, startTime: '14:59', packageType: 'hourly', distanceMi: 10, durationHours: 2 })),
  ).toEqual({ status: 'contact_required', reason: 'weekend_early_start' })
})

test('weekend at/after 3pm is bookable, hourly-only at $550/h, minimum always applies', () => {
  const q = getQuote(
    input({ eventDate: SUNDAY, startTime: '15:00', packageType: 'seven_songs', distanceMi: 10, durationHours: 1 }),
  )
  expect(q).toMatchObject({
    status: 'ok',
    lineItems: [{ key: 'hourly_rate', amount: 1100 }], // forced hourly, 2h minimum @ $550
    enforcedHours: 2,
    total: 1100,
  })
})

test('outside the 07:00-24:00 window is contact_required/outside_hours', () => {
  expect(
    getQuote(input({ startTime: '06:00', packageType: 'seven_songs', distanceMi: 10 })),
  ).toEqual({ status: 'contact_required', reason: 'outside_hours' })

  expect(
    getQuote(
      input({ startTime: '23:30', packageType: 'hourly', distanceMi: 20, durationHours: 1 }),
    ),
  ).toEqual({ status: 'contact_required', reason: 'outside_hours' })
})

test('lead time < 3h is call_required', () => {
  const eventStart = new Date('2026-01-01T23:00:00.000Z') // 2026-01-01 15:00 PST = 23:00 UTC
  const q = getQuote(input({ now: new Date(eventStart.getTime() - 2 * 60 * 60 * 1000 - 59 * 60 * 1000) }))
  expect(q).toEqual({ status: 'call_required', reason: 'lead_time' })
})

test('lead time exactly 3h is bookable and not rush', () => {
  const eventStart = new Date('2026-01-01T23:00:00.000Z')
  const q = getQuote(input({ now: new Date(eventStart.getTime() - 3 * 60 * 60 * 1000) }))
  expect(q).toMatchObject({ status: 'ok', rush: true }) // 3h is still < 24h -> rush
})

test('lead time just under 24h is rush; exactly 24h is not', () => {
  const eventStart = new Date('2026-01-01T23:00:00.000Z')
  const justUnder = getQuote(
    input({ now: new Date(eventStart.getTime() - 23 * 60 * 60 * 1000 - 59 * 60 * 1000) }),
  )
  const exactly = getQuote(input({ now: new Date(eventStart.getTime() - 24 * 60 * 60 * 1000) }))
  expect(justUnder).toMatchObject({ status: 'ok', rush: true })
  expect(exactly).toMatchObject({ status: 'ok', rush: false })
})

test('deposit: normal hourly is $50 x enforcedHours', () => {
  const q = getQuote(input({ packageType: 'hourly', distanceMi: 40, durationHours: 4 }))
  expect(q).toMatchObject({ status: 'ok', enforcedHours: 4, deposit: 200 })
})

test('deposit: rush takes the greater of $150 or the normal calc (short booking)', () => {
  const eventStart = new Date('2026-01-01T23:00:00.000Z')
  const q = getQuote(
    input({
      packageType: 'seven_songs',
      now: new Date(eventStart.getTime() - 10 * 60 * 60 * 1000), // 10h out -> rush
    }),
  )
  expect(q).toMatchObject({ status: 'ok', rush: true, enforcedHours: 1, deposit: 150 })
})

test('deposit: rush never lowers the deposit below the normal calc (long booking)', () => {
  const eventStart = new Date('2026-01-01T23:00:00.000Z')
  const q = getQuote(
    input({
      packageType: 'hourly',
      distanceMi: 40,
      durationHours: 5,
      now: new Date(eventStart.getTime() - 10 * 60 * 60 * 1000), // 10h out -> rush
    }),
  )
  expect(q).toMatchObject({ status: 'ok', rush: true, enforcedHours: 5, deposit: 250 })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/lib/quote/quote.test.ts`
Expected: FAIL with "Cannot find module './index'".

- [ ] **Step 3: Implement**

Create `src/lib/quote/index.ts`:

```ts
import { PRICING } from '@/lib/data/pricing'
import { laWallTimeToUtc, weekdayIndexOf } from './timezone'
import type { QuoteInput, QuoteLineItem, QuoteResult } from './types'

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minimumHoursFor(distanceMi: number): number {
  for (const tier of PRICING.minimumTable) {
    if (distanceMi <= tier.maxMi) return tier.hours
  }
  const last = PRICING.minimumTable[PRICING.minimumTable.length - 1]
  const extraMi = distanceMi - last.maxMi
  return last.hours + Math.ceil(extraMi / PRICING.minimumStepMi)
}

export function getQuote(input: QuoteInput): QuoteResult {
  const { eventDate, startTime, durationHours, packageType, distanceMi, county, state, now } = input

  if (state !== 'CA' || county !== 'Los Angeles County') {
    return { status: 'contact_required', reason: 'out_of_area' }
  }

  const dow = weekdayIndexOf(eventDate)
  const isWeekend = dow === 0 || dow === 6
  const isWeekday = !isWeekend
  const weekdayLocalRate = isWeekday && distanceMi <= PRICING.weekdayRadiusMi

  if (isWeekend && minutesOf(startTime) < minutesOf(PRICING.weekendEarliestStart)) {
    return { status: 'contact_required', reason: 'weekend_early_start' }
  }

  const effectivePackage: 'seven_songs' | 'hourly' =
    packageType === 'seven_songs' && weekdayLocalRate ? 'seven_songs' : 'hourly'

  let enforcedHours: number
  let minimumApplied: { requested: number; enforced: number } | undefined

  if (effectivePackage === 'seven_songs') {
    enforcedHours = 1
  } else if (weekdayLocalRate) {
    enforcedHours = durationHours // "no min" for weekday, <=25mi, hourly
  } else {
    const minimum = minimumHoursFor(distanceMi)
    enforcedHours = Math.max(durationHours, minimum)
    if (enforcedHours > durationHours) {
      minimumApplied = { requested: durationHours, enforced: enforcedHours }
    }
  }

  const startMinutes = minutesOf(startTime)
  const endMinutes = startMinutes + enforcedHours * 60
  if (startMinutes < minutesOf(PRICING.hoursWindow.start) || endMinutes > minutesOf(PRICING.hoursWindow.end)) {
    return { status: 'contact_required', reason: 'outside_hours' }
  }

  const eventStartUtc = laWallTimeToUtc(eventDate, startTime)
  const leadHours = (eventStartUtc.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (leadHours < PRICING.leadTimeCallHours) {
    return { status: 'call_required', reason: 'lead_time' }
  }
  const rush = leadHours < PRICING.leadTimeRushHours

  const rate = isWeekend ? PRICING.hourlyWeekend : PRICING.hourlyWeekday
  const total = effectivePackage === 'seven_songs' ? PRICING.sevenSongsFlat : rate * enforcedHours
  const lineItems: QuoteLineItem[] =
    effectivePackage === 'seven_songs'
      ? [{ key: 'seven_songs', amount: PRICING.sevenSongsFlat }]
      : [{ key: 'hourly_rate', amount: rate * enforcedHours }]

  const normalDeposit = PRICING.depositPerHour * enforcedHours
  const deposit = rush ? Math.max(PRICING.rushFlatDeposit, normalDeposit) : normalDeposit

  return {
    status: 'ok',
    currency: 'USD',
    lineItems,
    enforcedHours,
    total,
    deposit,
    balanceDue: total - deposit,
    rush,
    ...(minimumApplied ? { minimumApplied } : {}),
    calendarBlockMinutes: enforcedHours * 60 + 60,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/quote/`
Expected: PASS (all tests in `timezone.test.ts` and `quote.test.ts`).
Run: `pnpm typecheck` — expect no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quote/
git commit -m "feat: implement the pure quote engine with the finalized deposit rule

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 5: Geocoding adapter

**Files:**
- Create: `src/lib/geo/geocode.ts`
- Test: `src/lib/geo/geocode.test.ts`

**Interfaces:**
- Consumes: `env.GOOGLE_MAPS_API_KEY` (Task 1). Caller is responsible for checking `features.maps`
  before calling this — this module assumes the key is present.
- Produces: `type GeocodeResult = { lat: number; lng: number; county: string | null; state: string | null }`,
  `async function geocodeAddress(address: string): Promise<GeocodeResult | null>`. Tasks 9, 11, 12
  consume both.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/geo/geocode.test.ts`:

```ts
import { afterEach, expect, test, vi } from 'vitest'
import { geocodeAddress } from './geocode'

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetchOnce(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) }),
  )
}

test('parses county and state from a successful geocode', async () => {
  mockFetchOnce({
    status: 'OK',
    results: [
      {
        geometry: { location: { lat: 34.0, lng: -118.25 } },
        address_components: [
          { long_name: 'Los Angeles County', short_name: 'Los Angeles County', types: ['administrative_area_level_2', 'political'] },
          { long_name: 'California', short_name: 'CA', types: ['administrative_area_level_1', 'political'] },
        ],
      },
    ],
  })

  const result = await geocodeAddress('123 Main St, Los Angeles, CA')
  expect(result).toEqual({ lat: 34.0, lng: -118.25, county: 'Los Angeles County', state: 'CA' })
})

test('returns null on ZERO_RESULTS', async () => {
  mockFetchOnce({ status: 'ZERO_RESULTS', results: [] })
  expect(await geocodeAddress('not a real address')).toBeNull()
})

test('returns null on a non-OK HTTP response', async () => {
  mockFetchOnce({}, false)
  expect(await geocodeAddress('anything')).toBeNull()
})

test('county/state are null, not throwing, when components are missing', async () => {
  mockFetchOnce({
    status: 'OK',
    results: [{ geometry: { location: { lat: 1, lng: 2 } }, address_components: [] }],
  })
  expect(await geocodeAddress('somewhere')).toEqual({ lat: 1, lng: 2, county: null, state: null })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/lib/geo/geocode.test.ts`
Expected: FAIL with "Cannot find module './geocode'".

- [ ] **Step 3: Implement**

Create `src/lib/geo/geocode.ts`:

```ts
import 'server-only'
import { env } from '@/lib/env'

export type GeocodeResult = { lat: number; lng: number; county: string | null; state: string | null }

type GoogleGeocodeComponent = { long_name: string; short_name: string; types: string[] }
type GoogleGeocodeResponse = {
  status: string
  results: {
    geometry: { location: { lat: number; lng: number } }
    address_components: GoogleGeocodeComponent[]
  }[]
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', address)
  url.searchParams.set('key', env.GOOGLE_MAPS_API_KEY!)

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const data = (await res.json()) as GoogleGeocodeResponse
  if (data.status !== 'OK' || data.results.length === 0) return null

  const { geometry, address_components: components } = data.results[0]
  const county =
    components.find((c) => c.types.includes('administrative_area_level_2'))?.long_name ?? null
  const state =
    components.find((c) => c.types.includes('administrative_area_level_1'))?.short_name ?? null

  return { lat: geometry.location.lat, lng: geometry.location.lng, county, state }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/geo/geocode.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/geo/geocode.ts src/lib/geo/geocode.test.ts
git commit -m "feat: add Google Geocoding adapter for address -> county/state/lat/lng

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 6: Google Calendar adapter

**Files:**
- Create: `src/lib/calendar/google.ts`
- Test: `src/lib/calendar/google.test.ts`
- Modify: `package.json` (add `googleapis`)

**Interfaces:**
- Consumes: `env.GOOGLE_OAUTH_CLIENT_ID/SECRET`, `env.GOOGLE_CALENDAR_REFRESH_TOKEN`, `env.GOOGLE_CALENDAR_ID` (Task 1). Caller checks `features.calendar` first.
- Produces: `type HoldDetails = { summary: string; description: string; location: string; startUtc: Date; endUtc: Date }`, `checkAvailability(startUtc: Date, endUtc: Date): Promise<boolean>`, `createHoldEvent(details: HoldDetails): Promise<string>`, `confirmEvent(eventId: string, details: { summary: string; description: string }): Promise<{ alreadyConfirmed: boolean }>`, `releaseHoldEvent(eventId: string): Promise<void>`. Tasks 10, 12, 13 consume these.

The "HOLD — " prefix convention (used by `createHoldEvent`'s summaries and checked by `confirmEvent`)
is the entire idempotency mechanism for Task 13's webhook — an event whose summary no longer starts
with it has already been confirmed, so a duplicate webhook delivery is a safe no-op.

- [ ] **Step 1: Add the dependency**

```bash
pnpm add googleapis
```

- [ ] **Step 2: Write the failing tests**

Create `src/lib/calendar/google.test.ts`:

```ts
import { beforeEach, expect, test, vi } from 'vitest'

const freebusyQuery = vi.fn()
const eventsInsert = vi.fn()
const eventsGet = vi.fn()
const eventsPatch = vi.fn()
const eventsDelete = vi.fn()

vi.mock('googleapis', () => ({
  google: {
    auth: { OAuth2: vi.fn().mockImplementation(() => ({ setCredentials: vi.fn() })) },
    calendar: vi.fn().mockReturnValue({
      freebusy: { query: freebusyQuery },
      events: { insert: eventsInsert, get: eventsGet, patch: eventsPatch, delete: eventsDelete },
    }),
  },
}))

vi.mock('@/lib/env', () => ({
  env: {
    GOOGLE_OAUTH_CLIENT_ID: 'id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'secret',
    GOOGLE_CALENDAR_REFRESH_TOKEN: 'refresh',
    GOOGLE_CALENDAR_ID: 'cal-1',
  },
}))

beforeEach(() => {
  freebusyQuery.mockReset()
  eventsInsert.mockReset()
  eventsGet.mockReset()
  eventsPatch.mockReset()
  eventsDelete.mockReset()
})

test('checkAvailability is true when the calendar reports no busy blocks', async () => {
  const { checkAvailability } = await import('./google')
  freebusyQuery.mockResolvedValue({ data: { calendars: { 'cal-1': { busy: [] } } } })
  expect(await checkAvailability(new Date(), new Date())).toBe(true)
})

test('checkAvailability is false when the calendar reports a busy block', async () => {
  const { checkAvailability } = await import('./google')
  freebusyQuery.mockResolvedValue({
    data: { calendars: { 'cal-1': { busy: [{ start: 'x', end: 'y' }] } } },
  })
  expect(await checkAvailability(new Date(), new Date())).toBe(false)
})

test('createHoldEvent returns the new event id', async () => {
  const { createHoldEvent } = await import('./google')
  eventsInsert.mockResolvedValue({ data: { id: 'evt-1' } })
  const id = await createHoldEvent({
    summary: 'HOLD — test',
    description: 'd',
    location: 'l',
    startUtc: new Date(),
    endUtc: new Date(),
  })
  expect(id).toBe('evt-1')
})

test('confirmEvent patches and reports alreadyConfirmed:false for a HOLD event', async () => {
  const { confirmEvent } = await import('./google')
  eventsGet.mockResolvedValue({ data: { summary: 'HOLD — test' } })
  eventsPatch.mockResolvedValue({ data: {} })
  const result = await confirmEvent('evt-1', { summary: 'Booking confirmed', description: 'd' })
  expect(result).toEqual({ alreadyConfirmed: false })
  expect(eventsPatch).toHaveBeenCalledOnce()
})

test('confirmEvent skips the patch and reports alreadyConfirmed:true for a non-HOLD event', async () => {
  const { confirmEvent } = await import('./google')
  eventsGet.mockResolvedValue({ data: { summary: 'Booking confirmed' } })
  const result = await confirmEvent('evt-1', { summary: 'x', description: 'y' })
  expect(result).toEqual({ alreadyConfirmed: true })
  expect(eventsPatch).not.toHaveBeenCalled()
})

test('releaseHoldEvent deletes the event', async () => {
  const { releaseHoldEvent } = await import('./google')
  eventsDelete.mockResolvedValue({})
  await releaseHoldEvent('evt-1')
  expect(eventsDelete).toHaveBeenCalledOnce()
})

test('releaseHoldEvent treats an already-deleted (404) event as success', async () => {
  const { releaseHoldEvent } = await import('./google')
  eventsDelete.mockRejectedValue({ code: 404 })
  await expect(releaseHoldEvent('evt-1')).resolves.toBeUndefined()
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test src/lib/calendar/google.test.ts`
Expected: FAIL with "Cannot find module './google'".

- [ ] **Step 4: Implement**

Create `src/lib/calendar/google.ts`:

```ts
import 'server-only'
import { google } from 'googleapis'
import { env } from '@/lib/env'

function calendarClient() {
  const auth = new google.auth.OAuth2(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET)
  auth.setCredentials({ refresh_token: env.GOOGLE_CALENDAR_REFRESH_TOKEN })
  return google.calendar({ version: 'v3', auth })
}

export type HoldDetails = {
  summary: string
  description: string
  location: string
  startUtc: Date
  endUtc: Date
}

export async function checkAvailability(startUtc: Date, endUtc: Date): Promise<boolean> {
  const calendar = calendarClient()
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: startUtc.toISOString(),
      timeMax: endUtc.toISOString(),
      items: [{ id: env.GOOGLE_CALENDAR_ID! }],
    },
  })
  const busy = res.data.calendars?.[env.GOOGLE_CALENDAR_ID!]?.busy ?? []
  return busy.length === 0
}

export async function createHoldEvent(details: HoldDetails): Promise<string> {
  const calendar = calendarClient()
  const res = await calendar.events.insert({
    calendarId: env.GOOGLE_CALENDAR_ID!,
    requestBody: {
      summary: details.summary,
      description: details.description,
      location: details.location,
      start: { dateTime: details.startUtc.toISOString() },
      end: { dateTime: details.endUtc.toISOString() },
    },
  })
  if (!res.data.id) throw new Error('Calendar event created without an id')
  return res.data.id
}

export async function confirmEvent(
  eventId: string,
  details: { summary: string; description: string },
): Promise<{ alreadyConfirmed: boolean }> {
  const calendar = calendarClient()
  const existing = await calendar.events.get({ calendarId: env.GOOGLE_CALENDAR_ID!, eventId })
  if (!existing.data.summary?.startsWith('HOLD —')) {
    return { alreadyConfirmed: true }
  }
  await calendar.events.patch({
    calendarId: env.GOOGLE_CALENDAR_ID!,
    eventId,
    requestBody: { summary: details.summary, description: details.description },
  })
  return { alreadyConfirmed: false }
}

export async function releaseHoldEvent(eventId: string): Promise<void> {
  const calendar = calendarClient()
  try {
    await calendar.events.delete({ calendarId: env.GOOGLE_CALENDAR_ID!, eventId })
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code !== 404 && code !== 410) throw err
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/lib/calendar/google.test.ts`
Expected: PASS (7 tests).
Run: `pnpm typecheck` — expect no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/calendar/
git commit -m "feat: add Google Calendar adapter (freebusy, hold, confirm, release)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 7: Stripe adapter (deposit checkout + webhook verification)

**Files:**
- Create: `src/lib/payments/stripe.ts`
- Test: `src/lib/payments/stripe.test.ts`
- Modify: `package.json` (add `stripe`)

**Interfaces:**
- Consumes: `env.STRIPE_SECRET_KEY`, `env.STRIPE_WEBHOOK_SECRET` (Task 1). Caller checks
  `features.stripe` first.
- Produces: `type DepositCheckoutInput = { depositUsd: number; successUrl: string; cancelUrl: string; customerEmail: string; metadata: Record<string, string> }`, `createDepositCheckoutSession(input: DepositCheckoutInput): Promise<{ url: string }>`, `verifyStripeWebhook(payload: string, signature: string): Stripe.Event`. Tasks 12, 13 consume these.

- [ ] **Step 1: Add the dependency**

```bash
pnpm add stripe
```

- [ ] **Step 2: Write the failing tests**

Create `src/lib/payments/stripe.test.ts`:

```ts
import { expect, test, vi } from 'vitest'

const sessionsCreate = vi.fn()
const webhooksConstructEvent = vi.fn()

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    checkout: { sessions: { create: sessionsCreate } },
    webhooks: { constructEvent: webhooksConstructEvent },
  })),
}))

vi.mock('@/lib/env', () => ({
  env: { STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_x' },
}))

test('createDepositCheckoutSession sends the deposit in cents and returns the session url', async () => {
  const { createDepositCheckoutSession } = await import('./stripe')
  sessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session-1' })

  const result = await createDepositCheckoutSession({
    depositUsd: 150,
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
    customerEmail: 'a@b.com',
    metadata: { foo: 'bar' },
  })

  expect(result).toEqual({ url: 'https://checkout.stripe.com/session-1' })
  const args = sessionsCreate.mock.calls[0][0]
  expect(args.line_items[0].price_data.unit_amount).toBe(15000)
  expect(args.metadata).toEqual({ foo: 'bar' })
})

test('createDepositCheckoutSession throws if Stripe returns no url', async () => {
  const { createDepositCheckoutSession } = await import('./stripe')
  sessionsCreate.mockResolvedValue({ url: null })
  await expect(
    createDepositCheckoutSession({
      depositUsd: 50,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      customerEmail: 'a@b.com',
      metadata: {},
    }),
  ).rejects.toThrow('Stripe did not return a checkout URL')
})

test('verifyStripeWebhook delegates to the Stripe SDK', async () => {
  const { verifyStripeWebhook } = await import('./stripe')
  webhooksConstructEvent.mockReturnValue({ type: 'checkout.session.completed' })
  const event = verifyStripeWebhook('{}', 'sig')
  expect(event).toEqual({ type: 'checkout.session.completed' })
  expect(webhooksConstructEvent).toHaveBeenCalledWith('{}', 'sig', 'whsec_x')
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test src/lib/payments/stripe.test.ts`
Expected: FAIL with "Cannot find module './stripe'".

- [ ] **Step 4: Implement**

Create `src/lib/payments/stripe.ts`:

```ts
import 'server-only'
import Stripe from 'stripe'
import { env } from '@/lib/env'

function client(): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY!)
}

export type DepositCheckoutInput = {
  depositUsd: number
  successUrl: string
  cancelUrl: string
  customerEmail: string
  metadata: Record<string, string>
}

export async function createDepositCheckoutSession(
  input: DepositCheckoutInput,
): Promise<{ url: string }> {
  const stripe = client()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    metadata: input.metadata,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(input.depositUsd * 100),
          product_data: { name: 'Mariachi El Cuis — booking deposit' },
        },
      },
    ],
  })
  if (!session.url) throw new Error('Stripe did not return a checkout URL')
  return { url: session.url }
}

export function verifyStripeWebhook(payload: string, signature: string): Stripe.Event {
  const stripe = client()
  return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET!)
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/lib/payments/stripe.test.ts`
Expected: PASS (3 tests).
Run: `pnpm typecheck` — expect no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/payments/
git commit -m "feat: add Stripe adapter for hosted deposit checkout + webhook verification

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 8: Bilingual email templates

**Files:**
- Create: `src/emails/estimate.tsx`
- Create: `src/emails/booking-confirmed.tsx`
- Create: `src/emails/owner-notification.tsx`
- Test: `src/emails/estimate.test.tsx`

**Interfaces:**
- Consumes: `QuoteResult` (Task 4), `Locale` (`@/lib/i18n/locales`).
- Produces: `EstimateEmail({ locale, quote }): ReactElement`, `BookingConfirmedEmail({ locale, metadata }): ReactElement`, `OwnerNotificationEmail({ metadata }): ReactElement`, where `metadata` is the `Record<string, string>` shape Task 12 writes into the Stripe session (`eventDate`, `startTime`, `enforcedHours`, `packageType`, `address`, `name`, `email`, `phone`, `total`, `deposit`, `balanceDue`, `locale`). Tasks 11, 13 render these with `@react-email/render`'s `render()`.

Only `EstimateEmail` gets a unit test here — it is the one with real branching logic (`quote.status`).
The other two are straightforward metadata-to-text mappings, exercised end-to-end by Task 13's webhook
test instead of duplicating coverage.

- [ ] **Step 1: Write the failing test**

Create `src/emails/estimate.test.tsx`:

```tsx
import { render } from '@react-email/render'
import { expect, test } from 'vitest'
import { EstimateEmail } from './estimate'
import type { QuoteResult } from '@/lib/quote/types'

test('renders the price breakdown for an ok quote', async () => {
  const quote: QuoteResult = {
    status: 'ok',
    currency: 'USD',
    lineItems: [{ key: 'seven_songs', amount: 380 }],
    enforcedHours: 1,
    total: 380,
    deposit: 50,
    balanceDue: 330,
    rush: false,
    calendarBlockMinutes: 120,
  }
  const html = await render(EstimateEmail({ locale: 'en', quote }))
  expect(html).toContain('380')
  expect(html).toContain('50')
  expect(html).toContain('330')
})

test('renders the call-us message for a call_required quote', async () => {
  const quote: QuoteResult = { status: 'call_required', reason: 'lead_time' }
  const html = await render(EstimateEmail({ locale: 'es', quote }))
  expect(html).toContain('(626) 922-0091')
})

test('renders the rush note only when the quote is rush', async () => {
  const rushQuote: QuoteResult = {
    status: 'ok',
    currency: 'USD',
    lineItems: [{ key: 'hourly_rate', amount: 500 }],
    enforcedHours: 1,
    total: 500,
    deposit: 150,
    balanceDue: 350,
    rush: true,
    calendarBlockMinutes: 120,
  }
  const html = await render(EstimateEmail({ locale: 'en', quote: rushQuote }))
  expect(html).toContain('150')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/emails/estimate.test.tsx`
Expected: FAIL with "Cannot find module './estimate'".

- [ ] **Step 3: Implement**

Create `src/emails/estimate.tsx`:

```tsx
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { Locale } from '@/lib/i18n/locales'
import type { QuoteResult } from '@/lib/quote/types'

const COPY = {
  es: {
    preview: 'Tu cotización de Mariachi El Cuis',
    heading: 'Tu cotización',
    total: 'Total estimado',
    deposit: 'Depósito requerido',
    balance: 'Saldo (se paga el día del evento)',
    rush: 'Reserva de último momento: el depósito mínimo es de $150.',
    minimum: (h: number) => `Se aplicó un mínimo de ${h} horas por la distancia del evento.`,
    contact: 'Para esta fecha necesitamos coordinar contigo directamente.',
    call: 'Necesitamos que nos llames para confirmar esta reserva.',
    phone: 'Llámanos: (626) 922-0091',
  },
  en: {
    preview: 'Your Mariachi El Cuis estimate',
    heading: 'Your estimate',
    total: 'Estimated total',
    deposit: 'Deposit required',
    balance: 'Balance (paid on the event day)',
    rush: 'Last-minute booking: the minimum deposit is $150.',
    minimum: (h: number) => `A ${h}-hour minimum applies for this distance.`,
    contact: "We'll need to coordinate this date with you directly.",
    call: 'Please call us to confirm this booking.',
    phone: 'Call us: (626) 922-0091',
  },
} as const

export function EstimateEmail({ locale, quote }: { locale: Locale; quote: QuoteResult }) {
  const t = COPY[locale]
  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={{ fontFamily: 'Georgia, serif', backgroundColor: '#131315', color: '#F5EFE3' }}>
        <Container>
          <Heading>{t.heading}</Heading>
          {quote.status === 'ok' ? (
            <Section>
              <Text>
                {t.total}: ${quote.total}
              </Text>
              <Text>
                {t.deposit}: ${quote.deposit}
              </Text>
              <Text>
                {t.balance}: ${quote.balanceDue}
              </Text>
              {quote.rush && <Text>{t.rush}</Text>}
              {quote.minimumApplied && <Text>{t.minimum(quote.minimumApplied.enforced)}</Text>}
            </Section>
          ) : (
            <Section>
              <Text>{quote.status === 'call_required' ? t.call : t.contact}</Text>
              <Text>{t.phone}</Text>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  )
}
```

Create `src/emails/booking-confirmed.tsx`:

```tsx
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { Locale } from '@/lib/i18n/locales'

const COPY = {
  es: {
    preview: 'Tu reserva está confirmada',
    heading: '¡Reserva confirmada!',
    date: 'Fecha',
    time: 'Hora',
    address: 'Dirección',
    paid: 'Depósito pagado',
    balance: 'Saldo pendiente (se paga el día del evento)',
    cancellation:
      'El depósito es reembolsable solo si cancelas 7 días o más antes del evento.',
  },
  en: {
    preview: 'Your booking is confirmed',
    heading: 'Booking confirmed!',
    date: 'Date',
    time: 'Time',
    address: 'Address',
    paid: 'Deposit paid',
    balance: 'Balance due (paid on the event day)',
    cancellation: 'The deposit is refundable only if you cancel 7 or more days before the event.',
  },
} as const

export function BookingConfirmedEmail({
  locale,
  metadata,
}: {
  locale: Locale
  metadata: Record<string, string>
}) {
  const t = COPY[locale]
  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={{ fontFamily: 'Georgia, serif', backgroundColor: '#131315', color: '#F5EFE3' }}>
        <Container>
          <Heading>{t.heading}</Heading>
          <Section>
            <Text>
              {t.date}: {metadata.eventDate}
            </Text>
            <Text>
              {t.time}: {metadata.startTime}
            </Text>
            <Text>
              {t.address}: {metadata.address}
            </Text>
            <Text>
              {t.paid}: ${metadata.deposit}
            </Text>
            <Text>
              {t.balance}: ${metadata.balanceDue}
            </Text>
            <Text>{t.cancellation}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

Create `src/emails/owner-notification.tsx`:

```tsx
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'

export function OwnerNotificationEmail({ metadata }: { metadata: Record<string, string> }) {
  return (
    <Html>
      <Head />
      <Preview>New booking — {metadata.name}</Preview>
      <Body style={{ fontFamily: 'Georgia, serif', backgroundColor: '#131315', color: '#F5EFE3' }}>
        <Container>
          <Heading>New booking confirmed</Heading>
          <Section>
            <Text>Name: {metadata.name}</Text>
            <Text>Email: {metadata.email}</Text>
            <Text>Phone: {metadata.phone || '—'}</Text>
            <Text>Date: {metadata.eventDate}</Text>
            <Text>Time: {metadata.startTime}</Text>
            <Text>Package: {metadata.packageType}</Text>
            <Text>Hours: {metadata.enforcedHours}</Text>
            <Text>Address: {metadata.address}</Text>
            <Text>Deposit paid: ${metadata.deposit}</Text>
            <Text>Balance due: ${metadata.balanceDue}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/emails/estimate.test.tsx`
Expected: PASS (3 tests).
Run: `pnpm typecheck` — expect no errors.

- [ ] **Step 5: Commit**

```bash
git add src/emails/
git commit -m "feat: add bilingual React Email templates for estimate + booking emails

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 9: `getQuoteAction` server action

**Files:**
- Create: `src/app/actions/quote.ts`
- Test: `src/app/actions/quote.test.ts`

**Interfaces:**
- Consumes: `getQuote` (Task 4), `geocodeAddress` (Task 5), `haversineMiles` (`@/lib/geo/distance`, existing), `siteConfig.baseLat/baseLng` (existing), `features.maps` (Task 1).
- Produces: `type GetQuoteActionResult = { ok: true; quote: QuoteResult } | { ok: false; error: 'validation' | 'not_configured' | 'address_not_found' }`, `getQuoteAction(input: unknown): Promise<GetQuoteActionResult>`. Task 14 (wizard) calls this on every debounced field change.

- [ ] **Step 1: Write the failing tests**

Create `src/app/actions/quote.test.ts`:

```ts
import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { maps: true }, env: {} }))
vi.mock('@/lib/geo/geocode', () => ({ geocodeAddress: vi.fn() }))

afterEach(() => vi.resetAllMocks())

test('rejects malformed input without geocoding', async () => {
  const { getQuoteAction } = await import('./quote')
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  const result = await getQuoteAction({ eventDate: 'not-a-date' })
  expect(result).toEqual({ ok: false, error: 'validation' })
  expect(geocodeAddress).not.toHaveBeenCalled()
})

test('returns address_not_found when geocoding fails', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue(null)
  const { getQuoteAction } = await import('./quote')

  const result = await getQuoteAction({
    eventDate: '2026-06-01',
    startTime: '15:00',
    durationHours: 1,
    packageType: 'seven_songs',
    address: 'nowhere, nowhere',
  })
  expect(result).toEqual({ ok: false, error: 'address_not_found' })
})

test('runs the quote engine with the geocoded distance/county/state', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587, // same as siteConfig base -> distance 0
    county: 'Los Angeles County',
    state: 'CA',
  })
  const { getQuoteAction } = await import('./quote')

  const result = await getQuoteAction({
    eventDate: '2026-06-01',
    startTime: '15:00',
    durationHours: 1,
    packageType: 'seven_songs',
    address: '90011',
  })
  expect(result.ok).toBe(true)
  if (result.ok) expect(result.quote.status).toBe('ok')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/app/actions/quote.test.ts`
Expected: FAIL with "Cannot find module './quote'".

- [ ] **Step 3: Implement**

Create `src/app/actions/quote.ts`:

```ts
'use server'

import { z } from 'zod'
import { getQuote } from '@/lib/quote'
import type { QuoteResult } from '@/lib/quote/types'
import { geocodeAddress } from '@/lib/geo/geocode'
import { haversineMiles } from '@/lib/geo/distance'
import { siteConfig } from '@/lib/config/site'
import { features } from '@/lib/env'

const inputSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.number().min(1).max(12),
  packageType: z.enum(['seven_songs', 'hourly']),
  address: z.string().trim().min(5).max(200),
})

export type GetQuoteActionResult =
  | { ok: true; quote: QuoteResult }
  | { ok: false; error: 'validation' | 'not_configured' | 'address_not_found' }

export async function getQuoteAction(input: unknown): Promise<GetQuoteActionResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'validation' }
  if (!features.maps) return { ok: false, error: 'not_configured' }

  const geocoded = await geocodeAddress(parsed.data.address)
  if (!geocoded) return { ok: false, error: 'address_not_found' }

  const distanceMi = haversineMiles(
    { lat: siteConfig.baseLat, lng: siteConfig.baseLng },
    { lat: geocoded.lat, lng: geocoded.lng },
  )

  const quote = getQuote({
    eventDate: parsed.data.eventDate,
    startTime: parsed.data.startTime,
    durationHours: parsed.data.durationHours,
    packageType: parsed.data.packageType,
    distanceMi,
    county: geocoded.county,
    state: geocoded.state,
    now: new Date(),
  })

  return { ok: true, quote }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/actions/quote.test.ts`
Expected: PASS (3 tests).
Run: `pnpm typecheck` — expect no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/quote.ts src/app/actions/quote.test.ts
git commit -m "feat: add getQuoteAction (geocode + quote engine) server action

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 10: `checkAvailabilityAction` server action

**Files:**
- Create: `src/app/actions/availability.ts`
- Test: `src/app/actions/availability.test.ts`

**Interfaces:**
- Consumes: `laWallTimeToUtc` (Task 3), `checkAvailability` (Task 6), `features.calendar` (Task 1).
- Produces: `type CheckAvailabilityResult = { checked: true; available: boolean } | { checked: false }`, `checkAvailabilityAction(input: unknown): Promise<CheckAvailabilityResult>`. Task 14 calls this once the wizard has a valid date/time and an `ok` quote.

- [ ] **Step 1: Write the failing tests**

Create `src/app/actions/availability.test.ts`:

```ts
import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { calendar: true } }))
vi.mock('@/lib/calendar/google', () => ({ checkAvailability: vi.fn() }))

afterEach(() => vi.resetAllMocks())

test('returns checked:false for malformed input', async () => {
  const { checkAvailabilityAction } = await import('./availability')
  expect(await checkAvailabilityAction({})).toEqual({ checked: false })
})

test('returns checked:true with the adapter result for valid input', async () => {
  const { checkAvailability } = await import('@/lib/calendar/google')
  vi.mocked(checkAvailability).mockResolvedValue(true)
  const { checkAvailabilityAction } = await import('./availability')

  const result = await checkAvailabilityAction({
    eventDate: '2026-06-01',
    startTime: '15:00',
    calendarBlockMinutes: 120,
  })
  expect(result).toEqual({ checked: true, available: true })
})
```

Also add a second scenario in the same file for the feature-off path — since the mock above sets
`calendar: true` module-wide, write it as a separate test file:

Create `src/app/actions/availability-disabled.test.ts`:

```ts
import { expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { calendar: false } }))

test('returns checked:false when the calendar feature is off, even with valid input', async () => {
  const { checkAvailabilityAction } = await import('./availability')
  const result = await checkAvailabilityAction({
    eventDate: '2026-06-01',
    startTime: '15:00',
    calendarBlockMinutes: 120,
  })
  expect(result).toEqual({ checked: false })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/app/actions/availability`
Expected: FAIL with "Cannot find module './availability'".

- [ ] **Step 3: Implement**

Create `src/app/actions/availability.ts`:

```ts
'use server'

import { z } from 'zod'
import { laWallTimeToUtc } from '@/lib/quote/timezone'
import { checkAvailability } from '@/lib/calendar/google'
import { features } from '@/lib/env'

const inputSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  calendarBlockMinutes: z.number().min(60).max(24 * 60),
})

export type CheckAvailabilityResult = { checked: true; available: boolean } | { checked: false }

export async function checkAvailabilityAction(input: unknown): Promise<CheckAvailabilityResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success || !features.calendar) return { checked: false }

  const eventStartUtc = laWallTimeToUtc(parsed.data.eventDate, parsed.data.startTime)
  const blockStart = new Date(eventStartUtc.getTime() - 30 * 60 * 1000)
  const blockEnd = new Date(blockStart.getTime() + parsed.data.calendarBlockMinutes * 60 * 1000)

  const available = await checkAvailability(blockStart, blockEnd)
  return { checked: true, available }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/actions/availability`
Expected: PASS (3 tests total across both files).
Run: `pnpm typecheck` — expect no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/availability.ts src/app/actions/availability.test.ts src/app/actions/availability-disabled.test.ts
git commit -m "feat: add checkAvailabilityAction, gated by features.calendar

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 11: `sendEstimateEmailAction` server action

**Files:**
- Create: `src/app/actions/estimate-email.ts`
- Test: `src/app/actions/estimate-email.test.ts`

**Interfaces:**
- Consumes: `getQuote` (Task 4), `geocodeAddress` (Task 5), `haversineMiles`/`siteConfig` (existing),
  `EstimateEmail` (Task 8), `features.email`/`features.maps` (Task 1), `env.RESEND_API_KEY`/`CONTACT_TO_EMAIL` (existing).
- Produces: `type SendEstimateState = { ok: boolean; error?: 'validation' | 'not_configured' | 'address_not_found' | 'send_failed' }`, `sendEstimateEmailAction(_prev: SendEstimateState, formData: FormData): Promise<SendEstimateState>` — same `(prevState, formData)` shape as the existing `submitContact` (`src/app/actions/contact.ts`), so Task 14 can drive it with `useActionState` exactly like `ContactForm` already does.

- [ ] **Step 1: Write the failing tests**

Create `src/app/actions/estimate-email.test.ts`:

```ts
import { afterEach, expect, test, vi } from 'vitest'

const send = vi.fn()

vi.mock('@/lib/env', () => ({
  features: { email: true, maps: true },
  env: { RESEND_API_KEY: 're_x', CONTACT_TO_EMAIL: 'booking@mariachielcuis.com' },
}))
vi.mock('@/lib/geo/geocode', () => ({ geocodeAddress: vi.fn() }))
vi.mock('resend', () => ({ Resend: vi.fn().mockImplementation(() => ({ emails: { send } })) }))

afterEach(() => vi.resetAllMocks())

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

test('returns validation error for a malformed email', async () => {
  const { sendEstimateEmailAction } = await import('./estimate-email')
  const result = await sendEstimateEmailAction(
    { ok: false },
    formData({
      eventDate: '2026-06-01',
      startTime: '15:00',
      durationHours: '1',
      packageType: 'seven_songs',
      address: '90011',
      email: 'not-an-email',
      locale: 'en',
    }),
  )
  expect(result).toEqual({ ok: false, error: 'validation' })
})

test('sends the estimate email on a valid, geocodable submission', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Los Angeles County',
    state: 'CA',
  })
  send.mockResolvedValue({})
  const { sendEstimateEmailAction } = await import('./estimate-email')

  const result = await sendEstimateEmailAction(
    { ok: false },
    formData({
      eventDate: '2026-06-01',
      startTime: '15:00',
      durationHours: '1',
      packageType: 'seven_songs',
      address: '90011',
      email: 'customer@example.com',
      locale: 'en',
    }),
  )
  expect(result).toEqual({ ok: true })
  expect(send).toHaveBeenCalledOnce()
  expect(send.mock.calls[0][0].to).toBe('customer@example.com')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/app/actions/estimate-email.test.ts`
Expected: FAIL with "Cannot find module './estimate-email'".

- [ ] **Step 3: Implement**

Create `src/app/actions/estimate-email.ts`:

```ts
'use server'

import { render } from '@react-email/render'
import { Resend } from 'resend'
import { z } from 'zod'
import { EstimateEmail } from '@/emails/estimate'
import { getQuote } from '@/lib/quote'
import { geocodeAddress } from '@/lib/geo/geocode'
import { haversineMiles } from '@/lib/geo/distance'
import { siteConfig } from '@/lib/config/site'
import { env, features } from '@/lib/env'

const inputSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.coerce.number().min(1).max(12),
  packageType: z.enum(['seven_songs', 'hourly']),
  address: z.string().trim().min(5).max(200),
  email: z.email(),
  locale: z.enum(['es', 'en']),
})

export type SendEstimateState = {
  ok: boolean
  error?: 'validation' | 'not_configured' | 'address_not_found' | 'send_failed'
}

export async function sendEstimateEmailAction(
  _prev: SendEstimateState,
  formData: FormData,
): Promise<SendEstimateState> {
  const parsed = inputSchema.safeParse({
    eventDate: formData.get('eventDate'),
    startTime: formData.get('startTime'),
    durationHours: formData.get('durationHours'),
    packageType: formData.get('packageType'),
    address: formData.get('address'),
    email: formData.get('email'),
    locale: formData.get('locale'),
  })
  if (!parsed.success) return { ok: false, error: 'validation' }
  if (!features.email || !features.maps) return { ok: false, error: 'not_configured' }

  const geocoded = await geocodeAddress(parsed.data.address)
  if (!geocoded) return { ok: false, error: 'address_not_found' }

  const distanceMi = haversineMiles(
    { lat: siteConfig.baseLat, lng: siteConfig.baseLng },
    { lat: geocoded.lat, lng: geocoded.lng },
  )

  const quote = getQuote({
    eventDate: parsed.data.eventDate,
    startTime: parsed.data.startTime,
    durationHours: parsed.data.durationHours,
    packageType: parsed.data.packageType,
    distanceMi,
    county: geocoded.county,
    state: geocoded.state,
    now: new Date(),
  })

  const html = await render(EstimateEmail({ locale: parsed.data.locale, quote }))
  const resend = new Resend(env.RESEND_API_KEY)
  try {
    await resend.emails.send({
      from: `${siteConfig.name} <noreply@${new URL(siteConfig.url).hostname}>`,
      to: parsed.data.email,
      subject:
        parsed.data.locale === 'es'
          ? 'Tu cotización de Mariachi El Cuis'
          : 'Your Mariachi El Cuis estimate',
      html,
    })
    return { ok: true }
  } catch {
    return { ok: false, error: 'send_failed' }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/actions/estimate-email.test.ts`
Expected: PASS (2 tests).
Run: `pnpm typecheck` — expect no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/estimate-email.ts src/app/actions/estimate-email.test.ts
git commit -m "feat: add sendEstimateEmailAction (re-quotes server-side, emails via Resend)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 12: `startCheckoutAction` server action

**Files:**
- Create: `src/app/actions/booking.ts`
- Test: `src/app/actions/booking.test.ts`

**Interfaces:**
- Consumes: `getQuote` (Task 4), `geocodeAddress` (Task 5), `laWallTimeToUtc` (Task 3),
  `createHoldEvent` (Task 6), `createDepositCheckoutSession` (Task 7), `features.stripe/calendar`
  (Task 1).
- Produces: `type StartCheckoutState = { ok: boolean; error?: string }`,
  `startCheckoutAction(_prev: StartCheckoutState, formData: FormData): Promise<StartCheckoutState>`
  — on success it calls Next's `redirect()` (which throws internally; the function never actually
  returns in that path). Task 14 drives this with `useActionState`, same shape as `submitContact`.
  The full `metadata` shape written into the Stripe session — `eventDate`, `startTime`,
  `enforcedHours`, `packageType`, `address`, `name`, `email`, `phone`, `total`, `deposit`,
  `balanceDue`, `locale`, `calendarEventId` — is exactly what Task 13's webhook handler reads back.

- [ ] **Step 1: Write the failing tests**

Create `src/app/actions/booking.test.ts`:

```ts
import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  features: { stripe: true, calendar: true },
  env: { NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' },
}))
vi.mock('@/lib/geo/geocode', () => ({ geocodeAddress: vi.fn() }))
vi.mock('@/lib/calendar/google', () => ({ createHoldEvent: vi.fn() }))
vi.mock('@/lib/payments/stripe', () => ({ createDepositCheckoutSession: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

afterEach(() => vi.resetAllMocks())

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const validFields = {
  eventDate: '2026-06-01',
  startTime: '15:00',
  durationHours: '1',
  packageType: 'seven_songs',
  address: '90011',
  email: 'customer@example.com',
  phone: '',
  name: 'Test Customer',
  locale: 'en',
}

test('returns the quote status as the error when the quote is not ok', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Orange County', // -> out_of_area
    state: 'CA',
  })
  const { startCheckoutAction } = await import('./booking')
  const result = await startCheckoutAction({ ok: false }, formData(validFields))
  expect(result).toEqual({ ok: false, error: 'contact_required' })
})

test('creates a calendar hold and a Stripe session, then redirects, for an ok quote', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  const { createHoldEvent } = await import('@/lib/calendar/google')
  const { createDepositCheckoutSession } = await import('@/lib/payments/stripe')

  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Los Angeles County',
    state: 'CA',
  })
  vi.mocked(createHoldEvent).mockResolvedValue('evt-1')
  vi.mocked(createDepositCheckoutSession).mockResolvedValue({
    url: 'https://checkout.stripe.com/session-1',
  })

  const { startCheckoutAction } = await import('./booking')
  await expect(startCheckoutAction({ ok: false }, formData(validFields))).rejects.toThrow(
    'NEXT_REDIRECT',
  )

  expect(createHoldEvent).toHaveBeenCalledOnce()
  const sessionArgs = vi.mocked(createDepositCheckoutSession).mock.calls[0][0]
  expect(sessionArgs.depositUsd).toBe(50)
  expect(sessionArgs.metadata.calendarEventId).toBe('evt-1')
  expect(sessionArgs.metadata.email).toBe('customer@example.com')

  const { redirect } = await import('next/navigation')
  expect(redirect).toHaveBeenCalledWith('https://checkout.stripe.com/session-1')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/app/actions/booking.test.ts`
Expected: FAIL with "Cannot find module './booking'".

- [ ] **Step 3: Implement**

Create `src/app/actions/booking.ts`:

```ts
'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getQuote } from '@/lib/quote'
import { laWallTimeToUtc } from '@/lib/quote/timezone'
import { geocodeAddress } from '@/lib/geo/geocode'
import { haversineMiles } from '@/lib/geo/distance'
import { createHoldEvent } from '@/lib/calendar/google'
import { createDepositCheckoutSession } from '@/lib/payments/stripe'
import { siteConfig } from '@/lib/config/site'
import { env, features } from '@/lib/env'

const inputSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.coerce.number().min(1).max(12),
  packageType: z.enum(['seven_songs', 'hourly']),
  address: z.string().trim().min(5).max(200),
  email: z.email(),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .optional()
    .or(z.literal('')),
  name: z.string().trim().min(2).max(100),
  locale: z.enum(['es', 'en']),
})

export type StartCheckoutState = { ok: boolean; error?: string }

export async function startCheckoutAction(
  _prev: StartCheckoutState,
  formData: FormData,
): Promise<StartCheckoutState> {
  const parsed = inputSchema.safeParse({
    eventDate: formData.get('eventDate'),
    startTime: formData.get('startTime'),
    durationHours: formData.get('durationHours'),
    packageType: formData.get('packageType'),
    address: formData.get('address'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    name: formData.get('name'),
    locale: formData.get('locale'),
  })
  if (!parsed.success) return { ok: false, error: 'validation' }
  if (!features.stripe) return { ok: false, error: 'not_configured' }

  const geocoded = await geocodeAddress(parsed.data.address)
  if (!geocoded) return { ok: false, error: 'address_not_found' }

  const distanceMi = haversineMiles(
    { lat: siteConfig.baseLat, lng: siteConfig.baseLng },
    { lat: geocoded.lat, lng: geocoded.lng },
  )

  const quote = getQuote({
    eventDate: parsed.data.eventDate,
    startTime: parsed.data.startTime,
    durationHours: parsed.data.durationHours,
    packageType: parsed.data.packageType,
    distanceMi,
    county: geocoded.county,
    state: geocoded.state,
    now: new Date(),
  })

  if (quote.status !== 'ok') return { ok: false, error: quote.status }

  let calendarEventId = ''
  if (features.calendar) {
    const eventStartUtc = laWallTimeToUtc(parsed.data.eventDate, parsed.data.startTime)
    const blockStart = new Date(eventStartUtc.getTime() - 30 * 60 * 1000)
    const blockEnd = new Date(blockStart.getTime() + quote.calendarBlockMinutes * 60 * 1000)
    calendarEventId = await createHoldEvent({
      summary: `HOLD — awaiting deposit — ${parsed.data.name}`,
      description: `Package: ${parsed.data.packageType}\nHours: ${quote.enforcedHours}\nAddress: ${parsed.data.address}\nPhone: ${parsed.data.phone || '—'}`,
      location: parsed.data.address,
      startUtc: blockStart,
      endUtc: blockEnd,
    })
  }

  const localePrefix = parsed.data.locale === 'en' ? '/en' : ''
  const { url } = await createDepositCheckoutSession({
    depositUsd: quote.deposit,
    customerEmail: parsed.data.email,
    successUrl: `${env.NEXT_PUBLIC_SITE_URL}${localePrefix}/book/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${env.NEXT_PUBLIC_SITE_URL}${localePrefix}/book`,
    metadata: {
      calendarEventId,
      eventDate: parsed.data.eventDate,
      startTime: parsed.data.startTime,
      enforcedHours: String(quote.enforcedHours),
      packageType: parsed.data.packageType,
      address: parsed.data.address,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || '',
      total: String(quote.total),
      deposit: String(quote.deposit),
      balanceDue: String(quote.balanceDue),
      locale: parsed.data.locale,
    },
  })

  redirect(url)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/actions/booking.test.ts`
Expected: PASS (2 tests).
Run: `pnpm typecheck` — expect no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/booking.ts src/app/actions/booking.test.ts
git commit -m "feat: add startCheckoutAction (calendar hold + Stripe deposit checkout)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 13: Stripe webhook route handler

**Files:**
- Create: `src/app/api/webhooks/stripe/route.ts`
- Test: `src/app/api/webhooks/stripe/route.test.ts`

**Interfaces:**
- Consumes: `verifyStripeWebhook` (Task 7), `confirmEvent`/`releaseHoldEvent` (Task 6),
  `BookingConfirmedEmail`/`OwnerNotificationEmail` (Task 8), `features.calendar/email` (Task 1).
- Produces: `POST(req: Request): Promise<Response>` at `/api/webhooks/stripe` — the URL to register
  in the Stripe Dashboard.

- [ ] **Step 1: Write the failing tests**

Create `src/app/api/webhooks/stripe/route.test.ts`:

```ts
import { afterEach, expect, test, vi } from 'vitest'

const send = vi.fn()
const confirmEvent = vi.fn()
const releaseHoldEvent = vi.fn()
const verifyStripeWebhook = vi.fn()

vi.mock('@/lib/payments/stripe', () => ({ verifyStripeWebhook }))
vi.mock('@/lib/calendar/google', () => ({ confirmEvent, releaseHoldEvent }))
vi.mock('resend', () => ({ Resend: vi.fn().mockImplementation(() => ({ emails: { send } })) }))
vi.mock('@/lib/env', () => ({
  features: { calendar: true, email: true },
  env: { RESEND_API_KEY: 're_x', CONTACT_TO_EMAIL: 'booking@mariachielcuis.com' },
}))

afterEach(() => vi.resetAllMocks())

function request(body: string): Request {
  return new Request('https://mariachielcuis.com/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': 'sig' },
  })
}

test('rejects a request with no stripe-signature header', async () => {
  const { POST } = await import('./route')
  const res = await POST(new Request('https://x', { method: 'POST', body: '{}' }))
  expect(res.status).toBe(400)
})

test('rejects a request whose signature fails verification', async () => {
  verifyStripeWebhook.mockImplementation(() => {
    throw new Error('bad signature')
  })
  const { POST } = await import('./route')
  const res = await POST(request('{}'))
  expect(res.status).toBe(400)
})

test('checkout.session.completed confirms the calendar event and emails both parties', async () => {
  verifyStripeWebhook.mockReturnValue({
    type: 'checkout.session.completed',
    data: {
      object: {
        metadata: {
          calendarEventId: 'evt-1',
          name: 'Test Customer',
          email: 'customer@example.com',
          locale: 'en',
          deposit: '50',
          balanceDue: '330',
          eventDate: '2026-06-01',
          startTime: '15:00',
          address: '90011',
        },
      },
    },
  })
  confirmEvent.mockResolvedValue({ alreadyConfirmed: false })
  send.mockResolvedValue({})

  const { POST } = await import('./route')
  const res = await POST(request('{}'))

  expect(res.status).toBe(200)
  expect(confirmEvent).toHaveBeenCalledWith('evt-1', expect.any(Object))
  expect(send).toHaveBeenCalledTimes(2) // customer + owner
})

test('checkout.session.completed is a no-op when already confirmed (retry-safe)', async () => {
  verifyStripeWebhook.mockReturnValue({
    type: 'checkout.session.completed',
    data: { object: { metadata: { calendarEventId: 'evt-1' } } },
  })
  confirmEvent.mockResolvedValue({ alreadyConfirmed: true })

  const { POST } = await import('./route')
  const res = await POST(request('{}'))

  expect(res.status).toBe(200)
  expect(send).not.toHaveBeenCalled()
})

test('checkout.session.expired releases the calendar hold', async () => {
  verifyStripeWebhook.mockReturnValue({
    type: 'checkout.session.expired',
    data: { object: { metadata: { calendarEventId: 'evt-1' } } },
  })
  releaseHoldEvent.mockResolvedValue(undefined)

  const { POST } = await import('./route')
  const res = await POST(request('{}'))

  expect(res.status).toBe(200)
  expect(releaseHoldEvent).toHaveBeenCalledWith('evt-1')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/app/api/webhooks/stripe/route.test.ts`
Expected: FAIL with "Cannot find module './route'".

- [ ] **Step 3: Implement**

Create `src/app/api/webhooks/stripe/route.ts`:

```ts
import { render } from '@react-email/render'
import { Resend } from 'resend'
import type Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { BookingConfirmedEmail } from '@/emails/booking-confirmed'
import { OwnerNotificationEmail } from '@/emails/owner-notification'
import { confirmEvent, releaseHoldEvent } from '@/lib/calendar/google'
import { siteConfig } from '@/lib/config/site'
import { env, features } from '@/lib/env'
import type { Locale } from '@/lib/i18n/locales'
import { verifyStripeWebhook } from '@/lib/payments/stripe'

export const runtime = 'nodejs'

export async function POST(req: Request): Promise<Response> {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = verifyStripeWebhook(payload, signature)
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const m = (session.metadata ?? {}) as Record<string, string>

    let alreadyConfirmed = false
    if (m.calendarEventId && features.calendar) {
      const result = await confirmEvent(m.calendarEventId, {
        summary: `Booking confirmed — ${m.name}`,
        description: `Package: ${m.packageType}\nHours: ${m.enforcedHours}\nAddress: ${m.address}\nPhone: ${m.phone || '—'}\nDeposit paid: $${m.deposit}\nBalance due: $${m.balanceDue}`,
      })
      alreadyConfirmed = result.alreadyConfirmed
    }

    if (!alreadyConfirmed && features.email) {
      const locale = (m.locale as Locale) ?? 'es'
      const resend = new Resend(env.RESEND_API_KEY)
      const fromAddress = `${siteConfig.name} <noreply@${new URL(siteConfig.url).hostname}>`

      const customerHtml = await render(BookingConfirmedEmail({ locale, metadata: m }))
      await resend.emails.send({
        from: fromAddress,
        to: m.email,
        subject:
          locale === 'es' ? 'Reserva confirmada — Mariachi El Cuis' : 'Booking confirmed — Mariachi El Cuis',
        html: customerHtml,
      })

      const ownerHtml = await render(OwnerNotificationEmail({ metadata: m }))
      await resend.emails.send({
        from: fromAddress,
        to: env.CONTACT_TO_EMAIL!,
        subject: `New booking — ${m.name}`,
        html: ownerHtml,
      })
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const m = (session.metadata ?? {}) as Record<string, string>
    if (m.calendarEventId && features.calendar) {
      await releaseHoldEvent(m.calendarEventId)
    }
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/api/webhooks/stripe/route.test.ts`
Expected: PASS (5 tests).
Run: `pnpm typecheck` — expect no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhooks/stripe/
git commit -m "feat: add Stripe webhook — confirms or releases the calendar hold, idempotently

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 14: Booking wizard UI

**Files:**
- Create: `src/components/booking/booking-wizard.tsx`
- Modify: `src/app/[lang]/book/page.tsx`
- Test: `tests/e2e/book.spec.ts` (new)

**Interfaces:**
- Consumes: `getQuoteAction` (Task 9), `checkAvailabilityAction` (Task 10),
  `sendEstimateEmailAction`/`SendEstimateState` (Task 11), `startCheckoutAction`/`StartCheckoutState`
  (Task 12), `weekdayIndexOf` (Task 3, safe to import client-side — no `server-only` guard on
  `timezone.ts`), `features` (Task 1, passed down as a prop from the server-rendered page so the
  client component never imports `@/lib/env` directly), `siteConfig`, `Locale`.
- Produces: `<BookingWizard locale={locale} features={{maps, calendar, stripe, email}} />`.

This is the biggest single file in the plan — a client component holding the wizard's local state and
wiring the four server actions together. It follows `ContactForm`'s conventions exactly (`useActionState`
+ `useFormStatus`, the same `inputCls`/`labelCls`/`errorCls` classnames, honeypot-free since there's no
free-text message field to spam).

- [ ] **Step 1: Write the failing E2E test**

Create `tests/e2e/book.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { checkA11y } from './axe'

// CI has none of GOOGLE_MAPS_API_KEY / calendar / stripe env vars set, so
// features.maps/calendar/stripe are all false — this exercises the
// graceful-degradation contract every integration must satisfy.
test('book page renders the wizard shell and stays accessible with no integrations configured', async ({
  page,
}) => {
  await page.goto('/book')
  await expect(page.locator('#main h1')).toBeVisible()
  await expect(page.getByLabel(/fecha del evento|event date/i)).toBeVisible()
  await checkA11y(page)
})

test('phone-only contact shows a Call Now link and no estimate form', async ({ page }) => {
  await page.goto('/en/book')
  await page.getByLabel(/i only have a phone/i).check()
  await expect(page.getByRole('link', { name: /call now/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /email me this estimate/i })).toHaveCount(0)
})

test('email contact shows the estimate button', async ({ page }) => {
  await page.goto('/en/book')
  await page.getByLabel(/^email$/i).fill('customer@example.com')
  await expect(page.getByRole('button', { name: /email me this estimate/i })).toBeVisible()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:e2e tests/e2e/book.spec.ts`
Expected: FAIL — `/book` still shows the old "coming soon" placeholder with no date field.

- [ ] **Step 3: Implement the wizard component**

Create `src/components/booking/booking-wizard.tsx`:

```tsx
'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { getQuoteAction } from '@/app/actions/quote'
import { checkAvailabilityAction } from '@/app/actions/availability'
import { sendEstimateEmailAction, type SendEstimateState } from '@/app/actions/estimate-email'
import { startCheckoutAction, type StartCheckoutState } from '@/app/actions/booking'
import { weekdayIndexOf } from '@/lib/quote/timezone'
import type { QuoteResult } from '@/lib/quote/types'
import { siteConfig } from '@/lib/config/site'
import type { Locale } from '@/lib/i18n/locales'

const COPY = {
  es: {
    eventDate: 'Fecha del evento',
    startTime: 'Hora de inicio',
    duration: 'Duración (horas)',
    sevenSongs: 'Paquete de 7 canciones ($380)',
    hourly: 'Por hora',
    address: 'Dirección del evento',
    checking: 'Calculando…',
    available: 'Disponible',
    unavailable: 'Esa fecha y hora ya está reservada — intenta otra.',
    total: 'Total estimado',
    deposit: 'Depósito',
    balance: 'Saldo (se paga el día del evento)',
    contactMethod: '¿Cómo prefieres que te contactemos?',
    byEmail: 'Correo electrónico',
    byPhone: 'Solo tengo teléfono',
    email: 'Correo electrónico',
    name: 'Nombre',
    phone: 'Teléfono (opcional)',
    emailEstimate: 'Enviarme esta cotización',
    emailEstimatePending: 'Enviando…',
    emailSent: 'Te enviamos la cotización por correo.',
    reserve: (amount: number) => `Reservar — pagar depósito de $${amount}`,
    reservePending: 'Redirigiendo…',
    callNow: 'Llamar ahora',
    notConfigured: 'Por ahora, llámanos o escríbenos por WhatsApp para tu cotización.',
    contactRequired: 'Para esta fecha necesitamos coordinar contigo directamente.',
    callRequired: 'Necesitamos que nos llames para confirmar esta reserva.',
  },
  en: {
    eventDate: 'Event date',
    startTime: 'Start time',
    duration: 'Duration (hours)',
    sevenSongs: '7-songs package ($380)',
    hourly: 'Hourly',
    address: 'Event address',
    checking: 'Checking…',
    available: 'Available',
    unavailable: 'That date and time is already booked — try another.',
    total: 'Estimated total',
    deposit: 'Deposit',
    balance: 'Balance (paid on the event day)',
    contactMethod: 'How should we reach you?',
    byEmail: 'Email',
    byPhone: 'I only have a phone',
    email: 'Email',
    name: 'Name',
    phone: 'Phone (optional)',
    emailEstimate: 'Email me this estimate',
    emailEstimatePending: 'Sending…',
    emailSent: 'We emailed you the estimate.',
    reserve: (amount: number) => `Reserve — pay $${amount} deposit`,
    reservePending: 'Redirecting…',
    callNow: 'Call Now',
    notConfigured: 'For now, please call us or message us on WhatsApp for your quote.',
    contactRequired: "We'll need to coordinate this date with you directly.",
    callRequired: 'Please call us to confirm this booking.',
  },
} as const

const inputCls =
  'mt-1 w-full rounded border border-charcoal-border bg-surface-container px-4 py-3 text-on-surface placeholder:text-muted-silver focus:border-burnished-gold focus:outline-none focus:ring-2 focus:ring-burnished-gold/40'
const labelCls = 'block text-sm font-medium text-crema-white'

function EstimateSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded bg-charcoal-elevated px-6 py-3 text-sm font-semibold uppercase tracking-wider text-crema-white transition-colors hover:bg-charcoal-border disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

function ReserveSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded bg-primary-container px-6 py-3 text-sm font-semibold uppercase tracking-wider text-on-primary transition-colors hover:bg-burnished-gold disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

const estimateInitial: SendEstimateState = { ok: false }
const checkoutInitial: StartCheckoutState = { ok: false }

export function BookingWizard({
  locale,
  features,
}: {
  locale: Locale
  features: { maps: boolean; calendar: boolean; stripe: boolean; email: boolean }
}) {
  const t = COPY[locale]

  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('15:00')
  const [durationHours, setDurationHours] = useState(1)
  const [packageType, setPackageType] = useState<'seven_songs' | 'hourly'>('seven_songs')
  const [address, setAddress] = useState('')
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [availability, setAvailability] = useState<{ checked: boolean; available?: boolean }>({
    checked: false,
  })
  const [, startQuoteTransition] = useTransition()

  const isWeekday = eventDate ? ![0, 6].includes(weekdayIndexOf(eventDate)) : true

  useEffect(() => {
    if (!features.maps || !eventDate || !startTime || address.trim().length < 5) {
      setQuote(null)
      return
    }
    const handle = setTimeout(() => {
      startQuoteTransition(async () => {
        const result = await getQuoteAction({
          eventDate,
          startTime,
          durationHours,
          packageType,
          address,
        })
        setQuote(result.ok ? result.quote : null)
      })
    }, 500)
    return () => clearTimeout(handle)
  }, [features.maps, eventDate, startTime, durationHours, packageType, address])

  useEffect(() => {
    if (!features.calendar || !quote || quote.status !== 'ok') {
      setAvailability({ checked: false })
      return
    }
    const currentQuote = quote
    const handle = setTimeout(() => {
      checkAvailabilityAction({
        eventDate,
        startTime,
        calendarBlockMinutes: currentQuote.calendarBlockMinutes,
      }).then(setAvailability)
    }, 500)
    return () => clearTimeout(handle)
  }, [features.calendar, quote, eventDate, startTime])

  const [estimateState, estimateFormAction] = useActionState(sendEstimateEmailAction, estimateInitial)
  const [checkoutState, checkoutFormAction] = useActionState(startCheckoutAction, checkoutInitial)

  const hiddenQuoteFields = (
    <>
      <input type="hidden" name="eventDate" value={eventDate} />
      <input type="hidden" name="startTime" value={startTime} />
      <input type="hidden" name="durationHours" value={durationHours} />
      <input type="hidden" name="packageType" value={packageType} />
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="locale" value={locale} />
    </>
  )

  return (
    <div className="max-w-xl space-y-6">
      {!features.maps ? (
        <p className="text-on-surface-variant">{t.notConfigured}</p>
      ) : (
        <>
          <div>
            <label htmlFor="wizard-date" className={labelCls}>
              {t.eventDate}
            </label>
            <input
              id="wizard-date"
              type="date"
              className={inputCls}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="wizard-time" className={labelCls}>
              {t.startTime}
            </label>
            <input
              id="wizard-time"
              type="time"
              className={inputCls}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <fieldset>
            <legend className={labelCls}>Package</legend>
            {isWeekday && (
              <label className="flex items-center gap-2 py-1">
                <input
                  type="radio"
                  name="package"
                  checked={packageType === 'seven_songs'}
                  onChange={() => setPackageType('seven_songs')}
                />
                {t.sevenSongs}
              </label>
            )}
            <label className="flex items-center gap-2 py-1">
              <input
                type="radio"
                name="package"
                checked={packageType === 'hourly'}
                onChange={() => setPackageType('hourly')}
              />
              {t.hourly}
            </label>
          </fieldset>

          {packageType === 'hourly' && (
            <div>
              <label htmlFor="wizard-duration" className={labelCls}>
                {t.duration}
              </label>
              <input
                id="wizard-duration"
                type="number"
                min={1}
                max={12}
                className={inputCls}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
              />
            </div>
          )}

          <div>
            <label htmlFor="wizard-address" className={labelCls}>
              {t.address}
            </label>
            <input
              id="wizard-address"
              type="text"
              className={inputCls}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {quote && (
            <div role="status" aria-live="polite" className="rounded border border-charcoal-border bg-surface-container p-5">
              {quote.status === 'ok' ? (
                <>
                  <p>
                    {t.total}: ${quote.total}
                  </p>
                  <p>
                    {t.deposit}: ${quote.deposit}
                  </p>
                  <p>
                    {t.balance}: ${quote.balanceDue}
                  </p>
                  {availability.checked && (
                    <p className="mt-2 font-semibold">
                      {availability.available ? t.available : t.unavailable}
                    </p>
                  )}
                </>
              ) : (
                <p>{quote.status === 'call_required' ? t.callRequired : t.contactRequired}</p>
              )}
            </div>
          )}
        </>
      )}

      <fieldset>
        <legend className={labelCls}>{t.contactMethod}</legend>
        <label className="flex items-center gap-2 py-1">
          <input
            type="radio"
            checked={contactMethod === 'email'}
            onChange={() => setContactMethod('email')}
          />
          {t.byEmail}
        </label>
        <label className="flex items-center gap-2 py-1">
          <input
            type="radio"
            checked={contactMethod === 'phone'}
            onChange={() => setContactMethod('phone')}
          />
          {t.byPhone}
        </label>
      </fieldset>

      {contactMethod === 'phone' ? (
        <a
          href={`tel:${siteConfig.phoneTel}`}
          className="inline-flex items-center justify-center rounded bg-primary-container px-6 py-3 text-sm font-semibold uppercase tracking-wider text-on-primary transition-colors hover:bg-burnished-gold"
        >
          {t.callNow} {siteConfig.phoneDisplay}
        </a>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="wizard-email" className={labelCls}>
              {t.email}
            </label>
            <input
              id="wizard-email"
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <form action={estimateFormAction} className="space-y-2">
            {hiddenQuoteFields}
            <input type="hidden" name="email" value={email} />
            <EstimateSubmitButton label={t.emailEstimate} pendingLabel={t.emailEstimatePending} />
            {estimateState.ok && <p role="status">{t.emailSent}</p>}
          </form>

          {quote?.status === 'ok' && features.stripe && (
            <div>
              <label htmlFor="wizard-name" className={labelCls}>
                {t.name}
              </label>
              <input
                id="wizard-name"
                type="text"
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label htmlFor="wizard-phone" className={labelCls}>
                {t.phone}
              </label>
              <input
                id="wizard-phone"
                type="tel"
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <form action={checkoutFormAction} className="mt-4">
                {hiddenQuoteFields}
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="name" value={name} />
                <input type="hidden" name="phone" value={phone} />
                <ReserveSubmitButton
                  label={t.reserve(quote.deposit)}
                  pendingLabel={t.reservePending}
                />
                {checkoutState.error && (
                  <p className="mt-2 text-sm text-red-400">{checkoutState.error}</p>
                )}
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Wire the wizard into `/book`**

Open `src/app/[lang]/book/page.tsx`. Add the import:

```ts
import { BookingWizard } from '@/components/booking/booking-wizard'
import { features } from '@/lib/env'
```

Replace the `<p className="mt-4 max-w-2xl rounded ...">{t.comingSoon}</p>` block (and the
`comingSoon` key can stay in `COPY`, just unused, or be deleted — delete it and its two locale
entries since nothing references it once the wizard replaces the message) with:

```tsx
<BookingWizard locale={locale} features={features} />
```

placed as a new `<Section>` between the intro `<Section>` and the pricing-explanation `<Section>`.

- [ ] **Step 5: Run the E2E test to verify it passes**

Run: `pnpm test:e2e tests/e2e/book.spec.ts`
Expected: PASS (3 tests).
Run: `pnpm test:e2e` (full suite) — expect all tests still green, no regressions on other pages.
Run: `pnpm typecheck && pnpm lint` — expect no errors (lint warnings only if pre-existing).

- [ ] **Step 6: Commit**

```bash
git add src/components/booking/ src/app/\[lang\]/book/page.tsx tests/e2e/book.spec.ts
git commit -m "feat: wire the booking wizard into /book (quote, calendar, email, deposit)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 15: `/book/success` confirmation page

**Files:**
- Create: `src/app/[lang]/book/success/page.tsx`
- Test: extend `tests/e2e/book.spec.ts`

**Interfaces:**
- Consumes: `buildMetadata`, `Section`, `isLocale`/`Locale` (existing patterns, same as every other
  page in `src/app/[lang]/`). No server action or adapter — this page only reads the `session_id`
  query param to display a thank-you message; the Stripe webhook (Task 13), not this page, is the
  source of truth for confirming anything.

- [ ] **Step 1: Write the failing test**

Append to `tests/e2e/book.spec.ts`:

```ts
test('booking success page renders a thank-you message', async ({ page }) => {
  await page.goto('/en/book/success?session_id=cs_test_123')
  await expect(page.locator('#main h1')).toBeVisible()
  await checkA11y(page)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:e2e tests/e2e/book.spec.ts -g "success"`
Expected: FAIL — 404, the route doesn't exist yet.

- [ ] **Step 3: Implement**

Create `src/app/[lang]/book/success/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { Section } from '@/components/ui/section'
import { siteConfig } from '@/lib/config/site'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { buildMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const COPY = {
  es: {
    title: 'Reserva en proceso',
    description: 'Tu depósito se está procesando.',
    heading: '¡Gracias!',
    body: 'Tu depósito se está procesando. Te enviaremos un correo de confirmación en cuanto el pago se complete.',
  },
  en: {
    title: 'Booking in progress',
    description: 'Your deposit is being processed.',
    heading: 'Thank you!',
    body: "Your deposit is being processed. We'll email you a confirmation as soon as the payment completes.",
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({ locale, path: '/book/success', title: t.title, description: t.description, noindex: true })
}

export default async function BookSuccessPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const t = COPY[lang]

  return (
    <main id="main">
      <Section>
        <h1 className="font-display text-3xl text-burnished-gold md:text-5xl">{t.heading}</h1>
        <p className="mt-4 max-w-2xl text-on-surface-variant">{t.body}</p>
        <p className="mt-4 text-on-surface-variant">{siteConfig.phoneDisplay}</p>
      </Section>
    </main>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:e2e tests/e2e/book.spec.ts`
Expected: PASS (4 tests total in this file).

- [ ] **Step 5: Commit**

```bash
git add src/app/\[lang\]/book/success/ tests/e2e/book.spec.ts
git commit -m "feat: add /book/success confirmation page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 16: One-time Google Calendar OAuth script (owner-run, not deployed)

**Files:**
- Create: `scripts/google-calendar-auth.mjs`
- Modify: `package.json` (add a `calendar:auth` script entry for convenience; add `open` as a
  devDependency to launch the consent URL in the owner's browser)

**Interfaces:** none — this script is never imported by the app. It is a standalone CLI the owner
runs once from their own machine to obtain `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID`
for Vercel's env vars. No automated test — it requires a real Google login, which cannot run in CI.
Verify it manually per the instructions below.

- [ ] **Step 1: Add the `open` devDependency**

```bash
pnpm add -D open
```

- [ ] **Step 2: Create the script**

Create `scripts/google-calendar-auth.mjs`:

```js
#!/usr/bin/env node
// One-time setup: run this locally to connect the owner's personal Gmail to
// the site's Google Calendar integration. Never deployed, never imported by
// the app. Requires GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET
// (from a Google Cloud Console OAuth client, "Desktop app" type) either in
// the environment or a local .env file next to this script.
import { createServer } from 'node:http'
import { google } from 'googleapis'
import open from 'open'

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET before running this.')
  process.exit(1)
}

const REDIRECT_URI = 'http://localhost:53682/oauth2callback'
const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // forces a refresh_token even on a re-auth
  scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'],
})

console.log('Opening your browser to authorize with the Gmail that should host the calendar...')
await open(authUrl)

const code = await new Promise((resolve) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, REDIRECT_URI)
    const c = url.searchParams.get('code')
    res.end('You can close this tab and return to the terminal.')
    server.close()
    resolve(c)
  })
  server.listen(53682)
})

const { tokens } = await oauth2Client.getToken(code)
oauth2Client.setCredentials(tokens)

console.log('\nGOOGLE_CALENDAR_REFRESH_TOKEN=' + tokens.refresh_token)

const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
const list = await calendar.calendarList.list()
let target = list.data.items?.find((c) => c.summary === 'Mariachi El Cuis — Bookings')

if (!target) {
  const created = await calendar.calendars.insert({
    requestBody: { summary: 'Mariachi El Cuis — Bookings' },
  })
  target = created.data
  console.log('Created a new calendar: "Mariachi El Cuis — Bookings"')
}

console.log('GOOGLE_CALENDAR_ID=' + target.id)
console.log('\nPaste both lines above into your Vercel project env vars, along with')
console.log('GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET (the values you used to run this).')
```

Add to `package.json`'s `"scripts"` block:

```json
"calendar:auth": "node scripts/google-calendar-auth.mjs"
```

- [ ] **Step 3: Verify manually (owner action, not part of automated testing)**

Once the owner has created an OAuth client (type: "Desktop app") in Google Cloud Console and added
`http://localhost:53682/oauth2callback` as an authorized redirect URI, they run:

```bash
GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... pnpm calendar:auth
```

Confirm the printed `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID` lines appear, then paste
all four `GOOGLE_*` vars into Vercel.

- [ ] **Step 4: Commit**

```bash
git add scripts/google-calendar-auth.mjs package.json pnpm-lock.yaml
git commit -m "feat: add one-time local script for Google Calendar OAuth setup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```

---

## Task 17: Final regression pass

**Files:** none new — this task only runs the full quality gate and fixes anything Tasks 1–16 missed
in combination (import cycles, a stray unused `comingSoon` copy key, etc).

**Interfaces:** none.

- [ ] **Step 1: Run the full unit suite**

Run: `pnpm test`
Expected: every test file passes, including all new ones from Tasks 1–13.

- [ ] **Step 2: Run typecheck and lint**

Run: `pnpm typecheck`
Expected: no errors.

Run: `pnpm lint`
Expected: no new warnings/errors beyond the pre-existing `video-facade.tsx` `no-img-element` warning.

- [ ] **Step 3: Run the full E2E suite**

Run: `pnpm test:e2e`
Expected: every test passes, including the pre-existing suite (home, media, services, faq, contact,
guides, static pages, headers, seo-files, shell, smoke, city, repertoire) with zero regressions, plus
the new `book.spec.ts`.

- [ ] **Step 4: Manual visual check**

Start the dev server (`pnpm dev`), open `/book` and `/en/book` in a browser, confirm: the wizard
shows the "not configured" fallback message (no `GOOGLE_MAPS_API_KEY` in local `.env`), the
contact-method radio toggles the Call Now button correctly, and the page is visually consistent
with the rest of the site (dark theme, gold accents, existing `Section`/typography classes).

- [ ] **Step 5: Commit (only if Step 1-3 required fixes)**

```bash
git add -A
git commit -m "fix: final regression pass for the booking wizard feature

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019ETxKdDk5mPNypD7ppXhRM"
```
