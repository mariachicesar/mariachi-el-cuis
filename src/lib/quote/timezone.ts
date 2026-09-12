const LA_TZ = 'America/Los_Angeles'

/** Minutes to ADD to a UTC instant to get LA wall-clock time, DST-aware. */
function laOffsetMinutesAt(instant: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: LA_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = Object.fromEntries(dtf.formatToParts(instant).map((p) => [p.type, p.value]))
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  )
  return (asIfUtc - instant.getTime()) / 60_000
}

/** `dateStr` "YYYY-MM-DD", `timeStr` "HH:mm" — both LA-local wall-clock values. */
export function laWallTimeToUtc(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number]
  const [hh, mm] = timeStr.split(':').map(Number) as [number, number]
  const naiveUtc = Date.UTC(y, m - 1, d, hh, mm, 0)
  // The offset barely varies within a single day, so computing it from the
  // naive (unshifted) guess is accurate except within seconds of a DST
  // transition at 2am local time — irrelevant for booking a live performance.
  const offsetMin = laOffsetMinutesAt(new Date(naiveUtc))
  return new Date(naiveUtc - offsetMin * 60_000)
}

/** 0=Sunday..6=Saturday, for the literal calendar date (not an instant). */
export function weekdayIndexOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}
