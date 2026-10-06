import { NextRequest, NextResponse } from 'next/server'
import { currentAdmin } from '../../../../lib/admin-auth'
import { getGuest, setMeta } from '../../../../lib/guests'
import { readTicket } from '../../../../lib/ticket'

// POST { code } -> admits ONE seat of the order behind a scanned QR.
//   ok        admitted now (seat N of qty)
//   already   every seat on this ticket is already in (shows when)
//   invalid   not one of our tickets, or the order is not paid
export async function POST(req: NextRequest) {
  if (!(await currentAdmin())) return NextResponse.json({ ok: false, status: 'auth', error: 'Please sign in again.' }, { status: 401 })
  const { code } = (await req.json().catch(() => ({}))) as { code?: string }
  const id = readTicket(String(code ?? ''))
  if (!id) return NextResponse.json({ ok: false, status: 'invalid', error: 'This is not a valid ticket.' })
  const g = await getGuest(id).catch(() => null)
  if (!g) return NextResponse.json({ ok: false, status: 'invalid', error: 'No paid order found for this ticket.' })
  if (g.checkedInCount >= g.qty) {
    return NextResponse.json({ ok: false, status: 'already', guest: g, error: `Already checked in${g.qty > 1 ? ` (all ${g.qty} seats)` : ''}.` })
  }
  const n = g.checkedInCount + 1
  const saved = await setMeta(id, { checked_in: g.checkedIn || new Date().toISOString(), checked_in_n: String(n) }).catch(() => null)
  if (!saved) return NextResponse.json({ ok: false, status: 'error', error: 'Could not save the check-in. Scan again.' }, { status: 502 })
  return NextResponse.json({ ok: true, status: 'ok', guest: saved, seat: n })
}
