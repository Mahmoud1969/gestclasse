import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

/**
 * Guards the whole app behind the prof password. Unauthenticated users are
 * redirected to /login for page requests, and receive 401 for API requests.
 *
 * Public (no auth required): /login page, /api/auth/* endpoints, Next static
 * assets and the favicon (handled by the matcher below).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always-public paths
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/')
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  const valid = await verifySessionToken(token)

  if (valid) return NextResponse.next()

  // API requests → 401 JSON
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Page requests → redirect to login
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.search = ''
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Run on everything except Next internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ico)$).*)'],
}
