import 'server-only'
import { google } from 'googleapis'
import { env } from '@/lib/env'

function calendarClient() {
  const auth = new google.auth.OAuth2(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET)
  auth.setCredentials({ refresh_token: env.GOOGLE_CALENDAR_REFRESH_TOKEN })
  return google.calendar({ version: 'v3', auth })
}

export type HoldDetails = {
  summary: string
  description: string
  location: string
  startUtc: Date
  endUtc: Date
}

export async function checkAvailability(startUtc: Date, endUtc: Date): Promise<boolean> {
  const calendar = calendarClient()
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: startUtc.toISOString(),
      timeMax: endUtc.toISOString(),
      items: [{ id: env.GOOGLE_CALENDAR_ID! }],
    },
  })
  const busy = res.data.calendars?.[env.GOOGLE_CALENDAR_ID!]?.busy ?? []
  return busy.length === 0
}

export async function createHoldEvent(details: HoldDetails): Promise<string> {
  const calendar = calendarClient()
  const res = await calendar.events.insert({
    calendarId: env.GOOGLE_CALENDAR_ID!,
    requestBody: {
      summary: details.summary,
      description: details.description,
      location: details.location,
      start: { dateTime: details.startUtc.toISOString() },
      end: { dateTime: details.endUtc.toISOString() },
    },
  })
  if (!res.data.id) throw new Error('Calendar event created without an id')
  return res.data.id
}

export async function confirmEvent(
  eventId: string,
  details: { summary: string; description: string },
): Promise<{ alreadyConfirmed: boolean }> {
  const calendar = calendarClient()
  const existing = await calendar.events.get({ calendarId: env.GOOGLE_CALENDAR_ID!, eventId })
  if (!existing.data.summary?.startsWith('HOLD —')) {
    return { alreadyConfirmed: true }
  }
  await calendar.events.patch({
    calendarId: env.GOOGLE_CALENDAR_ID!,
    eventId,
    requestBody: { summary: details.summary, description: details.description },
  })
  return { alreadyConfirmed: false }
}

export async function releaseHoldEvent(eventId: string): Promise<void> {
  const calendar = calendarClient()
  try {
    await calendar.events.delete({ calendarId: env.GOOGLE_CALENDAR_ID!, eventId })
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code !== 404 && code !== 410) throw err
  }
}
