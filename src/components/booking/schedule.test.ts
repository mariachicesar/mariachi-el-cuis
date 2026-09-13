import { expect, test } from 'vitest'
import { DEBOUNCE_MS, effectDelayMs } from './schedule'

test('debounces the fetch path but resets on the next tick, not after the debounce', () => {
  // Regression test for task-14's fix round: when a previously-valid quote
  // is showing and the input becomes invalid (e.g. the address is
  // cleared), the wizard must clear the stale quote/availability display
  // essentially immediately — not wait out the same debounce used for the
  // price-quote/availability fetch. `effectDelayMs(false)` (the reset path)
  // must return a materially shorter delay than `effectDelayMs(true)` (the
  // fetch path).
  expect(effectDelayMs(true)).toBe(DEBOUNCE_MS)
  expect(effectDelayMs(false)).toBe(0)
  expect(effectDelayMs(false)).toBeLessThan(effectDelayMs(true))
})
