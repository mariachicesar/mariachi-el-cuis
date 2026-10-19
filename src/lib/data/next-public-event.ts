// The next public show, teased in a strip at the top of the home page. The
// strip hides itself once the show ends (the home page revalidates hourly), so
// a stale date never sits on the site — just swap in the next event here.
export const NEXT_PUBLIC_EVENT = {
  // Nov 1, 2026 is the day DST ends, so noon is already PST (UTC−8).
  startDate: '2026-11-01T12:00:00-08:00',
  endDate: '2026-11-01T14:30:00-08:00',
  venueName: 'Mariachi Grill',
  streetAddress: '15627 Ventura Blvd',
  city: 'Encino',
  region: 'CA',
  postalCode: '91436',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Mariachi Grill, 15627 Ventura Blvd, Encino, CA 91436'),
  label: {
    es: 'Domingo 1 de nov · Brunch con mariachi en Mariachi Grill, Encino · 12:00 – 2:30 PM · Gratis',
    en: 'Sun Nov 1 · Mariachi brunch at Mariachi Grill, Encino · 12:00 – 2:30 PM · Free',
  },
} as const

export function isNextPublicEventOver(now: Date = new Date()): boolean {
  return now.getTime() >= Date.parse(NEXT_PUBLIC_EVENT.endDate)
}
