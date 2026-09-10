# Mariachi El Cuis — Website Design Spec

**Date:** 2026-09-10
**Status:** Draft for review
**Author:** Cesar Rios + Claude

---

## 1. Overview

A bilingual (Spanish-default, English) marketing and booking website for **Mariachi El Cuis**, a
Los Angeles mariachi service. The site must rank strongly in local and AI search, load fast, and be
fully accessible. Visitors can read about the service, browse repertoire and media, get an **instant
price quote** from their event address/city + date + time + duration, pay a **$100 deposit** online
(Stripe, or manually via PayPal / Zelle / Venmo with screenshot verification), and have confirmed
bookings written automatically to the owner's Google Calendar. A later phase adds an AI chatbot on
WhatsApp Business.

### Business facts

| Item | Value |
|---|---|
| Business name | Mariachi El Cuis |
| Home base (distance origin) | ZIP **90011**, Los Angeles, CA |
| Phone | (626) 922-0091 |
| Email | booking@mariachielcuis.com |
| Domain | `mariachielcuis.com` (apex, no `www`) — not yet registered |
| Service area for instant quotes | **Los Angeles County only** |
| Ensemble | **One** standard ensemble (no size tiers) |
| Brand assets on hand | Logo only (gold filigree wordmark on near-black) |

### Pricing & availability rules (source of truth)

**Monday–Friday**, within **25 driving miles** of 90011:
- **Option 1 — "7 Songs":** $380 flat. Calendar block = **1 hour**.
- **Option 2 — Hourly:** $500 / hour, no hour minimum.

**Monday–Friday, beyond 25 miles** (still in LA County): hourly only at $500/hour, with the
weekend-style **distance minimum hours** applied.

**Saturday & Sunday** (identical rules):
- Hourly only, **$550 / hour**.
- Start time must be **3:00 PM or later**.
- **Distance minimum hours** always applied.

**Distance minimum hours** (driving miles from 90011):

| Distance | Minimum hours |
|---|---|
| ≤ 15 mi | 2 |
| ≤ 30 mi | 3 |
| ≤ 50 mi | 4 |
| > 50 mi | +1 hour per additional 20 mi (5 at ≤70, 6 at ≤90, …) |

If the requested duration is below the applicable minimum, the engine **raises it to the minimum**
and returns a structured explanation for the UI. The "7 Songs" package is exempt (fixed set, not
hourly).

**All days:**
- Events must fall within **07:00–24:00** (weekend start still ≥ 15:00).
- **No maximum** booking length.
- **Deposit is always $100**, regardless of quote. Balance is paid later (cash / transfer, arranged
  directly with the owner) — the site does not collect the balance.

**Lead time** (now → event start):
- **< 3 hours:** no online booking — show "call us."
- **< 24 hours:** booking allowed, flagged `rush`.

**Out of area:** address outside Los Angeles County, or outside California → no instant quote; show a
"contact us" path.

**Cancellation policy:** deposit is **refundable only if cancelled 7 or more days before the event**.
Within 7 days the $100 deposit is non-refundable.

**Travel buffer:** the Google Calendar block = performance time **+ 30 minutes before + 30 minutes
after** (configurable). No monetary travel fee — distance affects only the minimum-hours rule and
the in/out-of-area decision.

---

## 2. Architecture

### Stack

- **Next.js 16.3.4** (App Router, TypeScript, Turbopack), React 19, **Tailwind CSS v4**.
  - The scaffold is currently Pages Router + JavaScript; Phase 1 migrates it to **App Router +
    TypeScript**. Follow the version-matched docs in `node_modules/next/dist/docs/` — this Next.js
    has breaking changes vs. training data (async `params`/`searchParams`, `proxy.ts` not
    `middleware.ts`, `sitemap.ts`/`robots.ts` conventions, etc.).
- **Hosting:** Vercel. Works on `*.vercel.app` until the domain is registered.
- **Database + file storage:** Supabase (Postgres + Storage). Typed access via **Drizzle**;
  migrations in-repo.
- **Email:** Resend (React Email templates).
- **Payments:** Stripe Checkout (hosted).
- **Maps:** Google Maps Platform — Geocoding API + Routes API (server-side only).
- **Calendar:** Google Calendar API via owner OAuth refresh token.
- **Chatbot (Phase 4):** Meta WhatsApp Cloud API + Claude.
- **Admin auth:** Auth.js, single credentials account.

### Rendering

- Server Components by default. All marketing/content pages **statically generated** for both
  locales via `generateStaticParams`; revalidated as needed.
- Client-side JavaScript limited to three lazy-loaded islands: the **booking wizard**, the **Stripe
  payment step**, and the **Google Places address autocomplete**. Content pages ship near-zero JS.
- `metadataBase` / canonical base comes from `NEXT_PUBLIC_SITE_URL` so preview deployments never
  emit production canonicals.

### Internationalization

- All routes nested under `app/[lang]/…`, `lang ∈ {es, en}`.
- **Spanish is the default and the root** — `mariachielcuis.com/` serves `es`; English at `/en/…`.
- `proxy.ts` redirects first-time visitors by `Accept-Language`; thereafter the locale is always in
  the URL.
- UI strings in `dictionaries/es.json` + `dictionaries/en.json`, loaded server-side only (no client
  bundle cost). Locale read via `next/root-params` rather than prop drilling.
- Same URL slugs across locales; locale distinguished by prefix; `hreflang` (`es`, `en`,
  `x-default`) links each pair.

### Canonical host

Apex `mariachielcuis.com`, HTTPS enforced, consistent no-trailing-slash.

---

## 3. SEO, structured data & AI crawling

### Metadata (every page, both locales)

`generateMetadata` produces:
- Absolute self-referencing `canonical`.
- `alternates.languages` with `es` / `en` / `x-default`.
- Open Graph + Twitter card tags.
- Title template `%s · Mariachi El Cuis`.
- Locale-appropriate description.
- Generated OG image (`opengraph-image.tsx`) — logo on the brand-dark background, per route.

### Sitemap / robots / llms.txt

- **`app/sitemap.ts`** — every static page + every city landing page, each with its `es`/`en`
  alternates, sensible `lastModified` / `priority` / `changeFrequency`. `/admin` and `/api` excluded.
- **`app/robots.ts`** — allow crawling, link the sitemap, `Disallow: /admin`, `/api`. Named AI
  crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot) **explicitly allowed**.
- **`/llms.txt`** — a curated Markdown summary (service, pricing, area, booking URL, contact),
  served from a Route Handler so it stays in sync with `quote_config`.

### Structured data (JSON-LD, inline `<script type="application/ld+json">`)

Rendered per Next.js guidance (escape `<` as `<`).

| Type | Where |
|---|---|
| `LocalBusiness` + `MusicGroup` | Home, About — name, logo, `areaServed` (LA County + city list), `priceRange`, `openingHours` reflecting real availability windows, `sameAs` |
| `Service` + `Offer` + `priceSpecification` | Services & Pricing — $380 package, $500/hr, $550/hr weekend |
| `FAQPage` | FAQ page, every city page |
| `BreadcrumbList` | All nested pages |
| `AggregateRating` / `Review` | Wired but dormant until real reviews exist |

All JSON-LD blocks are validated against schema.org in CI.

### Performance

- `next/font` self-hosted (Playfair Display headlines, Plus Jakarta Sans body), `display: swap`.
- `next/image` — AVIF/WebP, explicit dimensions (no CLS).
- **Icons:** inline SVG set (Lucide) at matching weights — **not** the Google Material Symbols
  variable font (too heavy for LCP).
- Stripe.js and Google Maps JS load **only** on the booking route, and only at the step that needs
  them.
- Security headers via `next.config` / `proxy.ts`: CSP, HSTS, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`.

### Quality gate

Lighthouse CI in the pipeline, build fails on regression: **Performance ≥ 95, SEO 100, Best
Practices 100, Accessibility 100**.

---

## 4. Content & pages

Every page exists in `es` (at `/…`) and `en` (at `/en/…`).

Slugs are identical across locales; the locale is carried only by the path prefix (`/…` for `es`,
`/en/…` for `en`). Slugs are in English for stability; localized display comes from the dictionaries.

| Route (es at `/…`, en at `/en/…`) | Purpose |
|---|---|
| `/` | Home — hero + quick availability bar, service-area grid, about teaser, repertoire teaser, media teaser, guides teaser, trust band, WhatsApp/phone CTA. `LocalBusiness`+`MusicGroup`. |
| `/services` | The real offer: Mon–Fri 7-song ($380) / hourly ($500), Sat–Sun hourly ($550, 3 PM+), distance minimums, deposit + balance, cancellation policy. `Service`+`Offer`. |
| `/book` | Instant quote + booking wizard. Indexable intro; deep steps `noindex`. |
| `/repertoire` | Filterable song list (starts from a standard mariachi catalog, owner-editable). Client-side filter only. |
| `/about` | Musicians / about. Placeholder-friendly until real bios/photos exist. |
| `/media` | Lazy-loaded YouTube / Instagram embeds (facade pattern — thumbnail first). |
| `/guides` + `/guides/[slug]` | MDX articles. Launch with ~4 cornerstone pieces. Internal-links to city pages + booking. |
| `/mariachi/[city]` | Programmatic city landing pages — curated **~15–20** LA County areas within ~30 mi of 90011. Unique hand-written intro + templated service/pricing/FAQ blocks driven by `cities.ts` (per-city distance from 90011 → accurate minimums shown). `LocalBusiness` + `FAQPage` + `BreadcrumbList`. Genuinely differentiated content, not doorway pages. |
| `/faq` | `FAQPage`. Also feeds the WhatsApp bot knowledge. |
| `/contact` | Form → email + admin; WhatsApp button; phone. |
| `/terms`, `/privacy` | Terms (incl. cancellation + payment terms), Privacy. Required for Stripe + data collection. |
| `/admin` | `noindex`, excluded from sitemap + robots. Not localized. |
| System | `sitemap.xml`, `robots.txt`, `/llms.txt`, `manifest`, `opengraph-image`, `not-found`, `error`. |

**Initial city list** (final set tuned during Phase 1): Huntington Park, Boyle Heights, East Los
Angeles, South Gate, Downey, Bell, Bell Gardens, Cudahy, Maywood, Lynwood, Montebello, Pico Rivera,
Whittier, Norwalk, Commerce, Paramount, Compton, Inglewood, Vernon, Los Angeles (citywide).

**Content sources:** MDX (guides/blog); typed TS data modules (`repertoire.ts`, `cities.ts`,
`faq.ts`, `services.ts`, and the pricing config); `es`/`en` dictionaries for UI strings.

**Design system** (from the supplied mockups — visual reference only, not their marketing copy):
- Tokens → Tailwind v4 `@theme`: `burnished-gold #EFB049`, `fiesta-crimson #C92A2A`,
  `crema-white #FDFBF7`, `surface #131315`, charcoal layers (`#1A1A1E`, `#24242A`, `#201f21`, …),
  `on-surface-variant #d5c4b0`.
- Type: Playfair Display (headlines), Plus Jakarta Sans (body).
- Layout: fixed header + desktop nav (Home · Musicians · Repertoire · Media · Guides/Blog · Instant
  Quote); mobile bottom tab bar with sticky Call / Get Quote.
- **Dropped from the mockups:** `user-scalable=no` (a11y fail), CDN Tailwind, placeholder JS, ensemble
  size tiers, Orange County service claims, insurance/award/"180+ events"/rating claims, invented
  musician bios.

**Accessibility:** semantic landmarks, skip link, visible focus, keyboard-operable wizard, labelled
fields with `aria-describedby` errors, `prefers-reduced-motion`. Target **WCAG 2.2 AA**. Body text
uses `crema-white` / `on-surface-variant`, never gold, to pass contrast.

---

## 5. Quote engine

A **pure TypeScript module** (`lib/quote/`) with no framework imports — unit-testable in isolation.
Geocoding and driving distance are injected as adapters.

### Input

```ts
{
  eventDate: string,        // ISO date
  startTime: string,        // "HH:mm", 24h
  durationHours: number,
  packageType: 'seven_songs' | 'hourly',   // seven_songs valid Mon–Fri only
  destination: { lat: number, lng: number, county: string, state: string }
}
```

### Pipeline

1. **Area check** — `county !== "Los Angeles County"` or `state !== "CA"` →
   `{ status: 'contact_required', reason: 'out_of_area' }`.
2. **Driving distance** — Routes API adapter → miles from the 90011 centroid.
3. **Day rules:**
   - **Mon–Fri, ≤ 25 mi:** offer `seven_songs` ($380 flat) and `hourly` ($500/h).
   - **Mon–Fri, > 25 mi:** `hourly` only ($500/h) + distance minimum.
   - **Sat & Sun:** `hourly` only ($550/h); `startTime` ≥ 15:00 else
     `{ status: 'contact_required', reason: 'weekend_early_start' }`; distance minimum always.
4. **Distance minimum hours** — table in §1. Below minimum → raise to minimum, return
   `minimumApplied: { requested, enforced, reason }`. `seven_songs` exempt.
5. **Time window** — event within 07:00–24:00.
6. **Lead time:** `< 3 h` → `{ status: 'call_required' }`; `< 24 h` → `rush: true`.
7. **Totals:** `total = rate × enforcedHours` (or `380` for `seven_songs`); `deposit = 100`;
   `balanceDue = total − 100`.

### Output

```ts
{ status: 'ok', currency: 'USD',
  lineItems: { label: string, amount: number }[],
  enforcedHours: number, total: number, deposit: 100, balanceDue: number,
  minimumApplied?: { requested: number, enforced: number, reason: string },
  rush?: boolean,
  calendarBlockMinutes: number,   // enforcedHours×60 (or 60) + 60 buffer
  disclaimers: string[] }
```
or `{ status: 'contact_required' | 'call_required', reason: string }` (message localized by the
caller).

### Configuration

Every constant — rates, radii, minimum table, buffers, hours window, deposit, base coordinates,
pay-to handles — lives in one typed `quoteConfig`, stored in `quote_config` (DB) and editable from
`/admin`. Changes are versioned and audit-logged. Retuning pricing requires **no deploy**. A
code-level default seeds the first row.

### Execution

`POST /api/quote` resolves the address (Geocoding API) and distance (Routes API) server-side with
the hidden key, then runs the pure engine. The booking wizard calls it on each step (debounced). The
WhatsApp bot calls the same engine via a tool — quotes are identical across surfaces.

### Testing

Exhaustive unit tests with mocked adapters: weekday vs weekend; each distance band; boundary miles
(14.9 / 15.0 / 15.1 / 30 / 50 / 70); Sunday 14:59 vs 15:00; lead-time cutoffs (2h59 / 3h / 23h /
25h); `seven_songs` vs `hourly`; minimum-bump cases; out-of-county; out-of-state. Plus CI contract
tests against live Google APIs (skipped when keys absent).

---

## 6. Payments

### Booking lifecycle

`draft → pending_payment | pending_verification → confirmed → completed | cancelled | expired`

The full quote and the $100 deposit are **recomputed server-side** at checkout and stored on the
booking. The client-supplied amount is never trusted. Stripe amounts always originate server-side.

### Stripe lane (automatic)

1. Wizard submit → create `bookings` row (`draft`) → re-run quote engine server-side → check slot
   (DB holds + Google free/busy) → create **Stripe Checkout Session** for $100 (hosted; no card data
   touches our servers; `metadata.bookingId`) → status `pending_payment` → redirect.
2. Webhook `checkout.session.completed` — verify `STRIPE_WEBHOOK_SECRET` signature, idempotent by
   event id → status `confirmed` → create Calendar event → send confirmation emails (owner +
   customer) → optional WhatsApp confirmation template.
3. Webhook `checkout.session.expired` / abandonment → a cron (`sync_jobs`) releases the hold after
   60 minutes; booking stays `draft`.

### Manual lane (PayPal / Zelle / Venmo)

1. Customer chooses manual pay → `bookings` row `pending_verification`, slot **soft-held**
   (`hold_expires_at = now + 48h`).
2. Show pay-to details from config (Zelle 626-922-0091 / Venmo handle / PayPal link) + a **screenshot
   upload** — image only, ≤ 10 MB, MIME/type-checked, EXIF stripped, stored in Supabase Storage;
   row in `payment_proofs`.
3. Customer submits → owner notified (email + `/admin` badge).
4. Owner in `/admin` reviews screenshot + claimed amount → **Approve** (status `confirmed`, Calendar
   event, emails) or **Reject** (status `cancelled`, slot released, optional reason emailed).
5. Hold-expiry cron: `pending_verification` past `hold_expires_at` with no proof → auto-expire,
   release slot, notify customer.

Soft-holds count against availability so two visitors cannot hold the same slot.

### Refunds

Initiated from `/admin`. Stripe: a refund button calls the Stripe API. Manual methods: owner refunds
outside the system and marks the booking. The 7-day policy is displayed as guidance; the owner
decides.

### Security

Stripe Checkout (hosted, PCI-minimal). Webhook signature verification. Rate limiting on `/api/quote`
and booking-creation endpoints.

---

## 7. Google Calendar integration

- **Auth:** one-time OAuth consent by the owner (personal Gmail), scope `calendar.events`. The
  **refresh token is encrypted** (`ENCRYPTION_KEY`) and stored in `integrations`. `/admin` shows a
  "Connect Google Calendar" button + connection status + reconnect.
- **Dedicated calendar:** on first connect, create or let the owner select
  "Mariachi El Cuis — Bookings"; store `calendar_id`.
- **On confirm:** create an event —
  - title `{eventType} — {customerName}`
  - description: package, duration, address, phone, special requests, deposit paid, balance due
  - location: event address
  - start/end: performance time **± 30 min buffer**
  - extended property `bookingId`
  - customer added as attendee only if configured (no invite spam by default)
  - store `calendar_event_id` + `calendar_sync_status` on the booking.
- **On cancel / reschedule:** delete or patch the event.
- **Availability read:** the wizard calls the **free/busy** API for the requested window + buffer;
  busy → slot not offered. Combined with DB soft-holds. Cached ~60 s.
- **Resilience:** if a calendar write fails at confirm time, the paid booking **still confirms**; the
  failure is enqueued in `sync_jobs`, surfaced in `/admin` ("calendar sync failed — retry"), and
  retried by cron. A revoked/expired token (API 401) raises an admin "reconnect" alert; bookings
  continue to be recorded regardless.

---

## 8. WhatsApp AI chatbot *(Phase 4)*

- **Entry point:** the site's WhatsApp buttons are `wa.me/1XXXXXXXXXX?text=…` deep links with a
  prefilled greeting. **No on-site chat widget.**
- **Provider:** Meta **WhatsApp Cloud API**. Prerequisites (owner sets up): verified Meta Business
  account, a WhatsApp Business Account, a dedicated phone number (not one already on a personal
  WhatsApp), a permanent system-user access token, a webhook verify token, the app secret.
- **Webhook:** `GET /api/whatsapp/webhook` (verification) + `POST` (messages). `X-Hub-Signature-256`
  verified. Inbound messages **enqueued** so a slow LLM call never trips Meta's retry window.
- **Brain:** Claude. System prompt assembled from the site's own content (services, live
  `quote_config`, FAQ, city data, policies) + per-`wa_id` conversation history
  (`wa_conversations` / `wa_messages`). Replies in the user's language (ES/EN).
- **Tools:**
  - `get_quote` → the same quote engine.
  - `check_availability` → DB holds + Calendar free/busy.
  - `create_booking_link` → deep link into the web wizard, prefilled with collected details, plus a
    Stripe deposit link. **Payment never happens in chat.**
  - `handoff_to_human` → flags the thread in `/admin`, notifies the owner, bot goes silent on that
    thread.
- **Guardrails:** the model may never state a price without calling `get_quote`; out-of-area /
  call-required responses come verbatim from the engine status. Message length + rate caps. All
  conversations logged.
- **Human takeover:** `/admin` conversation view — read the thread, toggle "take this one" (pauses
  the bot), send manual replies via the Cloud API inside the 24-hour customer-service window.
  Proactive messages use pre-approved templates.
- **Cost control:** LLM calls only on inbound user messages; short context window; cached system
  prompt.

---

## 9. Admin dashboard (`/admin`)

- **Auth:** Auth.js with a single credentials account (`admin_users`, hashed password). Signed
  session cookie. `/admin/*` gated in `proxy.ts`. `noindex`. Optional TOTP 2FA later.
- **Views:**
  - **Bookings** — filterable table (status / date / method) + detail drawer: full quote breakdown,
    customer contact, address + map link, payment status, calendar-sync status, special requests.
  - **Verification queue** — `pending_verification` bookings with screenshot preview + claimed
    amount → one-click Approve / Reject (+ reason).
  - **Calendar** — connection status, reconnect, list of synced events, retry failed syncs.
  - **WhatsApp** *(Phase 4)* — conversation list, unread / handoff badges, thread view, takeover
    toggle, manual send.
  - **Quote config** — edit rates, radii, minimum table, buffers, hours window, deposit, pay-to
    handles; versioned + audit-logged.
- **Owner notifications:** email on every new booking, verification request, calendar-sync failure,
  WhatsApp handoff. Optional web push.

---

## 10. Data model (Postgres / Supabase, via Drizzle)

- **`bookings`** — `id`, `locale`, `status`, `event_type`, `package_type`, `event_date`,
  `start_time`, `duration_hours`, `enforced_hours`, `address_raw`, `lat`, `lng`, `distance_mi`,
  `quote_total`, `deposit`, `balance_due`, `minimum_applied` (jsonb), `rush` (bool),
  `customer_name`, `customer_phone`, `customer_email`, `special_requests`, `payment_method`,
  `payment_status`, `stripe_session_id`, `stripe_payment_intent`, `calendar_event_id`,
  `calendar_sync_status`, `hold_expires_at`, `created_at`, `updated_at`.
- **`payment_proofs`** — `id`, `booking_id`, `storage_path`, `claimed_amount`, `claimed_method`,
  `submitted_at`, `reviewed_by`, `review_status`, `review_reason`.
- **`quote_config`** — active row + history: `rates` (jsonb), `radii` (jsonb),
  `minimum_table` (jsonb), `buffers` (jsonb), `hours_window` (jsonb), `deposit`,
  `payto_handles` (jsonb), `base_coords` (jsonb), `version`, `updated_by`, `updated_at`.
- **`integrations`** — `provider` (`google_calendar` | `whatsapp` | `stripe`), encrypted token
  fields, `calendar_id`, `status`, `last_error`, `updated_at`.
- **`wa_conversations`** *(Phase 4)* — `wa_id`, `locale`, `bot_paused`, `handoff_at`, `created_at`.
- **`wa_messages`** *(Phase 4)* — `id`, `conversation_id`, `direction`, `body`, `tool_calls` (jsonb),
  `sent_at`.
- **`audit_log`** — `actor`, `action`, `entity`, `before` (jsonb), `after` (jsonb), `created_at`.
- **`admin_users`** — `email`, `password_hash`, `totp_secret` (nullable).
- **`sync_jobs`** — `type`, `payload` (jsonb), `attempts`, `run_after`, `status`, `last_error`.

All access is server-only; no public client reads.

---

## 11. Transactional notifications

- **Provider:** Resend. Sending domain `mariachielcuis.com` with SPF / DKIM / DMARC (owner adds DNS
  records once the domain is live).
- **Templates:** React Email, bilingual (matches the booking's locale).
  - **Customer:** deposit received / booking confirmed (date, time, address, balance due,
    cancellation policy, `.ics` attachment); manual-payment received (pending verification); booking
    approved; booking rejected; reminder 3 days before *(later)*.
  - **Owner:** new booking; verification request; calendar-sync failure; WhatsApp handoff; daily
    summary *(later)*.
- **SMS:** out of scope for v1. WhatsApp is the messaging channel.

---

## 12. Testing & quality gates

- **Unit (Vitest):** quote engine (exhaustive, §5); `quote_config` validation; geocode/distance
  adapter parsing; webhook signature verification; availability / overlap logic.
- **Integration:** `/api/quote`; booking creation; Stripe webhook → confirm → calendar (Google +
  Stripe mocked); manual-lane approve / reject; hold expiry.
- **E2E (Playwright):** full booking both lanes, both locales; wizard keyboard-only pass; admin
  verification flow.
- **Accessibility:** `axe-core` in Playwright on every page; manual screen-reader pass on the wizard.
  WCAG 2.2 AA. Palette contrast audit.
- **Performance / SEO:** Lighthouse CI budget gate — Performance ≥ 95, SEO 100, Best Practices 100,
  Accessibility 100; build fails on regression. Bundle-size check on content routes.
- **Structured data:** every JSON-LD block validated against schema.org in CI.
- **CI:** GitHub Actions — ESLint (flat config) + `tsc`, unit, integration, build, Playwright,
  Lighthouse. Per-PR Vercel preview deploy.

---

## 13. Secrets & configuration

All configuration via environment variables (Vercel envs; `.env.local` for dev). Nothing hardcoded.

```
NEXT_PUBLIC_SITE_URL
DATABASE_URL
SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY
GOOGLE_MAPS_API_KEY                       # Geocoding + Routes, server-only
GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REDIRECT_URI
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY / EMAIL_FROM
WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN / WHATSAPP_VERIFY_TOKEN / WHATSAPP_APP_SECRET   # Phase 4
AUTH_SECRET
ADMIN_EMAIL / ADMIN_PASSWORD_HASH
ENCRYPTION_KEY                            # wraps stored refresh tokens
```

**Startup validation (zod):** the app boots and runs with any optional integration absent. A missing
key **disables that feature** and shows a clear `/admin` "not configured" state — it never crashes.
The validator reports what is and isn't configured.

---

## 14. Deployment & phased build order

**Host:** Vercel. **Domain:** `mariachielcuis.com` apex once registered (runs on the `*.vercel.app`
URL until then).

Each phase is independently shippable; nothing in a later phase blocks an earlier one going live.

### Phase 1 — Public site + SEO foundation
App Router + TypeScript migration; design system from the mockups; i18n (es/en); all content pages;
city landing pages; `sitemap` / `robots` / `llms.txt`; JSON-LD; OG images; security headers;
Lighthouse gate. **Ships with a contact form + WhatsApp deep link + phone** — starts ranking.

### Phase 2 — Quote engine + booking + payments
`lib/quote/` module; `POST /api/quote`; booking wizard (desktop long-form + sticky quote card;
mobile 3-step); Supabase + Drizzle schema; Stripe lane; manual lane + screenshot upload; admin
(bookings + verification queue + quote config); Resend emails.

### Phase 3 — Google Calendar
OAuth connect flow; event write on confirm; free/busy in the wizard; `sync_jobs` retry queue; admin
calendar view.

### Phase 4 — WhatsApp AI bot
Cloud API webhook; queue; Claude brain + tools; `wa_*` tables; admin conversation view + takeover.

### Phase 5 — Digital contract + e-signature
Generate the performance agreement from booking data; capture signature; countersigned PDF; attach
to the confirmation email.

---

## 15. Open items for the owner (not blockers)

- Register `mariachielcuis.com`; create the personal Gmail for Calendar; create the Stripe account;
  create the Google Cloud project (billing enabled) for Maps + OAuth.
- Provide: real musician bios/photos, media links (YouTube/Instagram), the repertoire song list,
  final Venmo/PayPal handles, and the exact legal business name for receipts/terms.
- Confirm the final city list for landing pages during Phase 1.
- Meta Business verification for WhatsApp (Phase 4) — start early, it can take time.
