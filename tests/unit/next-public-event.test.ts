import { expect, test } from 'vitest'
import { isNextPublicEventOver } from '@/lib/data/next-public-event'

test('next public event stays up until 2:30 PM Pacific on Nov 1, 2026', () => {
  expect(isNextPublicEventOver(new Date('2026-11-01T14:29:00-08:00'))).toBe(false)
  expect(isNextPublicEventOver(new Date('2026-11-01T14:30:00-08:00'))).toBe(true)
})
