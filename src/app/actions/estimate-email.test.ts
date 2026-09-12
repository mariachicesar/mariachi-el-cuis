import { afterEach, expect, test, vi } from 'vitest'

const sendMock = vi.fn().mockResolvedValue({})

vi.mock('@/lib/env', () => ({
  features: { email: true, maps: true },
  env: { RESEND_API_KEY: 're_x', CONTACT_TO_EMAIL: 'booking@mariachielcuis.com', NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' },
}))
vi.mock('@/lib/geo/geocode', () => ({ geocodeAddress: vi.fn() }))
vi.mock('@react-email/render', () => ({ render: vi.fn().mockResolvedValue('<html></html>') }))
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

test('returns validation error for a malformed email', async () => {
  const { sendEstimateEmailAction } = await import('./estimate-email')
  const result = await sendEstimateEmailAction(
    { ok: false },
    formData({
      eventDate: '2026-06-01',
      startTime: '15:00',
      durationHours: '1',
      packageType: 'seven_songs',
      address: '90011',
      email: 'not-an-email',
      locale: 'en',
    }),
  )
  expect(result).toEqual({ ok: false, error: 'validation' })
})

test('sends the estimate email on a valid, geocodable submission', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Los Angeles County',
    state: 'CA',
  })
  const { sendEstimateEmailAction } = await import('./estimate-email')

  const result = await sendEstimateEmailAction(
    { ok: false },
    formData({
      eventDate: '2026-06-01',
      startTime: '15:00',
      durationHours: '1',
      packageType: 'seven_songs',
      address: '90011',
      email: 'customer@example.com',
      locale: 'en',
    }),
  )
  expect(result).toEqual({ ok: true })
  expect(sendMock).toHaveBeenCalledOnce()
  expect(sendMock.mock.calls[0]![0]!.to).toBe('customer@example.com')
})
