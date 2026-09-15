'use server'

import { z } from 'zod'
import { checkSlot } from '@/lib/scheduling/check-slot'
import type { Slot } from '@/lib/scheduling/free-intervals'
import { features } from '@/lib/env'

const inputSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.number().min(1).max(12),
})

export type CheckAvailabilityResult =
  | { checked: true; available: true }
  | { checked: true; available: false; reason: 'conflict' | 'below_minimum' | 'not_on_hour'; suggestions: Slot[] }
  | { checked: false }

// checkSlot only enforces calendar conflicts and Saturday's fragmentation
// rules here — it is not gated by getQuote first (unlike startCheckoutAction,
// which always calls getQuote and bails out before ever reaching the
// calendar layer). So this action trusts its caller (the wizard, which
// always calls getQuoteAction first) to have already validated the
// earliest-start/hours-window rules; a hand-crafted call could report
// available:true for a date/time getQuote would actually reject.
export async function checkAvailabilityAction(input: unknown): Promise<CheckAvailabilityResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success || !features.calendar) return { checked: false }

  const result = await checkSlot(parsed.data.eventDate, parsed.data.startTime, parsed.data.durationHours)
  return { checked: true, ...result }
}
