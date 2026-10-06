import { NextResponse } from 'next/server'
import { getGuest } from '../../../../lib/guests'
import { readTicket, ticketPdf } from '../../../../lib/ticket'

// GET /t/<code>/ticket.pdf -> the ticket as a PDF.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const id = readTicket((await params).code)
  const g = id ? await getGuest(id).catch(() => null) : null
  if (!g) return new NextResponse('Ticket not found.', { status: 404 })
  const pdf = await ticketPdf(g)
  return new NextResponse(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="i-am-unstoppable-ticket.pdf"', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}
