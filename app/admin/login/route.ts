import { NextRequest, NextResponse } from 'next/server'
import { isAllowed, makeToken } from '../../../lib/admin-auth'
import { sendEmail } from '../../../lib/emails'
import { EVENT } from '../../config'

// POST { email } -> emails a sign-in link if the address is an admin.
// The answer is the same either way, so this cannot be used to find out who
// the admins are.
export async function POST(req: NextRequest) {
  const { email = '' } = (await req.json().catch(() => ({}))) as { email?: string }
  const clean = String(email).trim().toLowerCase()
  if (!process.env.ADMIN_SECRET) return NextResponse.json({ ok: false, error: 'Admin sign-in is not set up yet.' }, { status: 503 })
  if (clean && isAllowed(clean)) {
    const link = `${req.nextUrl.origin}/admin/auth?t=${encodeURIComponent(makeToken(clean, 'link'))}`
    const r = await sendEmail(clean, `Your sign-in link: ${EVENT.name} admin`,
      `<div style="font-family:Inter,Arial,sans-serif;background:#000;color:#fff;padding:32px"><p style="color:#E3AE45;font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:12px">${EVENT.name} · Admin</p><p style="font-size:16px;line-height:1.6">Tap the button to open the event dashboard. The link works for 15 minutes.</p><p><a href="${link}" style="display:inline-block;background:#E3AE45;color:#000;font-weight:700;padding:13px 22px;text-decoration:none">Open the dashboard</a></p><p style="color:#8E8576;font-size:13px">Did not ask for this? Ignore it, nothing happens.</p></div>`)
    if (!r.ok) return NextResponse.json({ ok: false, error: 'The sign-in email could not be sent. Try again in a minute.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
