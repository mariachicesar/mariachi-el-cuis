import { NextResponse, type NextRequest } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { LOCALES } from '@/lib/i18n/locales'
import { env } from '@/lib/env'

const PUBLIC_FILE = /\.[a-z0-9]+$/i
// Root-level path prefixes that must NOT be rewritten under /[lang]
// (`_next`/`api` internals + Next metadata routes emitted at the app root).
const ROOT_PREFIXES = [
  '/_next',
  '/api',
  '/opengraph-image',
  '/icon',
  '/apple-icon',
  '/manifest',
  '/admin',
]

function unauthorized(): NextResponse {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="admin"' },
  })
}

// Owner-only page, gated with HTTP Basic Auth. Returns 401 (never 200) if
// ADMIN_USER/ADMIN_PASSWORD aren't configured, so the route is locked by
// default rather than accidentally open.
function checkAdminAuth(request: NextRequest): NextResponse | null {
  if (!env.ADMIN_USER || !env.ADMIN_PASSWORD) return unauthorized()

  const header = request.headers.get('authorization')
  if (!header?.startsWith('Basic ')) return unauthorized()

  const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf-8')
  const sep = decoded.indexOf(':')
  if (sep === -1) return unauthorized()
  const user = decoded.slice(0, sep)
  const pass = decoded.slice(sep + 1)

  const userOk = timingSafeEqualStrings(user, env.ADMIN_USER)
  const passOk = timingSafeEqualStrings(pass, env.ADMIN_PASSWORD)
  if (!userOk || !passOk) return unauthorized()

  return null
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const denied = checkAdminAuth(request)
    if (denied) return denied
  }

  if (
    ROOT_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}-`),
    )
  ) {
    return NextResponse.next()
  }
  if (pathname !== '/' && PUBLIC_FILE.test(pathname)) return NextResponse.next()

  const first = pathname.split('/')[1] ?? ''
  // /en/... already maps to [lang]=en
  if ((LOCALES as readonly string[]).includes(first)) return NextResponse.next()

  // everything else is Spanish: rewrite to /es/<path> so [lang]=es renders it.
  // The browser URL stays "/services"; usePathname() on the client sees the original path.
  const url = request.nextUrl.clone()
  url.pathname = `/es${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|llms.txt|opengraph-image|icon|apple-icon|manifest).*)',
  ],
}
