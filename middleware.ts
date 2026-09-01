import { NextResponse, type NextRequest } from 'next/server'

import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

/**
 * Gate for /admin/*. Replaces Laravel's `auth` middleware group.
 *
 * /admin/login stays open, otherwise there would be no way in; every other
 * admin URL redirects to it when the session cookie is missing or invalid.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login') {
    // Already signed in — no reason to show the form again.
    const authed = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
    if (authed) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  const authed = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)

  if (!authed) {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
