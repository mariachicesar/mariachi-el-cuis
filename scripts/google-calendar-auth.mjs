#!/usr/bin/env node
// One-time setup: run this locally to connect the owner's personal Gmail to
// the site's Google Calendar integration. Never deployed, never imported by
// the app. Requires GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET
// (from a Google Cloud Console OAuth client, "Desktop app" type) either in
// the environment or a local .env file next to this script.
import { createServer } from 'node:http'
import { google } from 'googleapis'
import open from 'open'

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET before running this.')
  process.exit(1)
}

// Google rejects the `localhost` hostname for "Desktop app" OAuth clients
// (redirect_uri_mismatch) — the loopback IP literal is required.
const REDIRECT_URI = 'http://127.0.0.1:53682/oauth2callback'
const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // forces a refresh_token even on a re-auth
  // `calendar` is a superset of calendar.events + calendar.readonly and also
  // allows calendars.insert below (creating the bookings calendar), which the
  // narrower scopes reject with ACCESS_TOKEN_SCOPE_INSUFFICIENT.
  scope: ['https://www.googleapis.com/auth/calendar'],
})

console.log('Opening your browser to authorize with the Gmail that should host the calendar...')
console.log('\nIf the consent screen shows redirect_uri_mismatch, compare this URL against')
console.log('the Authorized redirect URIs in Cloud Console:\n\n' + authUrl + '\n')
await open(authUrl)

const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, REDIRECT_URI)
    const c = url.searchParams.get('code')
    const err = url.searchParams.get('error')
    res.end('You can close this tab and return to the terminal.')
    server.close()
    if (err || !c) reject(new Error(`Authorization failed: ${err ?? 'no code returned'}`))
    else resolve(c)
  })
  server.on('error', reject)
  server.listen(53682)
}).catch((err) => {
  console.error(err.message)
  process.exit(1)
})

const { tokens } = await oauth2Client.getToken(code)
oauth2Client.setCredentials(tokens)

console.log('\nGOOGLE_CALENDAR_REFRESH_TOKEN=' + tokens.refresh_token)

const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
const list = await calendar.calendarList.list()
let target = list.data.items?.find((c) => c.summary === 'Mariachi El Cuis — Bookings')

if (!target) {
  const created = await calendar.calendars.insert({
    requestBody: { summary: 'Mariachi El Cuis — Bookings' },
  })
  target = created.data
  console.log('Created a new calendar: "Mariachi El Cuis — Bookings"')
}

console.log('GOOGLE_CALENDAR_ID=' + target.id)
console.log('\nPaste both lines above into your Vercel project env vars, along with')
console.log('GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET (the values you used to run this).')
