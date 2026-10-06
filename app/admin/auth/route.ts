import { NextRequest, NextResponse } from 'next/server'
import { COOKIE, SESSION_MS, makeToken, readToken } from '../../../lib/admin-auth'

// GET ?t=<link token> -> sets the 30-day admin cookie and opens /admin.
export async function GET(req: NextRequest) {
  const email = readToken(req.nextUrl.searchParams.get('t') ?? undefined, 'link')
  const res = NextResponse.redirect(new URL(email ? '/admin' : '/admin?expired=1', req.nextUrl.origin))
  if (email) {
    res.cookies.set(COOKIE, makeToken(email, 'session'), {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_MS / 1000,
    })
  }
  return res
}
