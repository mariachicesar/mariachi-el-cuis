'use client'

import { useActionState, useEffect, useState } from 'react'
import { getAddressSuggestionsAction } from '@/app/actions/address-suggestions'
import { effectDelayMs } from '@/components/booking/schedule'
import { sendAgreementAction, sendPaymentLinkAction, type AdminActionState } from './actions'

const initialState: AdminActionState = { ok: false }

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  marginTop: '4px',
  marginBottom: '12px',
  background: '#1c1c1e',
  color: '#F5EFE3',
  border: '1px solid #444',
  borderRadius: '4px',
}

const MONEY_PATTERN = '\\d+(\\.\\d{1,2})?'

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', color: '#ccc' }

function ErrorMessage({ state }: { state: AdminActionState }) {
  if (state.ok) return <p style={{ color: '#7ee787' }}>{state.message}</p>
  if (state.error === 'validation') return <p style={{ color: '#ff8080' }}>Check the highlighted fields.</p>
  if (state.error === 'not_configured')
    return <p style={{ color: '#ff8080' }}>Missing server configuration (email/Stripe/calendar env vars).</p>
  if (state.error === 'send_failed') return <p style={{ color: '#ff8080' }}>Failed to send the email. Try again.</p>
  return null
}

// Same Google-backed autocomplete as the public booking wizard. Picking a
// suggestion verifies the address; an address Google can't find (new build,
// rural spot) can still be submitted as typed, with a warning to double-check.
function AddressField() {
  const [address, setAddress] = useState('')
  const [selected, setSelected] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    const query = address.trim()
    const handle = setTimeout(async () => {
      if (query.length < 3 || selected) {
        setSuggestions([])
        return
      }
      try {
        const result = await getAddressSuggestionsAction({ query })
        setSuggestions(result.ok ? result.suggestions : [])
      } catch {
        setSuggestions([])
      }
    }, effectDelayMs(query.length >= 3 && !selected))
    return () => clearTimeout(handle)
  }, [address, selected])

  const showList = !selected && address.trim().length >= 3

  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={labelStyle}>
        Event address
        <input
          style={{ ...inputStyle, marginBottom: 0 }}
          name="address"
          autoComplete="off"
          required
          minLength={5}
          maxLength={200}
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setSelected(false)
          }}
        />
      </label>
      {selected && <p style={{ color: '#7ee787', fontSize: '13px', margin: '4px 0 0' }}>✓ Verified by Google</p>}
      {showList &&
        (suggestions.length > 0 ? (
          <ul
            role="listbox"
            aria-label="Address suggestions"
            style={{ listStyle: 'none', margin: '4px 0 0', padding: 0, border: '1px solid #444', borderRadius: '4px' }}
          >
            {suggestions.map((suggestion) => (
              <li key={suggestion} role="option" aria-selected="false">
                <button
                  type="button"
                  onClick={() => {
                    setAddress(suggestion)
                    setSelected(true)
                    setSuggestions([])
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 8px',
                    textAlign: 'left',
                    background: '#1c1c1e',
                    color: '#F5EFE3',
                    border: 'none',
                    borderBottom: '1px solid #333',
                    cursor: 'pointer',
                  }}
                >
                  {suggestion}
                </button>
              </li>
            ))}
            <li style={{ padding: '8px', color: '#aaa', fontSize: '12px' }}>
              Pick one to verify it, or submit as typed (unverified).
            </li>
          </ul>
        ) : (
          <p style={{ color: '#efb049', fontSize: '13px', margin: '4px 0 0' }}>
            ⚠ Google couldn&apos;t verify this address. Add street, city, or ZIP — or submit it as typed
            after double-checking it.
          </p>
        ))}
    </div>
  )
}

export default function AdminBookingPage() {
  const [agreementState, agreementAction, agreementPending] = useActionState(
    sendAgreementAction,
    initialState,
  )
  const [paymentState, paymentAction, paymentPending] = useActionState(
    sendPaymentLinkAction,
    initialState,
  )
  const [packageType, setPackageType] = useState<'hourly' | 'seven_songs'>('hourly')
  const [durationInput, setDurationInput] = useState('')
  const [hourlyRateInput, setHourlyRateInput] = useState('')

  const hourlyRate = Number(hourlyRateInput)
  const hours = Number(durationInput)
  const hourlyTotal =
    hourlyRateInput !== '' && durationInput !== '' && Number.isFinite(hourlyRate) && Number.isFinite(hours)
      ? Math.round(hourlyRate * hours * 100) / 100
      : null

  return (
    <main
      style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '32px 16px',
        fontFamily: 'system-ui, sans-serif',
        background: '#131315',
        color: '#F5EFE3',
        minHeight: '100vh',
      }}
    >
      <h1>Phone booking — manual entry</h1>
      <p style={{ color: '#aaa', fontSize: '14px' }}>
        Fill in the booking details, then choose one option: send the signed agreement (deposit
        already collected), or email the customer a Stripe link to pay the deposit themselves.
      </p>

      <form>
        <label style={labelStyle}>
          Customer name
          <input style={inputStyle} name="name" required minLength={2} maxLength={100} />
        </label>

        <label style={labelStyle}>
          Email
          <input style={inputStyle} type="email" name="email" required />
        </label>

        <label style={labelStyle}>
          Phone
          <input style={inputStyle} name="phone" required minLength={7} maxLength={20} />
        </label>

        <AddressField />

        <label style={labelStyle}>
          Event date
          <input
            className="date-time-input"
            style={{ ...inputStyle, colorScheme: 'dark' }}
            type="date"
            name="eventDate"
            required
          />
        </label>

        <label style={labelStyle}>
          Start time
          <input
            className="date-time-input"
            style={{ ...inputStyle, colorScheme: 'dark' }}
            type="time"
            name="startTime"
            required
          />
        </label>

        <label style={labelStyle}>
          Duration (hours)
          <input
            style={inputStyle}
            type="number"
            name="durationHours"
            min={1}
            max={12}
            step={1}
            required
            value={durationInput}
            onChange={(e) => setDurationInput(e.target.value)}
          />
        </label>

        <label style={labelStyle}>
          Package
          <select
            style={inputStyle}
            name="packageType"
            required
            value={packageType}
            onChange={(e) => setPackageType(e.target.value as 'hourly' | 'seven_songs')}
          >
            <option value="hourly">Hourly</option>
            <option value="seven_songs">7-songs package</option>
          </select>
        </label>

        {packageType === 'hourly' ? (
          <>
            <label style={labelStyle}>
              Price per hour ($)
              <input
                style={inputStyle}
                type="text"
                inputMode="decimal"
                pattern={MONEY_PATTERN}
                title="Dollar amount, e.g. 450 or 450.50"
                name="hourlyRate"
                required
                value={hourlyRateInput}
                onChange={(e) => setHourlyRateInput(e.target.value)}
              />
            </label>

            <label style={labelStyle}>
              Total price ($) — price per hour × hours
              <input
                style={{ ...inputStyle, color: '#aaa' }}
                type="text"
                name="total"
                readOnly
                value={hourlyTotal === null ? '' : String(hourlyTotal)}
                placeholder="Enter price per hour and duration"
              />
            </label>
          </>
        ) : (
          <label style={labelStyle}>
            Total price ($)
            <input
              style={inputStyle}
              type="text"
              inputMode="decimal"
              pattern={MONEY_PATTERN}
              title="Dollar amount, e.g. 450 or 450.50"
              name="total"
              required
            />
          </label>
        )}

        <label style={labelStyle}>
          Deposit amount ($)
          <input
            style={inputStyle}
            type="text"
            inputMode="decimal"
            pattern="\d+(\.\d{1,2})?"
            title="Dollar amount, e.g. 450 or 450.50"
            name="deposit"
            required
          />
        </label>

        <label style={labelStyle}>
          Balance due ($)
          <input
            style={inputStyle}
            type="text"
            inputMode="decimal"
            pattern="\d+(\.\d{1,2})?"
            title="Dollar amount, e.g. 450 or 450.50"
            name="balanceDue"
            required
          />
        </label>

        <label style={labelStyle}>
          Customer name for signature (as agreed by phone)
          <input style={inputStyle} name="signatureName" required minLength={2} maxLength={100} />
        </label>

        <label style={labelStyle}>
          Customer email language
          <select style={inputStyle} name="locale" defaultValue="es" required>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            type="submit"
            formAction={agreementAction}
            disabled={agreementPending || paymentPending}
            style={{
              padding: '10px 16px',
              background: '#efb049',
              color: '#131315',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
            }}
          >
            {agreementPending ? 'Sending…' : 'Deposit already paid — send agreement'}
          </button>

          <button
            type="submit"
            formAction={paymentAction}
            disabled={agreementPending || paymentPending}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              color: '#efb049',
              border: '1px solid #efb049',
              borderRadius: '6px',
              fontWeight: 'bold',
            }}
          >
            {paymentPending ? 'Sending…' : 'Email Stripe deposit link'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: '16px' }}>
        <ErrorMessage state={agreementState} />
        <ErrorMessage state={paymentState} />
      </div>
    </main>
  )
}
