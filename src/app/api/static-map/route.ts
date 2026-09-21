import { z } from 'zod'
import { NextResponse, type NextRequest } from 'next/server'
import { staticMapUrl } from '@/lib/geo/geocode'
import { features } from '@/lib/env'

export const runtime = 'nodejs'

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
})

// Proxies Google's Static Maps API so the server-only GOOGLE_MAPS_API_KEY
// never reaches the client — mirrors how geocode.ts keeps the key server-side.
export async function GET(req: NextRequest): Promise<Response> {
  if (!features.maps) return NextResponse.json({ error: 'not_configured' }, { status: 404 })

  const parsed = querySchema.safeParse({
    lat: req.nextUrl.searchParams.get('lat'),
    lng: req.nextUrl.searchParams.get('lng'),
  })
  if (!parsed.success) return NextResponse.json({ error: 'validation' }, { status: 400 })

  const res = await fetch(staticMapUrl(parsed.data.lat, parsed.data.lng))
  if (!res.ok || !res.body) return NextResponse.json({ error: 'upstream_failed' }, { status: 502 })

  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
