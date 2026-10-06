import { ImageResponse } from 'next/og'
import { EVENT, VENUE, dateLabel } from './config'

// The card WhatsApp, Instagram and LinkedIn show when the link is shared.
// Words come from config.ts, so a changed date changes the card too.
export const alt = `${EVENT.name} · ${EVENT.subtitle}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '70px 80px', background: 'radial-gradient(circle at 75% 20%, #3a2a0e 0%, #0a0806 60%)', color: '#f4efe7', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 28, letterSpacing: 6, color: '#E3AE45', textTransform: 'uppercase' }}>{`${dateLabel()} · ${VENUE.area}`}</div>
        <div style={{ fontSize: 118, fontWeight: 900, lineHeight: 1, marginTop: 24, textTransform: 'uppercase', letterSpacing: -2 }}>{EVENT.name}</div>
        <div style={{ fontSize: 40, marginTop: 26, color: '#F7D27A' }}>{EVENT.subtitle}</div>
        <div style={{ fontSize: 28, marginTop: 40, color: 'rgba(244,239,231,.75)' }}>{`With Luke Anning & Nevin Henriquez · ${VENUE.partnerLine} · ${EVENT.seats} seats`}</div>
      </div>
    ),
    size,
  )
}
