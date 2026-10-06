import { NextRequest, NextResponse } from 'next/server'
import { COOKIE, SESSION_MS, addAdmin, claimInvite, isAllowed, makeToken, openInvite, readJoinToken } from '../../../../lib/admin-auth'

// GET ?t=<join token> -> uses up the invite, saves the email as an admin, signs
// them in. A second click on the same email (already an admin) just signs in.
export async function GET(req: NextRequest) {
  const j = readJoinToken(req.nextUrl.searchParams.get('t'))
  const to = (path: string) => NextResponse.redirect(new URL(path, req.nextUrl.origin))
  if (!j) return to('/admin?expired=1')
  let ok = await isAllowed(j.email)
  if (!ok) {
    const inv = await openInvite(j.inviteId)
    if (inv && (await claimInvite(inv.id, j.email))) {
      await addAdmin(j.email, inv.by)
      ok = true
    }
  }
  if (!ok) return to('/admin?expired=1')
  const res = to('/admin')
  res.cookies.set(COOKIE, makeToken(j.email, 'session'), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_MS / 1000 })
  return res
}
