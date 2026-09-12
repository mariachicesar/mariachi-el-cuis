import { expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { calendar: false } }))
vi.mock('@/lib/calendar/google', () => ({ checkAvailability: vi.fn() }))

test('returns checked:false when the calendar feature is off, even with valid input', async () => {
  const { checkAvailabilityAction } = await import('./availability')
  const result = await checkAvailabilityAction({
    eventDate: '2026-06-01',
    startTime: '15:00',
    calendarBlockMinutes: 120,
  })
  expect(result).toEqual({ checked: false })
})
