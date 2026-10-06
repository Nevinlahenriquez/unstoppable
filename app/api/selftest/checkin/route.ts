import { NextRequest, NextResponse } from 'next/server'
import { claimSeat, releaseSeats, usedSeats } from '../../../../lib/checkins'

// TEMPORARY: proves two scans of one seat at the same moment admit it once.
// Dead unless SELFTEST_KEY is set (Preview only, removed after the test).
export async function GET(req: NextRequest) {
  const key = process.env.SELFTEST_KEY
  if (!key || req.nextUrl.searchParams.get('key') !== key) return new NextResponse('Not found', { status: 404 })
  const id = `pi_SELFTEST${Date.now()}`
  const n = 8
  const results = await Promise.all(Array.from({ length: n }, (_, i) => claimSeat(id, 1, `phone-${i}`)))
  const second = await claimSeat(id, 1, 'late-phone')
  const seen = await usedSeats(id)
  await releaseSeats(id)
  const after = await usedSeats(id)
  return NextResponse.json({
    parallelScans: n,
    admitted: results.filter(r => r.ok).length,
    alreadyIn: results.filter(r => !r.ok && r.already).length,
    errors: results.filter(r => !r.ok && !r.already).map(r => (r as { error: string }).error),
    laterScan: second.ok ? 'admitted (WRONG)' : second.already ? 'already in' : 'error',
    seatsRecorded: seen.size,
    cleanedUp: after.size === 0,
  })
}
