import { NextRequest, NextResponse } from 'next/server'
import { getJSON, putJSON, storeReady } from '../../../lib/store'
import { currentAdmin } from '../../../lib/admin-auth'

export const dynamic = 'force-dynamic'

// GET /api/health -> is the event data store connected?
// Anyone gets a yes or no. The full check (write one fixed file, read it back)
// runs only for a signed-in admin or the cron secret, so a stranger cannot
// make the site write to the store on every request, and error details from
// the store never reach the public.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const trusted = (!!secret && req.headers.get('authorization') === `Bearer ${secret}`) || !!(await currentAdmin())
  const noStore = { 'Cache-Control': 'no-store' }
  if (!storeReady()) return NextResponse.json({ ok: false, store: 'not connected' }, { status: 503, headers: noStore })
  if (!trusted) return NextResponse.json({ ok: true, store: 'connected' }, { headers: noStore })
  const at = new Date().toISOString()
  try {
    await putJSON('health/ping.json', { at })
    const back = await getJSON<{ at: string }>('health/ping.json')
    const ok = back?.at === at
    return NextResponse.json({ ok, store: ok ? 'read and write working' : 'wrote but could not read back', at }, { status: ok ? 200 : 503, headers: noStore })
  } catch (err) {
    return NextResponse.json({ ok: false, store: 'write failed', error: String((err as Error)?.message ?? err).slice(0, 200) }, { status: 503, headers: noStore })
  }
}
