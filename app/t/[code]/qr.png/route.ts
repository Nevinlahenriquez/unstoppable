import { NextResponse } from 'next/server'
import { qrPng, readCode } from '../../../../lib/ticket'

// GET /t/<seat code>/qr.png -> that seat's QR code. An order code gives seat 1.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const ref = readCode((await params).code)
  if (!ref) return new NextResponse('Not a valid ticket.', { status: 404 })
  const png = await qrPng(ref.id, ref.seat ?? 1)
  return new NextResponse(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Robots-Tag': 'noindex' } })
}
