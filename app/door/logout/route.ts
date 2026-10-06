import { NextRequest, NextResponse } from 'next/server'
import { DOOR_COOKIE } from '../../../lib/door-auth'

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/door', req.nextUrl.origin), 303)
  res.cookies.set(DOOR_COOKIE, '', { path: '/door', maxAge: 0 })
  return res
}
