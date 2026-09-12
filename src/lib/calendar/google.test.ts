import { beforeEach, expect, test, vi } from 'vitest'

const freebusyQuery = vi.fn()
const eventsInsert = vi.fn()
const eventsGet = vi.fn()
const eventsPatch = vi.fn()
const eventsDelete = vi.fn()

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(function () {
        return { setCredentials: vi.fn() }
      }),
    },
    calendar: vi.fn().mockReturnValue({
      freebusy: { query: freebusyQuery },
      events: { insert: eventsInsert, get: eventsGet, patch: eventsPatch, delete: eventsDelete },
    }),
  },
}))

vi.mock('@/lib/env', () => ({
  env: {
    GOOGLE_OAUTH_CLIENT_ID: 'id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'secret',
    GOOGLE_CALENDAR_REFRESH_TOKEN: 'refresh',
    GOOGLE_CALENDAR_ID: 'cal-1',
  },
}))

beforeEach(() => {
  freebusyQuery.mockReset()
  eventsInsert.mockReset()
  eventsGet.mockReset()
  eventsPatch.mockReset()
  eventsDelete.mockReset()
})

test('checkAvailability is true when the calendar reports no busy blocks', async () => {
  const { checkAvailability } = await import('./google')
  freebusyQuery.mockResolvedValue({ data: { calendars: { 'cal-1': { busy: [] } } } })
  expect(await checkAvailability(new Date(), new Date())).toBe(true)
})

test('checkAvailability is false when the calendar reports a busy block', async () => {
  const { checkAvailability } = await import('./google')
  freebusyQuery.mockResolvedValue({
    data: { calendars: { 'cal-1': { busy: [{ start: 'x', end: 'y' }] } } },
  })
  expect(await checkAvailability(new Date(), new Date())).toBe(false)
})

test('createHoldEvent returns the new event id', async () => {
  const { createHoldEvent } = await import('./google')
  eventsInsert.mockResolvedValue({ data: { id: 'evt-1' } })
  const id = await createHoldEvent({
    summary: 'HOLD — test',
    description: 'd',
    location: 'l',
    startUtc: new Date(),
    endUtc: new Date(),
  })
  expect(id).toBe('evt-1')
})

test('confirmEvent patches and reports alreadyConfirmed:false for a HOLD event', async () => {
  const { confirmEvent } = await import('./google')
  eventsGet.mockResolvedValue({ data: { summary: 'HOLD — test' } })
  eventsPatch.mockResolvedValue({ data: {} })
  const result = await confirmEvent('evt-1', { summary: 'Booking confirmed', description: 'd' })
  expect(result).toEqual({ alreadyConfirmed: false })
  expect(eventsPatch).toHaveBeenCalledOnce()
})

test('confirmEvent skips the patch and reports alreadyConfirmed:true for a non-HOLD event', async () => {
  const { confirmEvent } = await import('./google')
  eventsGet.mockResolvedValue({ data: { summary: 'Booking confirmed' } })
  const result = await confirmEvent('evt-1', { summary: 'x', description: 'y' })
  expect(result).toEqual({ alreadyConfirmed: true })
  expect(eventsPatch).not.toHaveBeenCalled()
})

test('releaseHoldEvent deletes the event', async () => {
  const { releaseHoldEvent } = await import('./google')
  eventsDelete.mockResolvedValue({})
  await releaseHoldEvent('evt-1')
  expect(eventsDelete).toHaveBeenCalledOnce()
})

test('releaseHoldEvent treats an already-deleted (404) event as success', async () => {
  const { releaseHoldEvent } = await import('./google')
  eventsDelete.mockRejectedValue({ code: 404 })
  await expect(releaseHoldEvent('evt-1')).resolves.toBeUndefined()
})
