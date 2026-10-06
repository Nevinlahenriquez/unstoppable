import { NextResponse } from 'next/server'
import { getGuest } from '../../../../lib/guests'
import { readCode, ticketPdf, isSample, sampleGuest } from '../../../../lib/ticket'

// GET /t/<code>/ticket.pdf -> the ticket as a PDF: every seat for an order
// code, only that seat for a seat code (so a forwarded seat stays one seat).
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const ref = readCode((await params).code)
  const g = !ref ? null : isSample(ref.id) ? sampleGuest : await getGuest(ref.id).catch(() => null)
  if (!g || !ref || (ref.seat != null && ref.seat > g.qty)) return new NextResponse('Ticket not found.', { status: 404 })
  const pdf = await ticketPdf(g, ref.seat ?? undefined)
  return new NextResponse(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="i-am-unstoppable-ticket.pdf"', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}
