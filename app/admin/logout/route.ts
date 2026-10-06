import { NextRequest, NextResponse } from 'next/server'
import { COOKIE } from '../../../lib/admin-auth'

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/admin', req.nextUrl.origin), 303)
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
