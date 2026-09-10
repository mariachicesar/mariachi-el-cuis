import { NextResponse, type NextRequest } from 'next/server'
import { LOCALES } from '@/lib/i18n/locales'

const PUBLIC_FILE = /\.[a-z0-9]+$/i
// Root-level path prefixes that must NOT be rewritten under /[lang]
// (`_next`/`api` internals + Next metadata routes emitted at the app root).
const ROOT_PREFIXES = ['/_next', '/api', '/opengraph-image', '/icon', '/apple-icon', '/manifest']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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
