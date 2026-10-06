import { NextRequest, NextResponse } from 'next/server'
import { DOOR_COOKIE, DOOR_MS, checkPassword, clearFailures, doorConfigured, makeDoorToken, noteFailure, throttled } from '../../../lib/door-auth'

// POST { password } -> sets the door cookie. Same answer for every wrong try.
export async function POST(req: NextRequest) {
  if (!doorConfigured()) return NextResponse.json({ ok: false, error: 'The door scanner is not switched on yet.' }, { status: 503 })
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',').pop()?.trim() || 'unknown'
  if (throttled(ip)) return NextResponse.json({ ok: false, error: 'Too many wrong tries. Wait 15 minutes, or ask the hosts.' }, { status: 429 })
  const { password = '' } = (await req.json().catch(() => ({}))) as { password?: string }
  if (!checkPassword(String(password))) {
    noteFailure(ip)
    return NextResponse.json({ ok: false, error: 'That password is not right.' }, { status: 401 })
  }
  clearFailures(ip)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(DOOR_COOKIE, makeDoorToken(), { httpOnly: true, secure: true, sameSite: 'lax', path: '/door', maxAge: DOOR_MS / 1000 })
  return res
}
