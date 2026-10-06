import { NextResponse } from 'next/server'
import { currentAdmin } from '../../../lib/admin-auth'
import { listGuests } from '../../../lib/guests'
import { listRegistrations } from '../../../lib/referrals'

// GET -> every paid guest, then everyone who signed up without paying, as one
// CSV for a spreadsheet or the CRM.
export async function GET() {
  if (!(await currentAdmin())) return new NextResponse('Please sign in.', { status: 401 })
  const guests = (await listGuests()) ?? []
  const regs = await listRegistrations().catch(() => [])
  const paid = new Set(guests.map(g => g.email.toLowerCase()))
  const cols = ['Status', 'Date', 'Name', 'Email', 'Phone', 'Business', 'Website', 'Biggest challenge', 'Result wanted', 'Ticket', 'Seats', 'Paid', 'Referral', 'Checked in'] as const
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = [
    ...guests.map(g => ['Paid', g.createdAt, g.name, g.email, g.phone, g.business, g.website, g.challenge, g.result, g.tier, g.qty, `${g.amount} ${g.currency.toUpperCase()}`, g.ref, g.checkedIn]),
    ...regs.filter(r => r.status !== 'paid' && !paid.has(r.email.toLowerCase())).map(r =>
      [r.status === 'waitlist' ? 'Waitlist' : 'Not paid', r.createdAt, r.name, r.email, r.phone, r.business, r.website, r.challenge, r.result, r.tier, r.qty, '', r.ref, '']),
  ].map(row => row.map(q).join(','))
  return new NextResponse([cols.map(q).join(','), ...rows].join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="unstoppable-guests.csv"', 'Cache-Control': 'no-store' },
  })
}
