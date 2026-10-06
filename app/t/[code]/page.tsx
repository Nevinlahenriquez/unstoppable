import type { Metadata } from 'next'
import { EVENT, VENUE, dateLabel, timeLabel, getTier } from '../../config'
import { getGuest } from '../../../lib/guests'
import { qrSvg, readTicket, ticketCode, isSample, sampleGuest } from '../../../lib/ticket'
import { RememberTicket } from '../../../components/MyTicket'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Your ticket · ${EVENT.name}`, robots: { index: false, follow: false } }

// The guest's ticket. No login: the signed code in the address IS the key.
export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const id = readTicket((await params).code)
  const sample = isSample(id)
  const g = sample ? { ...sampleGuest } : id ? await getGuest(id).catch(() => null) : null
  const svg = g ? await qrSvg(g.id) : ''
  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', fontFamily: 'var(--vv-body), system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400, border: '1px solid rgba(227,174,69,.5)', borderRadius: 6, padding: '28px 22px', background: '#0D0C0A', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#E3AE45' }}>{EVENT.city} · Live event</p>
        <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--vv-display), Impact, sans-serif', fontWeight: 400, textTransform: 'uppercase', fontSize: 34, lineHeight: 1.1 }}>{EVENT.name}</h1>
        {!g ? (
          <p style={{ margin: '18px 0 0', color: '#F2B8A0', lineHeight: 1.6 }}>We could not find this ticket. Check the link in your email, or write to <a href={`mailto:${EVENT.contactEmail}`} style={{ color: '#E3AE45' }}>{EVENT.contactEmail}</a>.</p>
        ) : (
          <>
            {sample ? <p style={{ margin: '10px 0 8px', padding: '8px 10px', border: '1px solid #E3AE45', borderRadius: 4, color: '#E3AE45', fontSize: 13, fontWeight: 700 }}>Sample ticket from a test email. Not valid at the door.</p> : <RememberTicket code={ticketCode(g.id)} />}
            <p style={{ margin: '0 0 20px', color: '#B5AD9F', fontSize: 14 }}>{EVENT.subtitle}</p>
            <div style={{ background: '#fff', borderRadius: 6, padding: 10, width: 240, height: 240, margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: svg }} />
            <p style={{ margin: '14px 0 20px', color: '#B5AD9F', fontSize: 14 }}>Show this code at the door.</p>
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, textAlign: 'left', margin: 0 }}>
              {[
                ['Name', g.name || 'Guest'],
                ['Admits', `${g.qty} ${g.qty > 1 ? 'people' : 'person'}`],
                ['When', `${dateLabel()} · ${timeLabel()}`],
                ['Where', `${VENUE.name}, ${VENUE.area}`],
                ['Ticket', getTier(g.tier)?.name ?? '—'],
                ['Ref', g.id.slice(-8).toUpperCase()],
              ].map(([k, v]) => (
                <div key={k}><dt style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8E8576' }}>{k}</dt><dd style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 600 }}>{v}</dd></div>
              ))}
            </dl>
            <a href={`/t/${ticketCode(g.id)}/ticket.pdf`} style={{ display: 'inline-flex', marginTop: 22, minHeight: 46, alignItems: 'center', padding: '0 20px', background: '#E3AE45', color: '#000', fontWeight: 800, borderRadius: 3, textDecoration: 'none' }}>Download PDF</a>
            <p style={{ margin: '14px 0 0', color: '#8E8576', fontSize: 13 }}>Saved on this phone. Tip: add this page to your home screen.</p>
            {VENUE.mapsUrl && <p style={{ margin: '14px 0 0' }}><a href={VENUE.mapsUrl} style={{ color: '#E3AE45', fontSize: 14 }}>Open the venue in Google Maps</a></p>}
          </>
        )}
      </div>
    </main>
  )
}
