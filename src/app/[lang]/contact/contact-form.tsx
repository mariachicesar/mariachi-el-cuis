'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitContact, type ContactActionState } from '@/app/actions/contact'
import { siteConfig } from '@/lib/config/site'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/locales'

const COPY = {
  es: {
    nameLabel: 'Nombre',
    emailLabel: 'Correo electrónico',
    phoneLabel: 'Teléfono (opcional)',
    messageLabel: 'Mensaje',
    submit: 'Enviar mensaje',
    submitPending: 'Enviando…',
    successTitle: '¡Mensaje enviado!',
    successBody: 'Gracias por escribirnos. Te responderemos lo antes posible.',
    notConfigured:
      'No pudimos enviar tu mensaje en este momento. Por favor llámanos o escríbenos por WhatsApp y te atendemos directamente.',
    sendFailed:
      'Hubo un problema al enviar tu mensaje. Por favor llámanos o escríbenos por WhatsApp y te atendemos directamente.',
    honeypotLabel: 'Deja este campo vacío',
  },
  en: {
    nameLabel: 'Name',
    emailLabel: 'Email',
    phoneLabel: 'Phone (optional)',
    messageLabel: 'Message',
    submit: 'Send message',
    submitPending: 'Sending…',
    successTitle: 'Message sent!',
    successBody: 'Thanks for reaching out. We will get back to you soon.',
    notConfigured:
      "We couldn't send your message right now. Please call us or message us on WhatsApp and we will help you directly.",
    sendFailed:
      'There was a problem sending your message. Please call us or message us on WhatsApp and we will help you directly.',
    honeypotLabel: 'Leave this field empty',
  },
} as const

const inputCls =
  'mt-1 w-full rounded border border-charcoal-border bg-surface-container px-4 py-3 text-on-surface placeholder:text-muted-silver focus:border-burnished-gold focus:outline-none focus:ring-2 focus:ring-burnished-gold/40'
const labelCls = 'block text-sm font-medium text-crema-white'
const errorCls = 'mt-1 text-sm text-red-400'
const linkCls =
  'text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline'

const initialState: ContactActionState = { ok: false }

// `useFormStatus` only reports the status of the nearest ancestor <form>.
// It must live in a component rendered *inside* the <form>, not in the
// component (ContactForm) that renders the <form> element itself, or it
// returns a stale/default { pending: false } regardless of real state.
function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
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

export function ContactForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [state, formAction] = useActionState(submitContact, initialState)
  const t = COPY[locale]

  return (
    <div>
      <form action={formAction} noValidate className="max-w-xl space-y-5">
        <input type="hidden" name="locale" value={locale} />

        {/*
          Honeypot: `aria-hidden="true"` removes the whole wrapper from the
          accessibility tree, so screen reader users never land on it or
          "helpfully" fill it in — a visually-hidden-only (e.g. sr-only)
          approach would still expose it to assistive tech and defeat the
          purpose. Bots that blindly fill every field still get caught
          server-side because `website` must be exactly ''.
        */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          <label>
            {t.honeypotLabel}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <div>
          <label htmlFor="contact-name" className={labelCls}>
            {t.nameLabel}
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            className={inputCls}
            aria-describedby={state.fieldErrors?.name ? 'contact-name-error' : undefined}
            aria-invalid={state.fieldErrors?.name ? 'true' : undefined}
          />
          {state.fieldErrors?.name && (
            <p id="contact-name-error" className={errorCls}>
              {state.fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className={labelCls}>
            {t.emailLabel}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            className={inputCls}
            aria-describedby={state.fieldErrors?.email ? 'contact-email-error' : undefined}
            aria-invalid={state.fieldErrors?.email ? 'true' : undefined}
          />
          {state.fieldErrors?.email && (
            <p id="contact-email-error" className={errorCls}>
              {state.fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-phone" className={labelCls}>
            {t.phoneLabel}
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputCls}
            aria-describedby={state.fieldErrors?.phone ? 'contact-phone-error' : undefined}
            aria-invalid={state.fieldErrors?.phone ? 'true' : undefined}
          />
          {state.fieldErrors?.phone && (
            <p id="contact-phone-error" className={errorCls}>
              {state.fieldErrors.phone}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-message" className={labelCls}>
            {t.messageLabel}
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            className={inputCls}
            aria-describedby={state.fieldErrors?.message ? 'contact-message-error' : undefined}
            aria-invalid={state.fieldErrors?.message ? 'true' : undefined}
          />
          {state.fieldErrors?.message && (
            <p id="contact-message-error" className={errorCls}>
              {state.fieldErrors.message}
            </p>
          )}
        </div>

        <SubmitButton label={t.submit} pendingLabel={t.submitPending} />
      </form>

      <div role="status" aria-live="polite" className="mt-6 max-w-xl">
        {state.ok && (
          <div className="rounded border border-charcoal-border bg-surface-container p-5">
            <p className="font-display text-lg text-burnished-gold">{t.successTitle}</p>
            <p className="mt-2 text-on-surface-variant">{t.successBody}</p>
          </div>
        )}

        {(state.error === 'not_configured' || state.error === 'send_failed') && (
          <div className="rounded border border-charcoal-border bg-surface-container p-5">
            <p className="text-on-surface-variant">
              {state.error === 'not_configured' ? t.notConfigured : t.sendFailed}
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <a href={`tel:${siteConfig.phoneTel}`} className={linkCls}>
                {dict.cta.call} {siteConfig.phoneDisplay}
              </a>
              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkCls}
              >
                {dict.cta.whatsapp}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
