# Booking wizard: quote engine, Google Calendar availability, deposit checkout

Status: approved, implementing. Supersedes the payments/calendar/data-model sections of
`2026-09-10-mariachi-el-cuis-website-design.md` (§5–§10) **for this slice only** — this doc
describes a leaner build with no database and no `/admin`. The original spec's Supabase-backed
`bookings`/`quote_config`/admin dashboard remains the plan for whenever that's actually wanted;
nothing here forecloses building it later.

## 1. Scope

Replace the `/book` page's "coming soon" placeholder with a working flow:

1. Customer enters event date/time, package, and address.
2. Server geocodes the address, runs the quote engine, and — once date/time are picked — checks
   the owner's real Google Calendar for a conflict.
3. Customer enters an email (full flow) or phone-only (shown a "Call Now" button, flow ends there).
4. Email path: the estimate is sent by email immediately. If the quote is bookable, the customer can
   pay the deposit via Stripe Checkout, which places a hold on the calendar slot and confirms it on
   payment.

Out of scope (deferred, not blocked by this work): Supabase/`bookings` table, `/admin`, manual
payment lane (Zelle/Venmo/PayPal + screenshot review), WhatsApp bot, digital contract, SMS.

## 2. Quote engine — `src/lib/quote/`

Pure TypeScript, no framework imports, fully unit-testable. Extends the existing constants in
`src/lib/data/pricing.ts` (kept as the single source of truth for numbers; the engine imports it).

### Input

```ts
type QuoteInput = {
  eventDate: string        // "YYYY-MM-DD"
  startTime: string         // "HH:mm", 24h
  durationHours: number     // ignored for seven_songs (always a 1h block)
  packageType: 'seven_songs' | 'hourly'
  distanceMi: number        // resolved by the geocode adapter before calling the engine
  county: string | null     // from geocode adapter; null/mismatch -> contact_required
  state: string | null
  now: Date                 // injected for testability; server passes `new Date()`
}
```

### Pipeline (in order — first failing check wins)

1. **Area check** — `state !== 'CA'` or `county !== 'Los Angeles County'` →
   `{ status: 'contact_required', reason: 'out_of_area' }`.
2. **Day rules** (`eventDate`'s weekday):
   - **Mon–Fri, `distanceMi` ≤ 25:** `packageType` may be `seven_songs` ($380 flat, 1h block) or
     `hourly` ($500/h, no hour minimum).
   - **Mon–Fri, `distanceMi` > 25:** `packageType` forced to `hourly`; distance-minimum hours apply
     (below).
   - **Sat/Sun:** `packageType` forced to `hourly` ($550/h); `startTime < '15:00'` →
     `{ status: 'contact_required', reason: 'weekend_early_start' }`; distance-minimum always
     applies.
3. **Distance-minimum hours** — `PRICING.minimumTable` (≤15mi→2h, ≤30mi→3h, ≤50mi→4h, then +1h per
   extra 20mi past 50). If `durationHours` is below the enforced minimum, `enforcedHours` is raised
   and `minimumApplied: { requested, enforced }` is set on the result. `seven_songs` is exempt
   (`enforcedHours` is always 1 for it).
4. **Hours window** — the event (`startTime` → `startTime + enforcedHours`) must fall within
   07:00–24:00 → else `{ status: 'contact_required', reason: 'outside_hours' }`.
5. **Lead time** — `leadHours = (eventDate+startTime) - now`, in hours:
   - `< 3` → `{ status: 'call_required', reason: 'lead_time' }` (blocks the online flow entirely).
   - `>= 3 and < 24` → `rush: true`.
   - `>= 24` → normal.
6. **Totals:**
   - `total = packageType === 'seven_songs' ? 380 : rate(day) * enforcedHours`
   - `normalDeposit = 50 * enforcedHours` (so `seven_songs`, whose `enforcedHours` is 1, deposits
     $50)
   - `deposit = rush ? Math.max(150, normalDeposit) : normalDeposit`
   - `balanceDue = total - deposit`
   - `calendarBlockMinutes = enforcedHours * 60 + 60` (30 min buffer each side)

### Output

```ts
type QuoteResult =
  | {
      status: 'ok'
      currency: 'USD'
      lineItems: { label: string; amount: number }[]
      enforcedHours: number
      total: number
      deposit: number
      balanceDue: number
      rush: boolean
      minimumApplied?: { requested: number; enforced: number }
      calendarBlockMinutes: number
    }
  | { status: 'contact_required'; reason: 'out_of_area' | 'weekend_early_start' | 'outside_hours' }
  | { status: 'call_required'; reason: 'lead_time' }
```

Reason strings are mapped to localized copy by the caller (component-local `COPY`, matching the
rest of the site) — the engine itself returns no user-facing text.

### Testing (`src/lib/quote/quote.test.ts`)

Exhaustive, mirroring the original spec's list: weekday vs weekend; each distance band and its
boundaries (14.9/15.0/15.1, 29.9/30/30.1, 49.9/50/50.1, 70); Sunday 14:59 vs 15:00; lead-time
boundaries (2h59/3h00/23h59/24h00); `seven_songs` vs `hourly`; minimum-bump cases; out-of-county;
out-of-state; deposit tiers (normal, rush-below-$150, rush-above-$150 "greater-of").

## 3. Location & distance — `src/lib/geo/geocode.ts`

Free-text address field. Server-only adapter calls the Google **Geocoding API**
(`GOOGLE_MAPS_API_KEY`) with the address, parses the response's `address_components` for
`administrative_area_level_2` (county) and `administrative_area_level_1` (state), and returns
`{ lat, lng, county, state } | null` (null → geocoding failed, surfaced as a form error, not
`contact_required`).

Distance uses the **existing** `haversineMiles` (`src/lib/geo/distance.ts`) from `siteConfig.baseLat/
baseLng` — straight-line, matching how `cityDistanceMi` already computes city-page distances. No
Routes/Distance Matrix API, no new library: one more `fetch` call alongside the existing adapter
pattern.

`features.maps` (in `src/lib/env.ts`) gates this — if `GOOGLE_MAPS_API_KEY` is absent, the address
step shows a "call us for a quote" fallback instead of the live form (matches the "app boots and
degrades gracefully with any integration absent" rule already documented in `env.ts`).

## 4. Google Calendar — `src/lib/calendar/google.ts`

Uses the `googleapis` package's `calendar_v3` client with an `OAuth2Client` built from
`GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` / `GOOGLE_CALENDAR_REFRESH_TOKEN`, against
`GOOGLE_CALENDAR_ID`. Four functions:

- `checkAvailability(startISO, endISO)` → `freebusy.query` → `boolean` (true = free).
- `createHoldEvent(details)` → creates a tentative event (`summary: "HOLD — awaiting deposit — {name}"`)
  spanning the calendar block; returns `eventId`.
- `confirmEvent(eventId, details)` → `events.patch` — rewrites summary/description/location to the
  final booking details (package, duration, address, phone, deposit paid, balance due).
- `releaseHoldEvent(eventId)` → `events.delete` (used when a Checkout session expires unpaid).

`features.calendar` gates this. If absent, the wizard skips the live availability check (shows a
neutral "we'll confirm availability when we call you" note) but the rest of the flow (quote, email,
even Stripe checkout) still works — calendar is enhancement, not a hard dependency, per the same
graceful-degradation rule.

### One-time OAuth setup (owner-run, not deployed)

`scripts/google-calendar-auth.mjs` — a local Node script (added to the repo, **not** part of the
app bundle or any route). Run once from the owner's machine after they've created the OAuth client
in Google Cloud Console:

1. Prompts for `GOOGLE_OAUTH_CLIENT_ID`/`SECRET` (or reads them from a local `.env` if present).
2. Builds the consent URL for scope `https://www.googleapis.com/auth/calendar.events`, opens it in
   the owner's browser.
3. Owner logs in with the Gmail that will host the calendar and approves.
4. The script's tiny localhost HTTP listener catches the OAuth redirect, exchanges the code for
   tokens, and prints the **refresh token**.
5. The script then lists the owner's calendars (creating "Mariachi El Cuis — Bookings" if it
   doesn't exist yet) and prints its `calendarId`.
6. Owner pastes both values into Vercel's env vars. No token ever touches the deployed app's build
   or a database.

## 5. Deposit checkout — Stripe

`src/lib/payments/stripe.ts` wraps the `stripe` Node SDK (`STRIPE_SECRET_KEY`). Hosted **Checkout**
(redirect) — no card data touches the server, no client-side Stripe.js/publishable key needed.

Flow (`src/app/actions/booking.ts`, a server action):

1. Re-run the quote engine **server-side** from the submitted fields (never trust a client-computed
   total/deposit).
2. If `status !== 'ok'`, stop (this action is only reachable once the wizard shows a bookable quote).
3. Call `createHoldEvent` (if `features.calendar`) → tentative calendar event for the requested
   slot. This is the only "hold" mechanism — no database row.
4. Create a Stripe Checkout Session: `mode: 'payment'`, `amount = deposit * 100` (cents),
   `expires_at: now + 30min`, `success_url: /book/success?session_id={CHECKOUT_SESSION_ID}`,
   `cancel_url: /book`, and **all booking details in `metadata`** (date, time, hours, package,
   address, distance, total, deposit, balance, customer name/email/phone, `calendarEventId`) —
   metadata is the only place state lives between "checkout started" and "webhook fires".
5. Redirect the customer to the session URL.

`src/app/api/webhooks/stripe/route.ts` (Route Handler, verifies `STRIPE_WEBHOOK_SECRET` signature):

- `checkout.session.completed` → read `metadata`, fetch the calendar event by `calendarEventId`
  first: if its summary no longer starts with `HOLD —` (i.e. already confirmed), return 200 without
  re-sending anything — this is the idempotency check. Otherwise call `confirmEvent(...)`, then send
  the customer confirmation and owner notification emails (§6).
  (An in-memory de-dupe set was considered and rejected: Vercel functions are stateless per
  invocation/cold start, so it wouldn't reliably catch Stripe's retries. Checking the calendar
  event's own state works because it's the durable record and the check is naturally idempotent —
  a repeat webhook for an already-confirmed event is a no-op.)
- `checkout.session.expired` → `releaseHoldEvent(metadata.calendarEventId)`, freeing the slot.
  `events.delete` on an already-deleted event is a 404 the handler treats as success (already
  released), so this is idempotent too.

`features.stripe` gates the "Reserve — pay deposit" button; if absent, the estimate email still
sends and the wizard shows "call us to confirm and arrange the deposit" instead.

## 6. Emails — React Email + Resend

`@react-email/components` is already a dependency (unused so far) — this is what turns it on.
Templates in `src/emails/`, bilingual (rendered with the booking's locale), sent via the same
`Resend` client pattern as `src/app/actions/contact.ts`:

- `estimate.tsx` — sent the moment the quote engine returns `ok` and the customer submits their
  email. Full price breakdown, minimum-hours note if applied, rush note if applied, cancellation
  policy line, and (if `features.stripe`) a link back to `/book` to complete the deposit.
- `booking-confirmed.tsx` — sent on `checkout.session.completed`. Date/time/address, package,
  amount paid, balance due, cancellation policy, a calendar `.ics` attachment.
- `owner-notification.tsx` — sent alongside `booking-confirmed.tsx`, to `CONTACT_TO_EMAIL`.

`features.email` (already defined) gates all of these — unchanged from the contact form's existing
behavior.

## 7. Wizard UI — `/book`

Single-page progressive form (`src/components/booking/booking-wizard.tsx`, client component;
replaces the "coming soon" block in `src/app/[lang]/book/page.tsx`, the static pricing summary
below it stays as-is):

1. **Event details** — date, start time, package (`seven_songs` shown only Mon–Fri), duration
   (hidden/fixed at 1h for `seven_songs`), address text field.
   - Debounced call to a `getQuote` server action on every change once the required fields are
     filled; renders the live price breakdown or the `contact_required`/`call_required` message.
2. **Availability** — once date/time are valid and `status: 'ok'`, a debounced call to a
   `checkAvailability` server action shows "available" / "this time is already booked — try another"
   inline (skipped gracefully if `!features.calendar`).
3. **Contact** — email or phone (at least one required; matches the existing `contactSchema`
   shape for the phone field). Two buttons:
   - Email present → **"Email me this estimate"** (server action, §6) always available once the
     quote is `ok` or `contact_required`/`call_required` (the estimate email explains why, and gives
     the phone number, when not bookable online); if `ok` and `features.stripe`, a second
     **"Reserve — pay ${deposit} deposit"** button (redirects to Stripe).
   - Phone only, no email → the form's submit is replaced by a single prominent **Call Now**
     (`tel:` link) button — no server action runs, no online payment, matching the phone-only
     answer from brainstorming.

`/book/success/page.tsx` — plain confirmation page shown after the Stripe redirect (reads
`session_id` only to display a "thank you" — the webhook, not this page, is the source of truth for
confirming the booking).

## 8. Config & env

`src/lib/env.ts` gains (all `.optional()`, matching the existing pattern):

```
GOOGLE_MAPS_API_KEY
GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_CALENDAR_REFRESH_TOKEN / GOOGLE_CALENDAR_ID
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
```

New `features` flags: `maps`, `calendar`, `stripe` (each `true` only when every var it needs is
present) — following the existing `features.email` pattern exactly.

`src/lib/data/pricing.ts` — add the deposit formula as named constants (`rushFlatDeposit: 150`,
`depositPerHour: 50`) and rewrite `pricingLines()` copy: replace the flat "$100 deposit" line with
one describing the tiered deposit (normal: $50/hour; last-minute (3–24h out): the greater of $150 or
that; under 3h: call us). Update `mariachi-quote-rules` memory and any static copy (`/terms`,
`/faq`) that states the old flat $100 to match.

## 9. New dependencies

`googleapis` (Calendar OAuth2 + API client), `stripe` (Node SDK). Both server-only — no client
bundle impact (verified by keeping every adapter in `'server-only'`-guarded modules, matching
`src/lib/env.ts`'s own guard).

## 10. Testing

- **Unit (Vitest):** the quote engine (§2), the geocode adapter's response parsing (mocked
  `fetch`), the calendar adapter (mocked `googleapis` client) for its date-math (block start/end ±
  buffer), the deposit "greater-of" logic in isolation.
- **E2E (Playwright):** the app must still boot and pass the existing suite with none of the new env
  vars set (graceful-degradation contract) — add a case asserting `/book` shows the "call us"
  fallback for address/calendar/checkout when `features.maps`/`calendar`/`stripe` are all false (the
  default in the test environment, since CI has no real Google/Stripe credentials). Assert the
  phone-only path shows the Call Now button and never calls a server action. a11y (`checkA11y`) on
  the wizard in both language and both feature states reachable without live credentials.
- Real Google/Stripe calls are never exercised in CI — this matches the original spec's own
  "integration tests... Stripe webhook → confirm → calendar (Google + Stripe mocked)" approach.

## 11. File layout (new/changed)

```
src/lib/quote/{index.ts,types.ts,quote.test.ts}
src/lib/geo/geocode.ts (+ geocode.test.ts)
src/lib/calendar/google.ts (+ google.test.ts)
src/lib/payments/stripe.ts
src/emails/{estimate.tsx,booking-confirmed.tsx,owner-notification.tsx}
src/components/booking/{booking-wizard.tsx,quote-preview.tsx,contact-step.tsx}
src/app/actions/{quote.ts,availability.ts,estimate-email.ts,booking.ts}
src/app/api/webhooks/stripe/route.ts
src/app/[lang]/book/page.tsx (updated — mount the wizard)
src/app/[lang]/book/success/page.tsx (new)
scripts/google-calendar-auth.mjs (owner-run, not part of the app)
src/lib/env.ts, src/lib/data/pricing.ts (updated)
```

## 12. Explicitly deferred

Supabase/Postgres, `/admin`, manual payment lane + screenshot proof, WhatsApp bot, digital contract,
SMS, `.ics` beyond the confirmation-email attachment, refunds (owner still handles these directly
per the existing cancellation-policy copy). None of this work forecloses building those later — the
Stripe metadata and Calendar events carry enough detail that a database could be introduced
afterward to index/search past bookings without changing the checkout flow itself.
