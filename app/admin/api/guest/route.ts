import { NextRequest, NextResponse } from 'next/server'
import { currentAdmin } from '../../../../lib/admin-auth'
import { getGuest, setMeta, STAGES, type EmailStage } from '../../../../lib/guests'
import { sendStage } from '../../../../lib/deliver'

// POST { id, action: 'checkin' | 'uncheck' | 'resend', stage? }
export async function POST(req: NextRequest) {
  if (!(await currentAdmin())) return NextResponse.json({ ok: false, error: 'Please sign in again.' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { id?: string; action?: string; stage?: string }
  const id = String(b.id ?? '')
  if (b.action === 'checkin' || b.action === 'uncheck') {
    const cur = await getGuest(id)
    const g = cur && await setMeta(id, b.action === 'checkin' ? { checked_in: cur.checkedIn || new Date().toISOString(), checked_in_n: String(cur.qty) } : { checked_in: '', checked_in_n: '' })
    return g ? NextResponse.json({ ok: true, guest: g }) : NextResponse.json({ ok: false, error: 'Guest not found.' }, { status: 404 })
  }
  if (b.action === 'resend' && STAGES.includes(b.stage as EmailStage)) {
    const g = await getGuest(id)
    if (!g) return NextResponse.json({ ok: false, error: 'Guest not found.' }, { status: 404 })
    const r = await sendStage(g, b.stage as EmailStage, true)
    return NextResponse.json(r, { status: r.ok ? 200 : 502 })
  }
  return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 400 })
}
