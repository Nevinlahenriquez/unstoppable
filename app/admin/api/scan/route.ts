import { NextRequest, NextResponse } from 'next/server'
import { currentAdmin } from '../../../../lib/admin-auth'
import { admit } from '../../../../lib/admit'

// POST { code } -> admits ONE seat. See lib/admit.ts.
export async function POST(req: NextRequest) {
  if (!(await currentAdmin())) return NextResponse.json({ ok: false, status: 'auth', error: 'Please sign in again.' }, { status: 401 })
  const { code } = (await req.json().catch(() => ({}))) as { code?: string }
  const r = await admit(code)
  return NextResponse.json(r, { status: r.status === 'error' ? 502 : 200 })
}
