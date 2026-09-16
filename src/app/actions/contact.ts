'use server'

import { Resend } from 'resend'
import { contactSchema } from '@/lib/contact/schema'
import { env, features } from '@/lib/env'
import { siteConfig } from '@/lib/config/site'

export type ContactActionState = {
  ok: boolean
  error?: 'validation' | 'not_configured' | 'send_failed'
  fieldErrors?: Record<string, string>
}

export async function submitContact(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
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
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message
    }
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
      from: siteConfig.emailFrom,
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
