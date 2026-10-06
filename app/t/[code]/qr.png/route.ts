import { NextResponse } from 'next/server'
import { qrPng, readTicket } from '../../../../lib/ticket'

// GET /t/<code>/qr.png -> the ticket's QR code, for the email. Needs only a valid code.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const id = readTicket((await params).code)
  if (!id) return new NextResponse('Not a valid ticket.', { status: 404 })
  const png = await qrPng(id)
  return new NextResponse(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Robots-Tag': 'noindex' } })
}
