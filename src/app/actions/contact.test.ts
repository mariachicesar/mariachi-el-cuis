import { afterEach, expect, test, vi } from 'vitest'

const sendMock = vi.fn().mockResolvedValue({})

vi.mock('@/lib/env', () => ({
  features: { email: true, maps: true },
  env: { RESEND_API_KEY: 're_x', CONTACT_TO_EMAIL: 'booking@mariachielcuis.com', NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' },
}))
vi.mock('resend', () => {
  const Resend = vi.fn(function () {
    return { emails: { send: sendMock } }
  })
  return { Resend }
})

afterEach(() => {
  vi.clearAllMocks()
  sendMock.mockResolvedValue({})
})

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const base = {
  name: 'Leilani',
  email: 'leilani@example.com',
  phone: '8085551234',
  message: 'Sunday brunch at our restaurant in Lahaina, 11am.',
  website: '',
  locale: 'en',
}

test('a Maui landing-page lead gets a [Maui] subject tag', async () => {
  const { submitContact } = await import('./contact')
  const result = await submitContact({ ok: false }, formData({ ...base, source: 'maui' }))
  expect(result).toEqual({ ok: true })
  expect(sendMock).toHaveBeenCalledTimes(1)
  expect(sendMock.mock.calls[0]![0].subject).toBe('[Maui] Website contact — Leilani')
})

test('a regular contact lead keeps the plain subject', async () => {
  const { submitContact } = await import('./contact')
  const result = await submitContact({ ok: false }, formData(base))
  expect(result).toEqual({ ok: true })
  expect(sendMock.mock.calls[0]![0].subject).toBe('Website contact — Leilani')
})

test('an unknown source is rejected rather than trusted into the subject', async () => {
  const { submitContact } = await import('./contact')
  const result = await submitContact({ ok: false }, formData({ ...base, source: 'spam' }))
  expect(result.ok).toBe(false)
  expect(result.error).toBe('validation')
  expect(sendMock).not.toHaveBeenCalled()
})
