import { NextRequest, NextResponse } from 'next/server'
import { cleanCode, getReferrer, getSettings } from '../../../lib/referrals'
import { clientIp, overLimit } from '../../../lib/throttle'

// GET /api/ref?code=MAYA -> { ok, name, discount }. Lets the ticket form say
// "Invited by Maya" and show the friend price before anyone pays. The checkout
// route checks the code again on the server; this answer is only for display.
export async function GET(req: NextRequest) {
  // Slows down anyone trying codes one after another to find a discount.
  if (overLimit(`ref:${clientIp(req)}`, 30, 10 * 60 * 1000)) return NextResponse.json({ ok: false }, { status: 429 })
  const code = cleanCode(req.nextUrl.searchParams.get('code'))
  const r = code ? await getReferrer(code).catch(() => null) : null
  if (!r) return NextResponse.json({ ok: false })
  const s = await getSettings().catch(() => null)
  return NextResponse.json({ ok: true, code: r.code, name: r.name.split(' ')[0], discount: Math.max(0, Math.floor(s?.friendDiscount ?? 0)) })
}
