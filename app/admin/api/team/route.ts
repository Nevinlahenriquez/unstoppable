import { NextRequest, NextResponse } from 'next/server'
import { createInvite, currentAdmin, inviteCode, isOwner, removeAdmin, revokeInvite } from '../../../../lib/admin-auth'
import { storeReady } from '../../../../lib/store'

// POST { action: 'invite' } -> a one-time admin invite link (7 days)
//      { action: 'revoke', id } -> cancels an unused invite
//      { action: 'remove', email } -> takes an invited admin's access away
// Owners only (ADMIN_EMAILS). Owners themselves can only be changed in Vercel.
export async function POST(req: NextRequest) {
  const me = await currentAdmin()
  if (!me) return NextResponse.json({ ok: false, error: 'Please sign in again.' }, { status: 401 })
  if (!isOwner(me)) return NextResponse.json({ ok: false, error: 'Only the event owners can change who has access.' }, { status: 403 })
  if (!storeReady()) return NextResponse.json({ ok: false, error: 'The event data store is not connected.' }, { status: 503 })
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>

  if (b.action === 'invite') {
    const inv = await createInvite(me)
    return NextResponse.json({ ok: true, url: `${req.nextUrl.origin}/admin/join/${inviteCode(inv.id)}`, expiresAt: inv.expiresAt })
  }
  if (b.action === 'revoke') {
    const id = String(b.id ?? '')
    if (!/^[A-Za-z0-9_-]{16,40}$/.test(id)) return NextResponse.json({ ok: false, error: 'Unknown invite.' }, { status: 400 })
    await revokeInvite(id)
    return NextResponse.json({ ok: true })
  }
  if (b.action === 'remove') {
    const email = String(b.email ?? '').trim().toLowerCase()
    if (!email || isOwner(email)) return NextResponse.json({ ok: false, error: 'Owners are set in Vercel (ADMIN_EMAILS) and cannot be removed here.' }, { status: 400 })
    await removeAdmin(email)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 400 })
}
