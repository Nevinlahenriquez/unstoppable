import { NextResponse } from 'next/server'
import { getJSON, putJSON, storeReady } from '../../../lib/store'

export const dynamic = 'force-dynamic'

// GET /api/health -> writes one fixed file to the event data store and reads it
// back. Proves the store is connected and working. Holds no guest data.
export async function GET() {
  if (!storeReady()) return NextResponse.json({ ok: false, store: 'not connected' }, { status: 503 })
  const at = new Date().toISOString()
  try {
    await putJSON('health/ping.json', { at })
    const back = await getJSON<{ at: string }>('health/ping.json')
    const ok = back?.at === at
    return NextResponse.json({ ok, store: ok ? 'read and write working' : 'wrote but could not read back', at }, { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return NextResponse.json({ ok: false, store: 'write failed', error: String((err as Error)?.message ?? err).slice(0, 200) }, { status: 503 })
  }
}
