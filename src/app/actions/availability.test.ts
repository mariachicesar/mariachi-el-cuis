import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { calendar: true } }))
vi.mock('@/lib/calendar/google', () => ({ checkAvailability: vi.fn() }))

afterEach(() => vi.resetAllMocks())

test('returns checked:false for malformed input', async () => {
  const { checkAvailabilityAction } = await import('./availability')
  expect(await checkAvailabilityAction({})).toEqual({ checked: false })
})

test('returns checked:true with the adapter result for valid input', async () => {
  const { checkAvailability } = await import('@/lib/calendar/google')
  vi.mocked(checkAvailability).mockResolvedValue(true)
  const { checkAvailabilityAction } = await import('./availability')

  const result = await checkAvailabilityAction({
    eventDate: '2026-06-01',
    startTime: '15:00',
    calendarBlockMinutes: 120,
  })
  expect(result).toEqual({ checked: true, available: true })
})
