import type { Metadata } from 'next'
import Stripe from 'stripe'
import { EVENT, VENUE, dateLabel, timeLabel, getTier } from '../config'
import { EVENT_KEY } from '../seats'
import { syncGuest, toGuest } from '../../lib/guests'
import { sendStage } from '../../lib/deliver'
import { getRegistration, saveRegistration } from '../../lib/referrals'
import { ticketCode } from '../../lib/ticket'
import { backupGuest } from '../../lib/backup'
import { RememberTicket } from '../../components/MyTicket'

// The page Stripe sends a buyer back to. It asks Stripe whether the session was
// actually PAID before saying "you're in": the redirect alone proves nothing,
// anyone can type this URL.

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Your ticket · ${EVENT.name}`, robots: { index: false, follow: false } }

type Paid = { name: string; email: string; tier: string; amount: string; qty: number; ticket: string }

async function lookup(sessionId: string): Promise<Paid | null> {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null
  try {
    const s = await new Stripe(secret).checkout.sessions.retrieve(sessionId)
    if (s.payment_status !== 'paid' || s.metadata?.event !== EVENT_KEY) return null
    // Save who they are on the order and send the confirmation email, once.
    // A failure here never hides the ticket: the hourly cron catches it up.
    let ticket = ''
    try {
      const stripe = new Stripe(secret)
      const piId = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id
      if (piId) {
        if (process.env.ADMIN_SECRET) ticket = ticketCode(piId)
        const pi = await syncGuest(stripe, await stripe.paymentIntents.retrieve(piId), s)
        await sendStage(toGuest(pi), 'confirmation')
        await backupGuest(toGuest(pi)).catch(err => console.error('[unstoppable] backup failed', err))
        // Mark their form entry as paid, so the admin's waitlist stays honest.
        const reg = await getRegistration(String(s.metadata?.reg ?? ''))
        if (reg && reg.status !== 'paid') await saveRegistration({ ...reg, status: 'paid', paymentId: piId, paidAt: new Date().toISOString() })
      }
    } catch (err) {
      console.error('[unstoppable] could not save guest or send confirmation', err)
    }
    return {
      name: (s.metadata?.name || s.customer_details?.individual_name || s.customer_details?.name)?.split(' ')[0] || 'there',
      email: s.customer_details?.email || '',
      tier: getTier(String(s.metadata?.tier))?.name || 'Ticket',
      qty: Math.max(1, parseInt(s.metadata?.qty ?? '1', 10) || 1),
      amount: s.amount_total != null ? `$${(s.amount_total / 100).toFixed(0)}` : '',
      ticket,
    }
  } catch (err) {
    console.error('[unstoppable] could not read checkout session', err)
    return null
  }
}

export default async function ThankYou({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id = '' } = await searchParams
  const paid = await lookup(session_id)

  return (
    <main className="vvt">
      <div className="vvt-card">
        <p className="vvt-kicker">{EVENT.name} · {EVENT.city}</p>
        {paid ? (
          <>
            <h1>You are in, {paid.name}.</h1>
            <p>{paid.qty > 1 ? `Your ${paid.qty} ${paid.tier.toLowerCase()} tickets` : `Your ${paid.tier.toLowerCase()} ticket`}{paid.amount ? ` (${paid.amount})` : ''} {paid.qty > 1 ? 'are' : 'is'} confirmed. A confirmation email and your receipt are on their way{paid.email ? ` to ${paid.email}` : ''}.</p>
            <dl>
              <div><dt>When</dt><dd>{dateLabel()} · {timeLabel()}</dd></div>
              <div><dt>Where</dt><dd>{VENUE.name}, {VENUE.area}{VENUE.address ? ` · ${VENUE.address}` : ''}{VENUE.mapsUrl ? <> · <a href={VENUE.mapsUrl} target="_blank" rel="noopener noreferrer">Google Maps</a></> : null}</dd></div>
            </dl>
            {paid.ticket && (<>
              <RememberTicket code={paid.ticket} />
              <a className="vvt-ticket" href={`/t/${paid.ticket}`}>Show my ticket</a>
              <p className="vvt-small">Your ticket is saved on this phone: open unstoppable.events again any time and tap “Your ticket”. It is in your email too.</p>
            </>)}
            <p className="vvt-small">The full address, schedule and what to bring follow by email before the day. Questions: <a href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a></p>
          </>
        ) : (
          <>
            <h1>We could not confirm a payment yet.</h1>
            <p>If you just paid, give it a moment and refresh this page. Your receipt from Stripe is the proof of your ticket either way.</p>
            <p className="vvt-small">Something wrong? Write to <a href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a> and we will sort it out.</p>
          </>
        )}
        <a className="vvt-back" href="./">← Back to the event</a>
      </div>
      <style>{`
        .vvt-ticket{display:inline-flex;align-items:center;min-height:48px;padding:0 22px;margin:4px 0 6px;background:#E3AE45;color:#000;font-weight:800;text-decoration:none;border-radius:3px}
        .vvt{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;background:radial-gradient(ellipse at 50% 0%,rgba(227,174,69,.3),transparent 60%),#000;font-family:var(--vv-body),system-ui,sans-serif;color:#fff}
        .vvt-card{max-width:560px;width:100%;background:#0D0C0A;border:1px solid rgba(227,174,69,.35);border-radius:6px;padding:40px 32px}
        .vvt-kicker{font-size:12.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#E3AE45;margin:0 0 14px}
        .vvt h1{font-family:var(--vv-display),Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:clamp(30px,5vw,40px);line-height:1.1;margin:0 0 16px}
        .vvt p{color:#B5AD9F;line-height:1.6;margin:0 0 18px}
        .vvt dl{margin:0 0 20px;display:grid;gap:12px}
        .vvt dt{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#8E8576;font-weight:700}
        .vvt dd{margin:2px 0 0;font-weight:600}
        .vvt-small{font-size:14.5px}
        .vvt a{color:#E3AE45}
        .vvt-back{display:inline-block;margin-top:8px;font-weight:700;text-decoration:none}
      `}</style>
    </main>
  )
}
