import { NextRequest, NextResponse } from 'next/server'
import { currentAdmin } from '../../../../lib/admin-auth'
import { storeReady } from '../../../../lib/store'
import { cleanCode, getReferrer, removeReferrer, saveReferrer, saveSettings } from '../../../../lib/referrals'

// POST { action: 'add', name, email?, code } | { action: 'remove', code } | { action: 'settings', ... }
export async function POST(req: NextRequest) {
  if (!(await currentAdmin())) return NextResponse.json({ ok: false, error: 'Please sign in again.' }, { status: 401 })
  if (!storeReady()) return NextResponse.json({ ok: false, error: 'The event data store is not connected.' }, { status: 503 })
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const num = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)))

  if (b.action === 'add') {
    const name = String(b.name ?? '').trim().slice(0, 120)
    const code = cleanCode(b.code)
    if (!name || code.length < 2) return NextResponse.json({ ok: false, error: 'Give a name and a code of at least 2 letters.' }, { status: 400 })
    if (await getReferrer(code)) return NextResponse.json({ ok: false, error: `The code ${code} is taken. Pick another.` }, { status: 409 })
    await saveReferrer({ code, name, email: String(b.email ?? '').trim().toLowerCase().slice(0, 200), createdAt: new Date().toISOString() })
    return NextResponse.json({ ok: true, code })
  }
  if (b.action === 'remove') {
    await removeReferrer(String(b.code ?? ''))
    return NextResponse.json({ ok: true })
  }
  if (b.action === 'settings') {
    await saveSettings({
      friendDiscount: num(b.friendDiscount, 149),
      rewardPerTicket: num(b.rewardPerTicket, 200),
      freeTicketAt: num(b.freeTicketAt, 60),
      note: String(b.note ?? '').slice(0, 500),
    })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 400 })
}
