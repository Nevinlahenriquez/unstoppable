import { NextRequest, NextResponse } from 'next/server'
import { currentAdmin } from '../../../../lib/admin-auth'
import { buildEmail, sendEmail } from '../../../../lib/emails'
import { STAGES, type EmailStage } from '../../../../lib/guests'

// POST { stage } -> sends that email to the signed-in admin, with sample details.
export async function POST(req: NextRequest) {
  const me = await currentAdmin()
  if (!me) return NextResponse.json({ ok: false, error: 'Please sign in again.' }, { status: 401 })
  const { stage } = (await req.json().catch(() => ({}))) as { stage?: string }
  if (!STAGES.includes(stage as EmailStage)) return NextResponse.json({ ok: false, error: 'Unknown email.' }, { status: 400 })
  const { subject, html } = buildEmail(stage as EmailStage, { name: 'Test Guest', qty: 1, tier: 'early', result: 'Speak on a stage with total confidence' })
  const r = await sendEmail(me, `[TEST] ${subject}`, html)
  return NextResponse.json({ ...r, to: me }, { status: r.ok ? 200 : 502 })
}
