# Digital contract: in-wizard typed signature + countersigned PDF

Status: draft, awaiting owner review. Implements Phase 5 of
`2026-09-10-mariachi-el-cuis-website-design.md` with a built-in e-signature (no
DocuSign/external vendor).

Decisions locked with the owner (2026-09-15):

- **Signing approach:** built-in typed signature — customer types their legal name and checks an
  "I agree" box. Valid under the ESIGN Act / UETA for service contracts; no paid vendor.
- **Sign timing:** inside the booking wizard, *before* the Stripe deposit. No unsigned bookings
  can exist.
- **Record format:** a personalized, countersigned **PDF** of the performance agreement is
  generated when the deposit clears and attached to both the customer confirmation email and
  the owner notification email.
- **Balance timing:** unchanged from current terms — balance due on the event day, before or at
  the start of the performance. (Owner's verbal note said "after the gig"; they confirmed
  keeping current copy when shown the conflict. Flagged in §9 for final legal review.)

## 1. Scope

1. A new `src/lib/contract/` module: the bilingual agreement text (single source of truth,
   versioned) + PDF rendering.
2. Booking wizard gains an **Agreement step** (shown once the quote is bookable): full
   personalized agreement, required checkbox, typed-signature input.
3. `startCheckoutAction` validates the signature and records evidence in Stripe metadata.
4. The Stripe webhook generates the countersigned PDF and attaches it to both emails; email
   copy updated to reference the attached agreement and the payment rules.
5. The public `/terms` page is updated with the new clauses so public terms and the signed
   contract never contradict each other.

Out of scope (deferred): DocuSign/BoldSign integration, post-payment signing links with
reminders, storing signed PDFs in a database or blob store (email + Stripe metadata are the
record), admin UI.

## 2. The agreement — `src/lib/contract/terms.ts`

Single source of truth, fully bilingual (`es` / `en`), no user-facing strings elsewhere.

```ts
export const CONTRACT_VERSION = '2026-09-15' // bump on any clause change

export type ContractBooking = {
  name: string
  email: string
  phone: string
  eventDate: string   // "YYYY-MM-DD"
  startTime: string   // "HH:mm"
  enforcedHours: number
  packageType: PackageType
  address: string
  total: number
  deposit: number
  balanceDue: number
  locale: Locale
  signatureName: string
  signedAt: string    // ISO timestamp, server-generated
}

export type ContractClause = { heading: string; body: string[] }

export function getClauses(locale: Locale): ContractClause[]       // static clauses
export function buildAgreementText(booking: ContractBooking): string // plain-text rendering (emails/tests)
```

### Clauses (both locales, owner to review wording)

1. **Parties & booking** — agreement is between the client (name/email/phone) and Mariachi El
   Cuis directly (not an agency); event date, start time, hours, address, package.
2. **Price, deposit, and balance** — total, deposit paid, balance due on the event day before
   or at the start of the performance. Deposit refundable only if the client cancels 7+ days
   before the event (existing rule, restated here).
3. **Payment methods** — balance payable in cash or Zelle. **No checks**, except checks
   delivered at least 3 business days before the event date.
4. **Performance sets and breaks** — the band performs for the hours booked; standard
   structure is a 15-minute break after the first hour, then sets of ~45 minutes followed by
   15-minute breaks, adjusted to the total hours booked.
5. **Band members and substitutes** — the engagement is with Mariachi El Cuis as a group, not
   specific individuals. Members may be absent due to illness or personal time off; at least
   80% of the regular members will be present, and any substitute musician will be of equal or
   greater talent.
6. **Changes and cancellations** — a change of event address or date may change the price and
   the band's availability/commitment; the band will confirm any revised quote in writing.
   Cancellation refund rule restated.
7. **Insurance** — event or liability insurance (e.g., certificates of insurance for venues) is
   not included in the quote and is available at additional cost.
8. **Media and commercial productions** — television, commercials, broadcasts, film, and
   similar productions are priced under a separate agreement; this contract does not cover
   them.
9. **Signature block** — client typed signature (`signatureName`), `signedAt`, contract
   version; band countersignature block (see §5).

`CONTRACT_VERSION` is embedded in the PDF and in Stripe metadata so any signed agreement can be
traced back to the exact clause text in git history.

## 3. Wizard agreement step — `src/components/booking/booking-wizard.tsx`

Rendered only when `quote?.status === 'ok'` (and, if calendar is on, the slot is available),
directly above the reserve button:

- The full agreement for the current locale, personalized via `buildAgreementText`-equivalent
  React rendering (same clauses, live booking values).
- Required checkbox: "I have read and agree to the performance agreement" /
  "He leído y acepto el contrato de presentación".
- Required input: "Legal signature (type your full name)" / "Firma legal (escribe tu nombre
  completo)".
- `checkoutReady` additionally requires `agreed && signatureName.trim().length >= 2`.
- Reserve form submits `agreed` and `signatureName` along with the existing hidden fields.
- New copy keys stay component-local in `COPY`, matching the existing pattern.

## 4. Server action — `src/app/actions/booking.ts`

- `inputSchema` gains: `agreed: z.literal('on')`, `signatureName: z.string().trim().min(2).max(100)`.
- On validation failure the wizard shows the existing inline error pattern.
- Stripe session `metadata` gains (all ≤ 500 chars):
  - `contractVersion: CONTRACT_VERSION`
  - `signatureName`
  - `signedAt: new Date().toISOString()` (server-side; never trust the client clock)
- Quote is recomputed server-side as today, so the amounts the customer signed for are the
  amounts charged.

## 5. PDF generation — `src/lib/contract/pdf.tsx`

- New dependency: **`@react-pdf/renderer`** (Node runtime, returns a Buffer; stylistically
  consistent with the existing `@react-email/*` usage).
- `export async function buildAgreementPdf(booking: ContractBooking): Promise<Buffer>`:
  - Header: Mariachi El Cuis, title "Performance Agreement" / "Contrato de Presentación",
    `CONTRACT_VERSION`.
  - Booking summary table (date, time, hours, address, package, total, deposit paid, balance
    due).
  - All clauses from `getClauses(locale)`.
  - Signature blocks: client typed name + signedAt timestamp; band countersignature rendered
    automatically at payment time — "Mariachi El Cuis — {ownerLegalName}, Authorized
    representative" with the payment-confirmation date.
  - Brand styling kept simple (dark text on white; print-friendly, unlike the site's dark
    theme).
- `ownerLegalName` is added to `siteConfig` (not an env var — not secret).

## 6. Webhook + emails — `src/app/api/webhooks/stripe/route.ts`

On `checkout.session.completed`, after calendar confirmation and when `!alreadyConfirmed`:

1. Build `ContractBooking` from session metadata.
2. `const pdf = await buildAgreementPdf(booking)` →
   `attachments: [{ filename: 'performance-agreement.pdf', content: pdf.toString('base64') }]`
   on **both** the customer and owner Resend sends.
3. **Graceful degradation:** PDF generation is wrapped in try/catch — on failure the emails
   still send without the attachment and the error is logged (consistent with the
   integration-degradation rule in `env.ts`); the owner email notes the attachment failure.

Email copy changes:

- `src/emails/booking-confirmed.tsx` — add a line referencing the attached signed agreement;
  payment-methods line (cash or Zelle on the event day; checks only if received 3+ business
  days before the event). Balance-due timing copy unchanged.
- `src/emails/owner-notification.tsx` — show `signatureName`, `signedAt`, `contractVersion`,
  and attach the same PDF (owner's countersigned copy).

## 7. Terms page — `src/app/[lang]/terms/page.tsx`

Add sections mirroring contract clauses 4, 5, 7, 8 (sets/breaks, members/substitutes,
insurance, media pricing) and extend the payment-methods section with the check rule, so the
public terms never contradict a signed contract. Keep the `TODO: owner/lawyer review` comment.

## 8. Evidence & records

- **Stripe session metadata:** `contractVersion`, `signatureName`, `signedAt` — queryable in
  the Stripe dashboard per payment.
- **Emails:** both parties receive the identical countersigned PDF (the durable record).
- **Google Calendar event description** (owner-facing): append `Contract v{version} signed by
  {signatureName} at {signedAt}` in `confirmEvent` details.
- No database or blob storage is introduced.

## 9. Testing

- `src/lib/contract/terms.test.ts` — version format; both locales return all 9 clauses;
  `buildAgreementText` interpolates name/date/address/amounts/signature.
- `src/lib/contract/pdf.test.ts` — returns a Buffer starting with `%PDF`; contains the client
  name and version (parse-free smoke check via byte length + magic bytes is enough; content
  assertions stay in terms.test.ts).
- `src/app/actions/booking` tests (new, mirroring `address-suggestions.test.ts` patterns) —
  missing `agreed` → `validation`; short `signatureName` → `validation`; metadata includes the
  three new keys on success (mock Stripe).
- `src/app/api/webhooks/stripe/route.test.ts` — extend: Resend mock receives `attachments`
  with base64 content on both sends; PDF failure → emails still sent, no attachment.
- `tests/e2e/book.spec.ts` — agreement section visible after a bookable quote; reserve button
  blocked until checkbox + signature; happy path signs and proceeds to (stubbed) checkout.

## 10. Future upgrade paths (not built)

- Swap signature capture for DocuSign/BoldSign: `terms.ts` clauses and the wizard step remain;
  only evidence capture and PDF countersigning move to the vendor.
- Persist signed PDFs to Vercel Blob/Supabase when a database is added.
- Post-payment signing links for phone bookings taken manually by the owner.

## 11. Open items for the owner

- Legal review of the final clause wording (especially substitution %, insurance, and media
  carve-out) — marked with the existing owner/lawyer TODO on the terms page.
- Confirm balance timing: current copy keeps "before or at the start of the performance";
  verbal note mentioned "after the gig" — one-line change if that wins.
- Confirm `ownerLegalName` for the countersignature block.
- Insurance: typical cost wording ("available at additional cost") is intentionally vague until
  a real per-event price exists.
