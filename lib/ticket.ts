import { createHmac, timingSafeEqual } from 'node:crypto'
import QRCode from 'qrcode'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { EVENT, VENUE, dateLabel, timeLabel, getTier } from '../app/config'
import type { Guest } from './guests'

// ─────────────────────────────────────────────────────────────────────────────
// TICKETS. No login for guests: every paid order gets ONE ticket code that
// covers all its seats. The code is the Stripe payment id plus a signature, so
// nobody can make up a valid ticket, and it holds nothing private.
//
//   QR content   https://unstoppable.events/t/<code>   (opens the ticket page)
//   PDF          made here in code (pdf-lib), attached to the confirmation email
//   Door         /admin/scan reads the QR and admits one seat per scan
//
// Signed with ADMIN_SECRET. Changing that secret voids every ticket sent.
// ─────────────────────────────────────────────────────────────────────────────

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://unstoppable.events').replace(/\/+$/, '')

function sig(id: string): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET is not set')
  return createHmac('sha256', secret).update(`ticket:${id}`).digest('base64url').slice(0, 16)
}

// The sample ticket (admin test emails, previews). Its code is the word "sample",
// it needs no Stripe payment, and the door scanner never admits it.
export const SAMPLE_ID = 'pi_SAMPLE'
export const sampleGuest = { id: SAMPLE_ID, name: 'Sample Guest', qty: 2, tier: 'early', result: 'Speak on a stage with total confidence' }
export const isSample = (id: string | null | undefined) => id === SAMPLE_ID

export const ticketCode = (paymentId: string) => (isSample(paymentId) ? 'sample' : `${paymentId}.${sig(paymentId)}`)
export const ticketUrl = (paymentId: string) => `${siteUrl()}/t/${ticketCode(paymentId)}`

/** The payment id inside a valid code, or null. Accepts a bare code or a full ticket URL. */
export function readTicket(input: string): string | null {
  const code = decodeURIComponent(String(input ?? '').trim().split(/[?#]/)[0].split('/').pop() ?? '')
  if (code === 'sample') return SAMPLE_ID
  const [id, s] = code.split('.')
  if (!id || !s || !/^pi_[A-Za-z0-9]+$/.test(id) || !process.env.ADMIN_SECRET) return null
  const a = Buffer.from(sig(id)), b = Buffer.from(s)
  return a.length === b.length && timingSafeEqual(a, b) ? id : null
}

export const qrPng = (paymentId: string, width = 600) => QRCode.toBuffer(ticketUrl(paymentId), { width, margin: 2, errorCorrectionLevel: 'M' })
export const qrSvg = (paymentId: string) => QRCode.toString(ticketUrl(paymentId), { type: 'svg', width: 220, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })

// pdf-lib's built-in fonts only speak WinAnsi; anything else becomes '?'.
const safe = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')

/** The ticket as an A6-ish portrait PDF. */
export async function ticketPdf(g: Pick<Guest, 'id' | 'name' | 'qty' | 'tier'>): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`${EVENT.name} ticket`)
  const page = doc.addPage([420, 640])
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const reg = await doc.embedFont(StandardFonts.Helvetica)
  const gold = rgb(0.89, 0.68, 0.27), white = rgb(1, 1, 1), grey = rgb(0.6, 0.57, 0.52)
  page.drawRectangle({ x: 0, y: 0, width: 420, height: 640, color: rgb(0, 0, 0) })
  page.drawRectangle({ x: 16, y: 16, width: 388, height: 608, borderColor: gold, borderWidth: 1.2 })
  const text = (t: string, x: number, y: number, size: number, font = reg, color = white) => page.drawText(safe(t), { x, y, size, font, color })
  text(`${EVENT.city.toUpperCase()} - LIVE EVENT`, 40, 584, 10, bold, gold)
  text(EVENT.name.toUpperCase(), 40, 552, 28, bold)
  text(EVENT.subtitle, 40, 530, 11, reg, grey)
  const png = await doc.embedPng(await qrPng(g.id))
  page.drawRectangle({ x: 110, y: 290, width: 200, height: 200, color: white })
  page.drawImage(png, { x: 115, y: 295, width: 190, height: 190 })
  text('ADMIT', 40, 250, 9, bold, gold)
  text(`${g.qty} ${g.qty > 1 ? 'people' : 'person'}`, 40, 232, 16, bold)
  text('NAME', 220, 250, 9, bold, gold)
  text((g.name || 'Guest').slice(0, 26), 220, 232, 14, bold)
  text('WHEN', 40, 196, 9, bold, gold)
  text(`${dateLabel()}`, 40, 178, 13, bold)
  text(`${timeLabel()}`, 40, 162, 11, reg, grey)
  text('WHERE', 40, 128, 9, bold, gold)
  text(`${VENUE.name}, ${VENUE.area}`, 40, 110, 13, bold)
  const tier = getTier(g.tier)?.name
  if (tier) text(`Ticket: ${tier}`, 40, 76, 10, reg, grey)
  text(isSample(g.id) ? 'SAMPLE TICKET - not valid at the door' : `Show this QR code at the door. Ref ${g.id.slice(-8).toUpperCase()}`, 40, 56, 9, isSample(g.id) ? bold : reg, isSample(g.id) ? gold : grey)
  return doc.save()
}
