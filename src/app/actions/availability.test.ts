import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { calendar: true } }))
vi.mock('@/lib/scheduling/check-slot', () => ({ checkSlot: vi.fn() }))

afterEach(() => vi.resetAllMocks())

test('returns checked:false for malformed input', async () => {
  const { checkAvailabilityAction } = await import('./availability')
  expect(await checkAvailabilityAction({})).toEqual({ checked: false })
})

test('returns checked:true with the checkSlot result for valid input', async () => {
  const { checkSlot } = await import('@/lib/scheduling/check-slot')
  vi.mocked(checkSlot).mockResolvedValue({ available: true })
  const { checkAvailabilityAction } = await import('./availability')

  const result = await checkAvailabilityAction({
    eventDate: '2026-06-01',
    startTime: '15:00',
    durationHours: 2,
  })
  expect(result).toEqual({ checked: true, available: true })
  expect(checkSlot).toHaveBeenCalledWith('2026-06-01', '15:00', 2)
})

test('passes suggestions through when the slot is unavailable', async () => {
  const { checkSlot } = await import('@/lib/scheduling/check-slot')
  vi.mocked(checkSlot).mockResolvedValue({
    available: false,
    reason: 'conflict',
    suggestions: [{ startTime: '17:00', endTime: '19:00' }],
  })
  const { checkAvailabilityAction } = await import('./availability')

  const result = await checkAvailabilityAction({
    eventDate: '2026-01-03',
    startTime: '17:15',
    durationHours: 2,
  })
  expect(result).toEqual({
    checked: true,
    available: false,
    reason: 'conflict',
    suggestions: [{ startTime: '17:00', endTime: '19:00' }],
  })
})
