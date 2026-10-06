import { NextResponse } from 'next/server'
import { currentAdmin } from '../../../lib/admin-auth'
import { listGuests } from '../../../lib/guests'

// GET -> every guest as a CSV file, for a spreadsheet or the CRM.
export async function GET() {
  if (!(await currentAdmin())) return new NextResponse('Please sign in.', { status: 401 })
  const guests = (await listGuests()) ?? []
  const cols = ['Bought', 'Name', 'Email', 'Phone', 'Business', 'Website', 'Biggest challenge', 'Result wanted', 'Ticket', 'Seats', 'Paid', 'Checked in'] as const
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = guests.map(g => [g.createdAt, g.name, g.email, g.phone, g.business, g.website, g.challenge, g.result, g.tier, g.qty, `${g.amount} ${g.currency.toUpperCase()}`, g.checkedIn].map(q).join(','))
  return new NextResponse([cols.map(q).join(','), ...rows].join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="unstoppable-guests.csv"', 'Cache-Control': 'no-store' },
  })
}
