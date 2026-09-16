'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { getAddressSuggestionsAction } from '@/app/actions/address-suggestions'
import { getQuoteAction, type GetQuoteActionResult } from '@/app/actions/quote'
import { checkAvailabilityAction, type CheckAvailabilityResult } from '@/app/actions/availability'
import { sendEstimateEmailAction, type SendEstimateState } from '@/app/actions/estimate-email'
import { startCheckoutAction, type StartCheckoutState } from '@/app/actions/booking'
import { getClauses, CONTRACT_VERSION } from '@/lib/contract/terms'
import { weekdayIndexOf } from '@/lib/quote/timezone'
import type { QuoteResult } from '@/lib/quote/types'
import { siteConfig } from '@/lib/config/site'
import type { Locale } from '@/lib/i18n/locales'
import { PRICING } from '@/lib/data/pricing'
import {
  effectDelayMs,
  formatTime12Hour,
  minimumDurationForTime,
  sevenSongsAvailableForTime,
  weekendStartTimes,
} from './schedule'

const COPY = {
  es: {
    eventDate: 'Fecha del evento',
    startTime: 'Hora de inicio',
    saturdayTimeNotice: 'Los sábados ofrecemos horarios cada 30 minutos. La primera reserva entre 3:00 y 9:30 PM debe comenzar en punto; te mostraremos alternativas si no está disponible.',
    sundayTimeNotice: 'Los domingos ofrecemos horarios cada 30 minutos, de 8:00 AM a 11:00 PM.',
    duration: 'Duración (horas)',
    minimumDuration: (hours: number) => `Este horario requiere un mínimo de ${hours} horas.`,
    saturdayPackageNotice: 'El paquete de 7 canciones solo está disponible los sábados de 7:00 a 10:00 AM.',
    packageLabel: 'Paquete',
    sevenSongs: (price: number) => `Paquete de 7 canciones ($${price})`,
    hourly: 'Por hora',
    address: 'Dirección del evento',
    selectAddress: 'Selecciona una dirección de la lista para continuar.',
    noAddresses: 'No encontramos direcciones que coincidan. Intenta agregar calle, ciudad o código postal.',
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
    phone: 'Teléfono',
    emailEstimate: 'Enviarme esta cotización',
    emailEstimatePending: 'Enviando…',
    emailSent: 'Te enviamos la cotización por correo.',
    reserve: (amount: number) => `Reservar — pagar depósito de $${amount}`,
    reservePending: 'Redirigiendo…',
    agreementHeading: 'Contrato de presentación',
    agreementVersion: 'Versión',
    agreeLabel: 'He leído y acepto el contrato de presentación.',
    signatureLabel: 'Firma legal (escribe tu nombre completo)',
    errorAgreementRequired: 'Debes aceptar el contrato y escribir tu firma para reservar.',
    callNow: 'Llamar ahora',
    notConfigured: 'Por ahora, llámanos o escríbenos por WhatsApp para tu cotización.',
    contactRequired: 'Para esta fecha necesitamos coordinar contigo directamente.',
    callRequired: 'Necesitamos que nos llames para confirmar esta reserva.',
    reserveUnavailable: 'Esta fecha y hora ya no está disponible — elige otro horario para reservar.',
    noCalendarNotice: 'Confirmaremos la disponibilidad cuando te llamemos.',
    noStripeNotice: 'Llámanos para confirmar y coordinar el depósito.',
    errorValidation: 'Revisa los datos del formulario e intenta de nuevo.',
    errorNameRequired: 'Ingresa tu nombre.',
    errorEmailInvalid: 'Ingresa un correo electrónico válido.',
    errorPhoneRequired: 'Ingresa tu número de teléfono.',
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
    saturdayTimeNotice: 'Saturday times are offered every 30 minutes. The first booking from 3:00 to 9:30 PM must start on the hour; we will show alternatives when needed.',
    sundayTimeNotice: 'Sunday times are offered every 30 minutes, from 8:00 AM to 11:00 PM.',
    duration: 'Duration (hours)',
    minimumDuration: (hours: number) => `This time requires a ${hours}-hour minimum.`,
    saturdayPackageNotice: 'The 7-songs package is available on Saturdays only from 7:00 to 10:00 AM.',
    packageLabel: 'Package',
    sevenSongs: (price: number) => `7-songs package ($${price})`,
    hourly: 'Hourly',
    address: 'Event address',
    selectAddress: 'Select an address from the list to continue.',
    noAddresses: 'No matching addresses found. Try adding a street, city, or ZIP code.',
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
    phone: 'Phone',
    agreementHeading: 'Performance Agreement',
    agreementVersion: 'Version',
    agreeLabel: 'I have read and agree to the performance agreement.',
    signatureLabel: 'Legal signature (type your full name)',
    errorAgreementRequired: 'You must agree to the contract and type your signature to reserve.',
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
    errorNameRequired: 'Please enter your name.',
    errorEmailInvalid: 'Please enter a valid email address.',
    errorPhoneRequired: 'Please enter your phone number.',
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

function quoteErrorMessage(t: Copy, error: Extract<GetQuoteActionResult, { ok: false }>['error']): string {
  switch (error) {
    case 'validation':
      return t.errorValidation
    case 'not_configured':
      return t.errorNotConfigured
    case 'address_not_found':
      return t.errorAddressNotFound
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
  const [agreed, setAgreed] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [startTime, setStartTime] = useState('15:00')
  const [durationInput, setDurationInput] = useState('1')
  const [packageType, setPackageType] = useState<'seven_songs' | 'hourly'>('seven_songs')
  const [address, setAddress] = useState('')
  const [addressSelected, setAddressSelected] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([])
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [quoteError, setQuoteError] = useState<Extract<GetQuoteActionResult, { ok: false }>['error'] | null>(null)
  const [availability, setAvailability] = useState<CheckAvailabilityResult>({ checked: false })
  const [isQuotePending, startQuoteTransition] = useTransition()

  const isWeekday = eventDate ? ![0, 6].includes(weekdayIndexOf(eventDate)) : true
  const weekendTimes = eventDate ? weekendStartTimes(eventDate) : []
  const isWeekend = weekendTimes.length > 0
  const canChooseSevenSongs = sevenSongsAvailableForTime(eventDate, startTime)
  const minimumDurationHours = minimumDurationForTime(eventDate, startTime)
  const enteredDuration = Number(durationInput)
  const durationIsBelowMinimum =
    durationInput !== '' && Number.isFinite(enteredDuration) && enteredDuration < minimumDurationHours
  const durationHours =
    durationInput !== '' && Number.isFinite(enteredDuration)
      ? Math.max(minimumDurationHours, enteredDuration)
      : minimumDurationHours

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!canChooseSevenSongs && packageType === 'seven_songs') setPackageType('hourly')
    }, 0)
    return () => clearTimeout(handle)
  }, [canChooseSevenSongs, packageType])

  useEffect(() => {
    const query = address.trim()
    const handle = setTimeout(async () => {
      if (query.length < 3 || addressSelected) {
        setAddressSuggestions([])
        return
      }

      try {
        const result = await getAddressSuggestionsAction({ query })
        setAddressSuggestions(result.ok ? result.suggestions : [])
      } catch {
        setAddressSuggestions([])
      }
    }, effectDelayMs(query.length >= 3 && !addressSelected))
    return () => clearTimeout(handle)
  }, [address, addressSelected])

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
      features.maps && !!eventDate && !!startTime && durationInput !== '' && addressSelected

    const handle = setTimeout(() => {
      if (!isValidQuoteInput) {
        setQuote(null)
        setQuoteError(null)
        return
      }
      startQuoteTransition(async () => {
        try {
          const result = await getQuoteAction({
            eventDate,
            startTime,
            durationHours,
            packageType,
            address,
          })
          setQuote(result.ok ? result.quote : null)
          setQuoteError(result.ok ? null : result.error)
        } catch {
          setQuote(null)
          setQuoteError('address_not_found')
        }
      })
    }, effectDelayMs(isValidQuoteInput))
    return () => clearTimeout(handle)
  }, [features.maps, eventDate, startTime, durationHours, durationInput, packageType, address, addressSelected])

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
        durationHours: quote.enforcedHours,
      })
        .then(setAvailability)
        .catch(() => setAvailability({ checked: false }))
    }, effectDelayMs(canCheckAvailability))
    return () => clearTimeout(handle)
  }, [features.calendar, quote, eventDate, startTime])

  const [estimateState, estimateFormAction] = useActionState(sendEstimateEmailAction, estimateInitial)
  const [checkoutState, checkoutFormAction] = useActionState(startCheckoutAction, checkoutInitial)

  const isSlotUnavailable = availability.checked && availability.available === false
  const checkoutFieldErrors =
    checkoutState.error === 'validation' ? checkoutState.fieldErrors : undefined
  const checkoutReady =
    name.trim().length >= 2 &&
    email.trim() !== '' &&
    phone.trim().length >= 7 &&
    agreed &&
    signatureName.trim().length >= 2

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
          onInput={(e) => {
            const nextDate = e.currentTarget.value
            setEventDate(nextDate)
            setDurationInput((currentDuration) =>
              Math.max(Number(currentDuration) || 1, minimumDurationForTime(nextDate, startTime)).toString(),
            )
          }}
        />
      </div>

      <div>
        <label htmlFor="wizard-time" className={labelCls}>
          {t.startTime}
        </label>
        {isWeekend ? (
          <select
            id="wizard-time"
            className={inputCls}
            value={startTime}
            onChange={(e) => {
              const nextTime = e.target.value
              setStartTime(nextTime)
              setDurationInput((currentDuration) =>
                Math.max(Number(currentDuration) || 1, minimumDurationForTime(eventDate, nextTime)).toString(),
              )
            }}
          >
            {weekendTimes.map((time) => (
              <option key={time} value={time}>
                {formatTime12Hour(time)}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="wizard-time"
            type="time"
            step={15 * 60}
            className={inputCls}
            value={startTime}
            onChange={(e) => {
              const nextTime = e.target.value
              setStartTime(nextTime)
              setDurationInput((currentDuration) =>
                Math.max(Number(currentDuration) || 1, minimumDurationForTime(eventDate, nextTime)).toString(),
              )
            }}
          />
        )}
        {weekdayIndexOf(eventDate) === 6 && (
          <p className="mt-2 text-sm text-on-surface-variant">{t.saturdayTimeNotice}</p>
        )}
        {weekdayIndexOf(eventDate) === 0 && (
          <p className="mt-2 text-sm text-on-surface-variant">{t.sundayTimeNotice}</p>
        )}
      </div>

      <fieldset>
        <legend className={labelCls}>{t.packageLabel}</legend>
        {canChooseSevenSongs && (
          <label className="flex items-center gap-2 py-1">
            <input
              type="radio"
              name="package"
              checked={packageType === 'seven_songs'}
              onChange={() => {
                setPackageType('seven_songs')
                setDurationInput('1')
              }}
            />
            {t.sevenSongs(isWeekday ? PRICING.sevenSongsFlat : PRICING.weekendSevenSongsFlat)}
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

      {weekdayIndexOf(eventDate) === 6 && !canChooseSevenSongs && (
        <p className="text-sm text-on-surface-variant">{t.saturdayPackageNotice}</p>
      )}

      {packageType === 'hourly' && (
        <div>
          <label htmlFor="wizard-duration" className={labelCls}>
            {t.duration}
          </label>
          <input
            id="wizard-duration"
            type="number"
            min={minimumDurationHours}
            max={12}
            className={inputCls}
            value={durationInput}
            onChange={(e) => setDurationInput(e.target.value)}
            onBlur={() => setDurationInput(String(durationHours))}
          />
          {durationIsBelowMinimum && (
            <p role="alert" className="mt-2 text-sm text-red-400">
              {t.minimumDuration(minimumDurationHours)}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="wizard-address" className={labelCls}>
          {t.address}
        </label>
        <input
          id="wizard-address"
          type="text"
          autoComplete="off"
          className={inputCls}
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setAddressSelected(false)
          }}
        />
        {!addressSelected && address.trim().length >= 3 && (
          <div className="mt-2">
            {addressSuggestions.length > 0 ? (
              <ul role="listbox" aria-label={t.address} className="overflow-hidden rounded border border-charcoal-border">
                {addressSuggestions.map((suggestion) => (
                  <li key={suggestion} role="option" aria-selected="false">
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm text-crema-white hover:bg-charcoal-elevated"
                      onClick={() => {
                        setAddress(suggestion)
                        setAddressSelected(true)
                        setAddressSuggestions([])
                      }}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-on-surface-variant">{t.noAddresses}</p>
            )}
          </div>
        )}
        {!addressSelected && address.trim().length >= 3 && addressSuggestions.length > 0 && (
          <p className="mt-2 text-sm text-on-surface-variant">{t.selectAddress}</p>
        )}
        {quoteError && (
          <p role="alert" className="mt-2 text-sm text-red-400">
            {quoteErrorMessage(t, quoteError)}
          </p>
        )}
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
              {isSlotUnavailable ? (
                <div
                  role="alert"
                  className="rounded border border-red-400/60 bg-red-400/10 p-4 text-sm font-semibold text-red-400"
                >
                  {t.unavailable}
                  {availability.suggestions && availability.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availability.suggestions.map((s) => (
                        <button
                          key={s.startTime}
                          type="button"
                          onClick={() => setStartTime(s.startTime)}
                          className="rounded border border-red-400/60 bg-transparent px-3 py-1 text-sm font-normal text-crema-white hover:bg-red-400/20"
                        >
                          {formatTime12Hour(s.startTime)}–{formatTime12Hour(s.endTime)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
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
                      <div className="mt-2">
                        <p className="font-semibold">{t.available}</p>
                      </div>
                    )
                  ) : (
                    <p className="mt-2 text-on-surface-variant">{t.noCalendarNotice}</p>
                  )}
                </>
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
              required
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {checkoutFieldErrors?.email && (
              <p role="alert" className="mt-2 text-sm text-red-400">
                {t.errorEmailInvalid}
              </p>
            )}
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
                required
                minLength={2}
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {checkoutFieldErrors?.name && (
                <p role="alert" className="mt-2 text-sm text-red-400">
                  {t.errorNameRequired}
                </p>
              )}
              <label htmlFor="wizard-phone" className={labelCls}>
                {t.phone}
              </label>
              <input
                id="wizard-phone"
                type="tel"
                required
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {checkoutFieldErrors?.phone && (
                <p role="alert" className="mt-2 text-sm text-red-400">
                  {t.errorPhoneRequired}
                </p>
              )}
              {isSlotUnavailable ? (
                <p className="mt-4 text-sm font-semibold text-red-400">{t.reserveUnavailable}</p>
              ) : (
                <form action={checkoutFormAction} className="mt-4 space-y-4">
                  {hiddenQuoteFields}
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="name" value={name} />
                  <input type="hidden" name="phone" value={phone} />
                  <div className="rounded border border-charcoal-border bg-surface-container p-5">
                    <h3 className="font-display text-lg text-burnished-gold">
                      {t.agreementHeading}{' '}
                      <span className="text-sm font-normal text-muted-silver">
                        ({t.agreementVersion} {CONTRACT_VERSION})
                      </span>
                    </h3>
                    <div className="mt-3 max-h-64 space-y-4 overflow-y-auto pr-2 text-sm text-on-surface-variant">
                      {getClauses(locale).map((clause) => (
                        <div key={clause.heading}>
                          <p className="font-semibold text-crema-white">{clause.heading}</p>
                          {clause.body.map((paragraph) => (
                            <p key={paragraph} className="mt-1">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                    <label className="mt-4 flex items-start gap-2 text-sm text-crema-white">
                      <input
                        type="checkbox"
                        name="agreed"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1"
                      />
                      {t.agreeLabel}
                    </label>
                    <div className="mt-3">
                      <label htmlFor="wizard-signature" className={labelCls}>
                        {t.signatureLabel}
                      </label>
                      <input
                        id="wizard-signature"
                        type="text"
                        name="signatureName"
                        minLength={2}
                        className={inputCls}
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                      />
                    </div>
                  </div>
                  {(checkoutFieldErrors?.agreed || checkoutFieldErrors?.signatureName) && (
                    <p role="alert" className="text-sm text-red-400">
                      {t.errorAgreementRequired}
                    </p>
                  )}
                  <ReserveSubmitButton
                    label={t.reserve(quote.deposit)}
                    pendingLabel={t.reservePending}
                    disabled={isQuotePending || !checkoutReady}
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
