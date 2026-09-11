import { expect, test } from 'vitest'
import { contactSchema } from '@/lib/contact/schema'

test('accepts a valid submission', () => {
  const r = contactSchema.safeParse({
    name: 'Ana López',
    email: 'ana@example.com',
    message: 'Necesito mariachi para una boda.',
    website: '',
    locale: 'es',
  })
  expect(r.success).toBe(true)
})

test('rejects short message', () => {
  const r = contactSchema.safeParse({
    name: 'Ana',
    email: 'a@b.co',
    message: 'hi',
    website: '',
    locale: 'es',
  })
  expect(r.success).toBe(false)
})

test('rejects filled honeypot', () => {
  const r = contactSchema.safeParse({
    name: 'Ana',
    email: 'a@b.co',
    message: 'a valid long message here',
    website: 'spam',
    locale: 'en',
  })
  expect(r.success).toBe(false)
})
