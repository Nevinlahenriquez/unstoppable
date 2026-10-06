import { createHmac, timingSafeEqual } from 'node:crypto'
import QRCode from 'qrcode'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { EVENT, VENUE, dateLabel, timeLabel, getTier } from '../app/config'
import type { Guest } from './guests'

// ─────────────────────────────────────────────────────────────────────────────
// TICKETS. No login for guests. Two kinds of signed code, both holding nothing
// private (a Stripe payment id plus an HMAC, so nobody can make one up):
//
//   order code  <pi>.<sig>        the LIVE TICKET page for the whole order
//                                 ("Open your ticket" in the email)
//   seat code   <pi>.<n>.<sig>    ONE seat. This is what each QR holds, and
//                                 the door admits it exactly once
//
//   QR content   https://unstoppable.events/t/<seat code>
//   PDF          one page per seat, made here in code (pdf-lib)
//   Door         lib/admit.ts. A scan claims checkins/<pi>/<n>.json in the Blob
//                store with a create-only write, so the seat can only be used
//                once even when two door phones scan it at the same moment.
//
// Signed with ADMIN_SECRET. Changing that secret voids every ticket sent.
// ─────────────────────────────────────────────────────────────────────────────

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://unstoppable.events').replace(/\/+$/, '')

function sig(payload: string): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET is not set')
  return createHmac('sha256', secret).update(`ticket:${payload}`).digest('base64url').slice(0, 16)
}
const same = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y) }

// The sample ticket (admin test emails, previews). Its code is the word "sample",
// it needs no Stripe payment, and the door scanner never admits it.
export const SAMPLE_ID = 'pi_SAMPLE'
export const sampleGuest = { id: SAMPLE_ID, name: 'Sample Guest', qty: 2, tier: 'early', result: 'Speak on a stage with total confidence' }
export const isSample = (id: string | null | undefined) => id === SAMPLE_ID

export const ticketCode = (paymentId: string) => (isSample(paymentId) ? 'sample' : `${paymentId}.${sig(paymentId)}`)
export const ticketUrl = (paymentId: string) => `${siteUrl()}/t/${ticketCode(paymentId)}`
export const seatCode = (paymentId: string, seat: number) => (isSample(paymentId) ? `sample-${seat}` : `${paymentId}.${seat}.${sig(`${paymentId}:${seat}`)}`)
export const seatUrl = (paymentId: string, seat: number) => `${siteUrl()}/t/${seatCode(paymentId, seat)}`

export interface TicketRef { id: string; /** null = the whole order (live ticket page), n = one seat */ seat: number | null }

/** What a valid code points at, or null. Accepts a bare code or a full ticket URL. */
export function readCode(input: string): TicketRef | null {
  const code = decodeURIComponent(String(input ?? '').trim().split(/[?#]/)[0].split('/').pop() ?? '')
  if (code === 'sample') return { id: SAMPLE_ID, seat: null }
  const sm = /^sample-([1-9]\d?)$/.exec(code)
  if (sm) return { id: SAMPLE_ID, seat: Number(sm[1]) }
  if (!process.env.ADMIN_SECRET) return null
  const parts = code.split('.')
  const id = parts[0]
  if (!id || !/^pi_[A-Za-z0-9]+$/.test(id)) return null
  if (parts.length === 2) return same(sig(id), parts[1]) ? { id, seat: null } : null
  if (parts.length === 3 && /^[1-9]\d?$/.test(parts[1])) return same(sig(`${id}:${parts[1]}`), parts[2]) ? { id, seat: Number(parts[1]) } : null
  return null
}

/** The payment id inside any valid code (order or seat), or null. */
export const readTicket = (input: string): string | null => readCode(input)?.id ?? null

const qrOpts = { margin: 2, errorCorrectionLevel: 'M' as const }
export const qrPng = (paymentId: string, seat: number, width = 600) => QRCode.toBuffer(seatUrl(paymentId, seat), { ...qrOpts, width })
export const qrSvg = (paymentId: string, seat: number) => QRCode.toString(seatUrl(paymentId, seat), { ...qrOpts, type: 'svg', width: 220, color: { dark: '#000000', light: '#ffffff' } })

// pdf-lib's built-in fonts only speak WinAnsi; anything else becomes '?'.
const safe = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')

/** The ticket as A6-ish portrait pages, one per seat (or only `onlySeat`). */
export async function ticketPdf(g: Pick<Guest, 'id' | 'name' | 'qty' | 'tier'>, onlySeat?: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`${EVENT.name} ticket`)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const reg = await doc.embedFont(StandardFonts.Helvetica)
  const gold = rgb(0.89, 0.68, 0.27), white = rgb(1, 1, 1), grey = rgb(0.6, 0.57, 0.52)
  const seats = onlySeat ? [onlySeat] : Array.from({ length: g.qty }, (_, i) => i + 1)
  for (const seat of seats) {
    const page = doc.addPage([420, 640])
    page.drawRectangle({ x: 0, y: 0, width: 420, height: 640, color: rgb(0, 0, 0) })
    page.drawRectangle({ x: 16, y: 16, width: 388, height: 608, borderColor: gold, borderWidth: 1.2 })
    const text = (t: string, x: number, y: number, size: number, font = reg, color = white) => page.drawText(safe(t), { x, y, size, font, color })
    text(`${EVENT.city.toUpperCase()} - LIVE EVENT`, 40, 584, 10, bold, gold)
    text(EVENT.name.toUpperCase(), 40, 552, 28, bold)
    text(EVENT.subtitle, 40, 530, 11, reg, grey)
    const png = await doc.embedPng(await qrPng(g.id, seat))
    page.drawRectangle({ x: 110, y: 290, width: 200, height: 200, color: white })
    page.drawImage(png, { x: 115, y: 295, width: 190, height: 190 })
    text('ADMITS', 40, 250, 9, bold, gold)
    text(g.qty > 1 ? `1 person - seat ${seat} of ${g.qty}` : '1 person', 40, 232, 14, bold)
    text('NAME', 220, 250, 9, bold, gold)
    text((g.name || 'Guest').slice(0, 26), 220, 232, 14, bold)
    text('WHEN', 40, 196, 9, bold, gold)
    text(`${dateLabel()}`, 40, 178, 13, bold)
    text(`${timeLabel()}`, 40, 162, 11, reg, grey)
    text('WHERE', 40, 128, 9, bold, gold)
    text(`${VENUE.name}, ${VENUE.area}`, 40, 110, 13, bold)
    const tier = getTier(g.tier)?.name
    if (tier) text(`Ticket: ${tier}`, 40, 76, 10, reg, grey)
    text(isSample(g.id) ? 'SAMPLE TICKET - not valid at the door' : `Valid for one entry. Ref ${g.id.slice(-8).toUpperCase()}-${seat}`, 40, 56, 9, isSample(g.id) ? bold : reg, isSample(g.id) ? gold : grey)
  }
  return doc.save()
}
