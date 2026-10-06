import { NextRequest, NextResponse } from 'next/server'
import { listGuests } from '../../../../lib/guests'
import { deliverDue } from '../../../../lib/deliver'

// Hourly (vercel.json). Sends any confirmation that the thank-you page missed,
// and each reminder once it is due. Every send is recorded on the order, so
// running twice sends nothing twice.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const guests = await listGuests()
  if (!guests) return NextResponse.json({ ok: true, skipped: 'Stripe not connected' })
  const sent = await deliverDue(guests)
  return NextResponse.json({ ok: true, guests: guests.length, sent })
}
