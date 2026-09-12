export type PackageType = 'seven_songs' | 'hourly'

export type QuoteInput = {
  eventDate: string // "YYYY-MM-DD", LA-local calendar date
  startTime: string // "HH:mm", 24h, LA-local wall time
  durationHours: number
  packageType: PackageType
  distanceMi: number
  county: string | null
  state: string | null
  now: Date
}

export type QuoteLineItem = { key: 'seven_songs' | 'hourly_rate'; amount: number }

export type QuoteOk = {
  status: 'ok'
  currency: 'USD'
  lineItems: QuoteLineItem[]
  enforcedHours: number
  total: number
  deposit: number
  balanceDue: number
  rush: boolean
  minimumApplied?: { requested: number; enforced: number }
  calendarBlockMinutes: number
}

export type QuoteContactRequired = {
  status: 'contact_required'
  reason: 'out_of_area' | 'weekend_early_start' | 'outside_hours'
}

export type QuoteCallRequired = { status: 'call_required'; reason: 'lead_time' }

export type QuoteResult = QuoteOk | QuoteContactRequired | QuoteCallRequired
