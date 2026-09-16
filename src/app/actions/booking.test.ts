import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  features: { stripe: true, calendar: true, maps: true },
  env: { NEXT_PUBLIC_SITE_URL: 'https://mariachielcuis.com' },
}))
vi.mock('@/lib/geo/geocode', () => ({ geocodeAddress: vi.fn() }))
vi.mock('@/lib/scheduling/check-slot', () => ({ checkSlot: vi.fn() }))
vi.mock('@/lib/calendar/google', () => ({ createHoldEvent: vi.fn() }))
vi.mock('@/lib/payments/stripe', () => ({ createDepositCheckoutSession: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

afterEach(() => vi.resetAllMocks())

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const validFields = {
  eventDate: '2026-12-15',
  startTime: '15:00',
  durationHours: '1',
  packageType: 'seven_songs',
  address: '90011',
  email: 'customer@example.com',
  phone: '2135551234',
  name: 'Test Customer',
  agreed: 'on',
  signatureName: 'Test Customer',
  locale: 'en',
}

test('returns the quote status as the error when the quote is not ok', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Orange County', // -> out_of_area
    state: 'CA',
  })
  const { startCheckoutAction } = await import('./booking')
  const result = await startCheckoutAction({ ok: false }, formData(validFields))
  expect(result).toEqual({ ok: false, error: 'contact_required' })
})

test('creates a calendar hold and a Stripe session, then redirects, for an ok quote', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  const { checkSlot } = await import('@/lib/scheduling/check-slot')
  const { createHoldEvent } = await import('@/lib/calendar/google')
  const { createDepositCheckoutSession } = await import('@/lib/payments/stripe')

  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Los Angeles County',
    state: 'CA',
  })
  vi.mocked(checkSlot).mockResolvedValue({ available: true })
  vi.mocked(createHoldEvent).mockResolvedValue('evt-1')
  vi.mocked(createDepositCheckoutSession).mockResolvedValue({
    url: 'https://checkout.stripe.com/session-1',
  })

  const { startCheckoutAction } = await import('./booking')
  await expect(startCheckoutAction({ ok: false }, formData(validFields))).rejects.toThrow(
    'NEXT_REDIRECT',
  )

  expect(checkSlot).toHaveBeenCalledWith('2026-12-15', '15:00', 1)
  expect(createHoldEvent).toHaveBeenCalledOnce()
  const holdArgs = vi.mocked(createHoldEvent).mock.calls[0]![0]!
  expect(holdArgs.startUtc.toISOString()).toBe('2026-12-15T23:00:00.000Z') // raw event start, no buffer
  expect(holdArgs.endUtc.toISOString()).toBe('2026-12-16T00:00:00.000Z') // raw event end, no buffer

  const sessionArgs = vi.mocked(createDepositCheckoutSession).mock.calls[0]![0]!
  expect(sessionArgs.depositUsd).toBe(50)
  expect(sessionArgs.metadata.calendarEventId).toBe('evt-1')
  expect(sessionArgs.metadata.email).toBe('customer@example.com')
  expect(sessionArgs.metadata.contractVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(sessionArgs.metadata.signatureName).toBe('Test Customer')
  expect(sessionArgs.metadata.signedAt).toBeTruthy()

  const { redirect } = await import('next/navigation')
  expect(redirect).toHaveBeenCalledWith('https://checkout.stripe.com/session-1')
})

test('returns validation errors when the agreement is not accepted or the signature is missing', async () => {
  const { startCheckoutAction } = await import('./booking')

  const noAgree = await startCheckoutAction(
    { ok: false },
    formData({ ...validFields, agreed: '' }),
  )
  expect(noAgree).toEqual({
    ok: false,
    error: 'validation',
    fieldErrors: expect.objectContaining({ agreed: expect.any(Array) }),
  })

  const shortSignature = await startCheckoutAction(
    { ok: false },
    formData({ ...validFields, signatureName: 'A' }),
  )
  expect(shortSignature).toEqual({
    ok: false,
    error: 'validation',
    fieldErrors: expect.objectContaining({ signatureName: expect.any(Array) }),
  })
})

test('returns slot_unavailable and never creates a hold or checkout session when the slot is taken', async () => {
  const { geocodeAddress } = await import('@/lib/geo/geocode')
  const { checkSlot } = await import('@/lib/scheduling/check-slot')
  const { createHoldEvent } = await import('@/lib/calendar/google')
  const { createDepositCheckoutSession } = await import('@/lib/payments/stripe')

  vi.mocked(geocodeAddress).mockResolvedValue({
    lat: 34.0074,
    lng: -118.2587,
    county: 'Los Angeles County',
    state: 'CA',
  })
  vi.mocked(checkSlot).mockResolvedValue({ available: false, reason: 'conflict', suggestions: [] })

  const { startCheckoutAction } = await import('./booking')
  const result = await startCheckoutAction({ ok: false }, formData(validFields))

  expect(result).toEqual({ ok: false, error: 'slot_unavailable' })
  expect(createHoldEvent).not.toHaveBeenCalled()
  expect(createDepositCheckoutSession).not.toHaveBeenCalled()
})

test('returns a phone field error when the phone number is missing', async () => {
  const { startCheckoutAction } = await import('./booking')
  const result = await startCheckoutAction(
    { ok: false },
    formData({ ...validFields, phone: '' }),
  )
  expect(result).toEqual({
    ok: false,
    error: 'validation',
    fieldErrors: expect.objectContaining({ phone: expect.any(Array) }),
  })
})

test('returns a name field error when the name is too short', async () => {
  const { startCheckoutAction } = await import('./booking')
  const result = await startCheckoutAction(
    { ok: false },
    formData({ ...validFields, name: 'A' }),
  )
  expect(result).toEqual({
    ok: false,
    error: 'validation',
    fieldErrors: expect.objectContaining({ name: expect.any(Array) }),
  })
})

test('returns an email field error when the email is malformed', async () => {
  const { startCheckoutAction } = await import('./booking')
  const result = await startCheckoutAction(
    { ok: false },
    formData({ ...validFields, email: 'not-an-email' }),
  )
  expect(result).toEqual({
    ok: false,
    error: 'validation',
    fieldErrors: expect.objectContaining({ email: expect.any(Array) }),
  })
})
