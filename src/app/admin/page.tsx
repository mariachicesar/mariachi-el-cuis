'use client'

import { useActionState } from 'react'
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

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', color: '#ccc' }

function ErrorMessage({ state }: { state: AdminActionState }) {
  if (state.ok) return <p style={{ color: '#7ee787' }}>{state.message}</p>
  if (state.error === 'validation') return <p style={{ color: '#ff8080' }}>Check the highlighted fields.</p>
  if (state.error === 'not_configured')
    return <p style={{ color: '#ff8080' }}>Missing server configuration (email/Stripe/calendar env vars).</p>
  if (state.error === 'send_failed') return <p style={{ color: '#ff8080' }}>Failed to send the email. Try again.</p>
  return null
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

        <label style={labelStyle}>
          Event address
          <input style={inputStyle} name="address" required minLength={5} maxLength={200} />
        </label>

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
          <input style={inputStyle} type="number" name="durationHours" min={1} max={12} step={1} required />
        </label>

        <label style={labelStyle}>
          Package
          <select style={inputStyle} name="packageType" required>
            <option value="hourly">Hourly</option>
            <option value="seven_songs">7-songs package</option>
          </select>
        </label>

        <label style={labelStyle}>
          Total price ($)
          <input
            className="no-spinner"
            style={inputStyle}
            type="number"
            name="total"
            min={0}
            step={1}
            required
          />
        </label>

        <label style={labelStyle}>
          Deposit amount ($)
          <input
            className="no-spinner"
            style={inputStyle}
            type="number"
            name="deposit"
            min={0}
            step={1}
            required
          />
        </label>

        <label style={labelStyle}>
          Balance due ($)
          <input
            className="no-spinner"
            style={inputStyle}
            type="number"
            name="balanceDue"
            min={0}
            step={1}
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
