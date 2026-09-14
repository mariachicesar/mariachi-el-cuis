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
  | { checked: true; available: boolean; suggestions?: Slot[] }
  | { checked: false }

export async function checkAvailabilityAction(input: unknown): Promise<CheckAvailabilityResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success || !features.calendar) return { checked: false }

  const result = await checkSlot(parsed.data.eventDate, parsed.data.startTime, parsed.data.durationHours)
  return { checked: true, ...result }
}
