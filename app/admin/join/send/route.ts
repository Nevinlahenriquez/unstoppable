import { NextRequest, NextResponse } from 'next/server'
import { INVITE_MAX_SENDS, countInviteSend, makeJoinToken, openInvite, readInviteCode, validEmail } from '../../../../lib/admin-auth'
import { sendEmail } from '../../../../lib/emails'
import { EVENT } from '../../../config'

// POST { code, email } -> emails a confirm link to that address. Opening it is
// what makes the person an admin, so the invite only goes to an inbox they own.
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { code?: string; email?: string }
  const id = readInviteCode(String(b.code ?? ''))
  const inv = id ? await openInvite(id) : null
  if (!inv) return NextResponse.json({ ok: false, error: 'This invite has expired or was already used. Ask Nevin for a new one.' }, { status: 410 })
  const email = String(b.email ?? '').trim().toLowerCase()
  if (!validEmail(email)) return NextResponse.json({ ok: false, error: 'That does not look like an email address.' }, { status: 400 })
  if (inv.sends >= INVITE_MAX_SENDS) return NextResponse.json({ ok: false, error: 'Too many emails sent for this invite. Ask Nevin for a new one.' }, { status: 429 })
  await countInviteSend(inv)
  const link = `${req.nextUrl.origin}/admin/join/confirm?t=${encodeURIComponent(makeJoinToken(email, inv.id))}`
  const r = await sendEmail(email, `Confirm your access: ${EVENT.name} admin`,
    `<div style="font-family:Inter,Arial,sans-serif;background:#000;color:#fff;padding:32px"><p style="color:#E3AE45;font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:12px">${EVENT.name} · Admin</p><p style="font-size:16px;line-height:1.6">You were invited to the event dashboard. Tap the button to confirm this is your email. From then on you sign in with this address. The link works for 30 minutes.</p><p><a href="${link}" style="display:inline-block;background:#E3AE45;color:#000;font-weight:700;padding:13px 22px;text-decoration:none">Confirm and open the dashboard</a></p><p style="color:#8E8576;font-size:13px">Did not ask for this? Ignore it, nothing happens.</p></div>`)
  if (!r.ok) return NextResponse.json({ ok: false, error: 'The email could not be sent. Try again in a minute.' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
