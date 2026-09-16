import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/calendar/google', () => ({ getBusyBlocks: vi.fn() }))

afterEach(() => vi.resetAllMocks())

test('saturday: empty day, on-hour peak request is available', async () => {
  const { getBusyBlocks } = await import('@/lib/calendar/google')
  vi.mocked(getBusyBlocks).mockResolvedValue([])
  const { checkSlot } = await import('./check-slot')
  // 2026-01-03 is a Saturday
  expect(await checkSlot('2026-01-03', '17:00', 2)).toEqual({ available: true })
})

test('saturday: empty day, off-hour peak request is rejected with on-hour suggestions', async () => {
  const { getBusyBlocks } = await import('@/lib/calendar/google')
  vi.mocked(getBusyBlocks).mockResolvedValue([])
  const { checkSlot } = await import('./check-slot')
  const result = await checkSlot('2026-01-03', '17:15', 2)
  expect(result.available).toBe(false)
  if (result.available) throw new Error('unreachable')
  expect(result.reason).toBe('not_on_hour')
  expect(result.suggestions).toEqual([
    { startTime: '17:00', endTime: '19:00' },
    { startTime: '18:00', endTime: '20:00' },
  ])
})

test('saturday: 5-7pm booked, 8-9pm request is rejected with gap-adjacent suggestions', async () => {
  const { getBusyBlocks } = await import('@/lib/calendar/google')
  // 2026-01-03 17:00-19:00 PST (winter, UTC-8) = 2026-01-04T01:00:00Z to 03:00:00Z
  vi.mocked(getBusyBlocks).mockResolvedValue([
    { startUtc: new Date('2026-01-04T01:00:00.000Z'), endUtc: new Date('2026-01-04T03:00:00.000Z') },
  ])
  const { checkSlot } = await import('./check-slot')
  const result = await checkSlot('2026-01-03', '20:00', 1)
  expect(result.available).toBe(false)
  if (result.available) throw new Error('unreachable')
  expect(result.reason).toBe('below_minimum')
  expect(result.suggestions).toEqual([
    { startTime: '19:30', endTime: '21:30' },
    { startTime: '20:00', endTime: '22:00' },
  ])
})

test('sunday: conflicting request returns available:false with nearby suggestions', async () => {
  const { getBusyBlocks } = await import('@/lib/calendar/google')
  // 2026-01-04 08:00-10:00 PST = 16:00-18:00Z
  vi.mocked(getBusyBlocks).mockResolvedValue([
    { startUtc: new Date('2026-01-04T16:00:00.000Z'), endUtc: new Date('2026-01-04T18:00:00.000Z') },
  ])
  const { checkSlot } = await import('./check-slot')
  const result = await checkSlot('2026-01-04', '08:30', 1)
  expect(result).toEqual({
    available: false,
    reason: 'conflict',
    suggestions: [{ startTime: '10:30', endTime: '11:30' }],
  })
})

test('sunday: 8am request on an empty day is available (previously blocked by the old 3pm floor)', async () => {
  const { getBusyBlocks } = await import('@/lib/calendar/google')
  vi.mocked(getBusyBlocks).mockResolvedValue([])
  const { checkSlot } = await import('./check-slot')
  expect(await checkSlot('2026-01-04', '08:00', 2)).toEqual({ available: true })
})
