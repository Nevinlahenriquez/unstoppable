import { NextRequest, NextResponse } from 'next/server'
import { isDoorStaff } from '../../../../lib/door-auth'
import { admit } from '../../../../lib/admit'

// POST { code } -> the door team's scan. Admits one seat, answers only the
// name, seats and first-scan time (lib/admit.ts). Nothing else is reachable
// with the door password.
export async function POST(req: NextRequest) {
  if (!(await isDoorStaff())) return NextResponse.json({ ok: false, status: 'auth', error: 'Please enter the door password again.' }, { status: 401 })
  const { code } = (await req.json().catch(() => ({}))) as { code?: string }
  const r = await admit(code, 'door')
  return NextResponse.json(r, { status: r.status === 'error' ? 502 : 200 })
}
