/**
 * Debounce delay (ms) for the booking wizard's price-quote and
 * availability-check effects.
 *
 * Fetching (geocoding + pricing, or the calendar availability check) is
 * debounced by `DEBOUNCE_MS` so a request isn't fired on every keystroke.
 * Clearing an already-shown quote/availability result when inputs become
 * invalid must NOT wait out that same debounce — otherwise a stale
 * price/availability status lingers on screen for up to `DEBOUNCE_MS` after,
 * say, the address is cleared. `effectDelayMs` picks the right delay for
 * each case: the fetch path still waits `DEBOUNCE_MS`, but the reset path
 * fires on the next tick (delay 0) instead. Both paths run inside a
 * `setTimeout` callback either way (never synchronously in the effect
 * body), so `react-hooks/set-state-in-effect` stays satisfied regardless of
 * which delay is chosen.
 */
export const DEBOUNCE_MS = 500

export function effectDelayMs(shouldDebounce: boolean): number {
  return shouldDebounce ? DEBOUNCE_MS : 0
}
