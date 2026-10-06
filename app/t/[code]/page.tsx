import type { Metadata } from 'next'
import { EVENT, VENUE, dateLabel, timeLabel, getTier } from '../../config'
import { getGuest } from '../../../lib/guests'
import { qrSvg, readCode, isSample, sampleGuest } from '../../../lib/ticket'
import { usedSeats } from '../../../lib/checkins'
import { RememberTicket } from '../../../components/MyTicket'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Your ticket · ${EVENT.name}`, robots: { index: false, follow: false } }

const baliTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })
const gold = '#E3AE45'

// The guest's LIVE ticket. No login: the signed code in the address IS the key.
// An order code shows every seat; a seat code (what a QR holds, or a seat
// forwarded to a friend) shows only that seat. Each seat says whether it has
// been used at the door, read fresh from the check-in files on every visit.
export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code
  const ref = readCode(code)
  const sample = isSample(ref?.id)
  const g = !ref ? null : sample ? { ...sampleGuest } : await getGuest(ref.id).catch(() => null)
  const valid = g && ref && (ref.seat == null || ref.seat <= g.qty)
  const seats = valid ? (ref!.seat != null ? [ref!.seat] : Array.from({ length: g!.qty }, (_, i) => i + 1)) : []
  const used = valid && !sample ? await usedSeats(g!.id).catch(() => new Map<number, string>()) : new Map<number, string>()
  const cards = valid ? await Promise.all(seats.map(async n => ({ n, svg: await qrSvg(g!.id, n), at: used.get(n) ?? '' }))) : []
  const allIn = cards.length > 0 && cards.every(c => c.at)
  const single = ref?.seat != null
  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', fontFamily: 'var(--vv-body), system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400, border: '1px solid rgba(227,174,69,.5)', borderRadius: 6, padding: '28px 22px', background: '#0D0C0A', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: gold }}>{EVENT.city} · Live event</p>
        <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--vv-display), Impact, sans-serif', fontWeight: 400, textTransform: 'uppercase', fontSize: 34, lineHeight: 1.1 }}>{EVENT.name}</h1>
        {!valid ? (
          <p style={{ margin: '18px 0 0', color: '#F2B8A0', lineHeight: 1.6 }}>We could not find this ticket. Check the link in your email, or write to <a href={`mailto:${EVENT.contactEmail}`} style={{ color: gold }}>{EVENT.contactEmail}</a>.</p>
        ) : (
          <>
            {sample ? <p style={{ margin: '10px 0 8px', padding: '8px 10px', border: `1px solid ${gold}`, borderRadius: 4, color: gold, fontSize: 13, fontWeight: 700 }}>Sample ticket from a test email. Not valid at the door.</p> : <RememberTicket code={code} />}
            <p style={{ margin: '0 0 20px', color: '#B5AD9F', fontSize: 14 }}>{EVENT.subtitle}</p>
            {allIn && <p style={{ margin: '0 0 18px', padding: '12px 10px', background: '#1F6B34', borderRadius: 4, fontWeight: 800, fontSize: 16 }}>Checked in{cards.length > 1 ? `: all ${cards.length} seats` : ''}. Enjoy the day.</p>}
            {cards.map(c => (
              <div key={c.n} style={{ marginBottom: 22 }}>
                {(g!.qty > 1) && <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: gold }}>Seat {c.n} of {g!.qty}</p>}
                <div style={{ position: 'relative', background: '#fff', borderRadius: 6, padding: 10, width: 240, height: 240, margin: '0 auto' }}>
                  <div style={{ opacity: c.at ? 0.15 : 1 }} dangerouslySetInnerHTML={{ __html: c.svg }} />
                  {c.at && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F6B34', fontWeight: 900, fontSize: 26, textTransform: 'uppercase', letterSpacing: '.06em' }}>Used</div>}
                </div>
                <p style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 700, color: c.at ? '#7FD69A' : '#B5AD9F' }}>
                  {c.at ? `Checked in at ${baliTime(c.at)} Bali time` : sample ? 'Sample, not valid at the door' : 'Not used yet. Valid for one entry.'}
                </p>
              </div>
            ))}
            {!allIn && <p style={{ margin: '0 0 20px', color: '#B5AD9F', fontSize: 14 }}>{cards.length > 1 ? 'Show one code per person at the door. You can forward a seat to a friend.' : 'Show this code at the door.'}</p>}
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, textAlign: 'left', margin: 0 }}>
              {[
                ['Name', g!.name || 'Guest'],
                ['Admits', single ? '1 person' : `${g!.qty} ${g!.qty > 1 ? 'people' : 'person'}`],
                ['When', `${dateLabel()} · ${timeLabel()}`],
                ['Where', `${VENUE.name}, ${VENUE.area}`],
                ['Ticket', getTier(g!.tier)?.name ?? '—'],
                ['Ref', g!.id.slice(-8).toUpperCase() + (single ? `-${ref!.seat}` : '')],
              ].map(([k, v]) => (
                <div key={k}><dt style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8E8576' }}>{k}</dt><dd style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 600 }}>{v}</dd></div>
              ))}
            </dl>
            <a href={`/t/${code}/ticket.pdf`} style={{ display: 'inline-flex', marginTop: 22, minHeight: 46, alignItems: 'center', padding: '0 20px', background: gold, color: '#000', fontWeight: 800, borderRadius: 3, textDecoration: 'none' }}>Download PDF</a>
            <p style={{ margin: '14px 0 0', color: '#8E8576', fontSize: 13 }}>Saved on this phone. Tip: add this page to your home screen.</p>
            {VENUE.mapsUrl && <p style={{ margin: '14px 0 0' }}><a href={VENUE.mapsUrl} style={{ color: gold, fontSize: 14 }}>Open the venue in Google Maps</a></p>}
          </>
        )}
      </div>
    </main>
  )
}
