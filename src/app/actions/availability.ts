'use server'

import { z } from 'zod'
import { laWallTimeToUtc } from '@/lib/quote/timezone'
import { checkAvailability } from '@/lib/calendar/google'
import { features } from '@/lib/env'

const inputSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  calendarBlockMinutes: z.number().min(60).max(24 * 60),
})

export type CheckAvailabilityResult = { checked: true; available: boolean } | { checked: false }

export async function checkAvailabilityAction(input: unknown): Promise<CheckAvailabilityResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success || !features.calendar) return { checked: false }

  const eventStartUtc = laWallTimeToUtc(parsed.data.eventDate, parsed.data.startTime)
  const blockStart = new Date(eventStartUtc.getTime() - 30 * 60 * 1000)
  const blockEnd = new Date(blockStart.getTime() + parsed.data.calendarBlockMinutes * 60 * 1000)

  const available = await checkAvailability(blockStart, blockEnd)
  return { checked: true, available }
}
