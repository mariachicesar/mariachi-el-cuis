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
import { effectDelayMs } from './schedule'

const COPY = {
  es: {
    eventDate: 'Fecha del evento',
    startTime: 'Hora de inicio',
    duration: 'Duración (horas)',
    packageLabel: 'Paquete',
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
    byEmail: 'Por correo electrónico',
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
    reserveUnavailable: 'Esta fecha y hora ya no está disponible — elige otro horario para reservar.',
    noCalendarNotice: 'Confirmaremos la disponibilidad cuando te llamemos.',
    noStripeNotice: 'Llámanos para confirmar y coordinar el depósito.',
    errorValidation: 'Revisa los datos del formulario e intenta de nuevo.',
    errorNotConfigured: 'Por ahora, llámanos o escríbenos por WhatsApp para tu cotización.',
    errorAddressNotFound: 'No pudimos encontrar esa dirección — verifica que esté bien escrita.',
    errorCallRequired: 'Necesitamos que nos llames para confirmar esta reserva.',
    errorContactRequired: 'Para esta fecha necesitamos coordinar contigo directamente.',
    errorSlotUnavailable: 'Esa fecha y hora ya está reservada — intenta otra.',
    errorSendFailed: 'No pudimos enviar el correo — intenta de nuevo o llámanos.',
    errorGeneric: 'Algo salió mal — por favor llámanos para confirmar tu reserva.',
  },
  en: {
    eventDate: 'Event date',
    startTime: 'Start time',
    duration: 'Duration (hours)',
    packageLabel: 'Package',
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
    byEmail: 'By email',
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
    reserveUnavailable: 'That date and time is no longer available — pick another time to reserve.',
    noCalendarNotice: "We'll confirm availability when we call you.",
    noStripeNotice: 'Call us to confirm and arrange the deposit.',
    errorValidation: 'Please check the form fields and try again.',
    errorNotConfigured: 'For now, please call us or message us on WhatsApp for your quote.',
    errorAddressNotFound: "We couldn't find that address — please check it and try again.",
    errorCallRequired: 'Please call us to confirm this booking.',
    errorContactRequired: "We'll need to coordinate this date with you directly.",
    errorSlotUnavailable: 'That date and time is already booked — try another.',
    errorSendFailed: "We couldn't send the email — please try again or call us.",
    errorGeneric: 'Something went wrong — please call us to confirm your booking.',
  },
} as const

type Copy = (typeof COPY)[Locale]

function checkoutErrorMessage(t: Copy, error: StartCheckoutState['error']): string {
  switch (error) {
    case 'validation':
      return t.errorValidation
    case 'not_configured':
      return t.errorNotConfigured
    case 'address_not_found':
      return t.errorAddressNotFound
    case 'call_required':
      return t.errorCallRequired
    case 'contact_required':
      return t.errorContactRequired
    case 'slot_unavailable':
      return t.errorSlotUnavailable
    default:
      return t.errorGeneric
  }
}

function estimateErrorMessage(t: Copy, error: SendEstimateState['error']): string {
  switch (error) {
    case 'validation':
      return t.errorValidation
    case 'not_configured':
      return t.errorNotConfigured
    case 'address_not_found':
      return t.errorAddressNotFound
    case 'send_failed':
      return t.errorSendFailed
    default:
      return t.errorGeneric
  }
}

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

function ReserveSubmitButton({
  label,
  pendingLabel,
  disabled,
}: {
  label: string
  pendingLabel: string
  disabled?: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
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
  const [isQuotePending, startQuoteTransition] = useTransition()

  const isWeekday = eventDate ? ![0, 6].includes(weekdayIndexOf(eventDate)) : true

  // setQuote/setAvailability are only ever invoked from inside the
  // setTimeout callback (never synchronously in the effect body) — calling
  // setState synchronously within an effect body trips
  // `react-hooks/set-state-in-effect` (cascading-render lint). But the
  // "reset to null/false because inputs just went stale" branch must not
  // share the fetch's debounce delay — a stale quote/availability result
  // would otherwise linger on screen for up to DEBOUNCE_MS after e.g. the
  // address is cleared. `effectDelayMs` gives the reset branch a 0ms delay
  // (still deferred, so the lint rule is satisfied) while the fetch branch
  // keeps the real debounce.
  useEffect(() => {
    const isValidQuoteInput =
      features.maps && !!eventDate && !!startTime && address.trim().length >= 5

    const handle = setTimeout(() => {
      if (!isValidQuoteInput) {
        setQuote(null)
        return
      }
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
    }, effectDelayMs(isValidQuoteInput))
    return () => clearTimeout(handle)
  }, [features.maps, eventDate, startTime, durationHours, packageType, address])

  useEffect(() => {
    const canCheckAvailability = features.calendar && quote !== null && quote.status === 'ok'

    const handle = setTimeout(() => {
      if (!canCheckAvailability || quote === null || quote.status !== 'ok') {
        setAvailability({ checked: false })
        return
      }
      checkAvailabilityAction({
        eventDate,
        startTime,
        calendarBlockMinutes: quote.calendarBlockMinutes,
      })
        .then(setAvailability)
        .catch(() => setAvailability({ checked: false }))
    }, effectDelayMs(canCheckAvailability))
    return () => clearTimeout(handle)
  }, [features.calendar, quote, eventDate, startTime])

  const [estimateState, estimateFormAction] = useActionState(sendEstimateEmailAction, estimateInitial)
  const [checkoutState, checkoutFormAction] = useActionState(startCheckoutAction, checkoutInitial)

  const isSlotUnavailable = availability.checked && availability.available === false

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
      {/*
        The date/time/package/address fields are core wizard inputs that do
        not themselves depend on Google Maps — only the geocoded price quote
        (below) and the Stripe/Calendar-gated actions do. So unlike a strict
        "hide everything behind features.maps" approach, these inputs always
        render; `t.notConfigured` is shown alongside them (not instead of
        them) whenever maps is unavailable, since the quote effect already
        no-ops in that case.
      */}
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
        <legend className={labelCls}>{t.packageLabel}</legend>
        {isWeekday && (
          <label className="flex items-center gap-2 py-1">
            <input
              type="radio"
              name="package"
              checked={packageType === 'seven_songs'}
              onChange={() => {
                setPackageType('seven_songs')
                setDurationHours(1)
              }}
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

      {!features.maps && <p className="text-on-surface-variant">{t.notConfigured}</p>}

      {isQuotePending && (
        <p role="status" aria-live="polite" className="text-on-surface-variant">
          {t.checking}
        </p>
      )}

      {quote && (
        <div
          role="status"
          aria-live="polite"
          className="rounded border border-charcoal-border bg-surface-container p-5"
        >
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
              {features.calendar ? (
                availability.checked && (
                  <p className="mt-2 font-semibold">
                    {availability.available ? t.available : t.unavailable}
                  </p>
                )
              ) : (
                <p className="mt-2 text-on-surface-variant">{t.noCalendarNotice}</p>
              )}
            </>
          ) : (
            <p>{quote.status === 'call_required' ? t.callRequired : t.contactRequired}</p>
          )}
        </div>
      )}

      <fieldset>
        <legend className={labelCls}>{t.contactMethod}</legend>
        <label className="flex items-center gap-2 py-1">
          <input
            type="radio"
            name="contactMethod"
            checked={contactMethod === 'email'}
            onChange={() => setContactMethod('email')}
          />
          {t.byEmail}
        </label>
        <label className="flex items-center gap-2 py-1">
          <input
            type="radio"
            name="contactMethod"
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
            {!estimateState.ok && estimateState.error && (
              <p role="alert" className="text-sm text-red-400">
                {estimateErrorMessage(t, estimateState.error)}
              </p>
            )}
          </form>

          {quote?.status === 'ok' && !features.stripe && (
            <p className="text-on-surface-variant">{t.noStripeNotice}</p>
          )}

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
              {isSlotUnavailable ? (
                <p className="mt-4 text-sm font-semibold text-red-400">{t.reserveUnavailable}</p>
              ) : (
                <form action={checkoutFormAction} className="mt-4">
                  {hiddenQuoteFields}
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="name" value={name} />
                  <input type="hidden" name="phone" value={phone} />
                  <ReserveSubmitButton
                    label={t.reserve(quote.deposit)}
                    pendingLabel={t.reservePending}
                    disabled={isQuotePending}
                  />
                  {checkoutState.error && (
                    <p className="mt-2 text-sm text-red-400">
                      {checkoutErrorMessage(t, checkoutState.error)}
                    </p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
