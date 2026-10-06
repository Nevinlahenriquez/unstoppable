import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { EVENT, getTier, tierOpen, dateLabel } from '../config'
import { EVENT_KEY, MAX_PER_ORDER, stock } from '../seats'
import { salesOpen, SALES_CLOSED_MESSAGE } from '../sales'
import { storeReady } from '../../lib/store'
import { buildWaitlistEmail, sendEmail } from '../../lib/emails'
import { cleanCode, getReferrer, getSettings, newId, saveRegistration, type Registration } from '../../lib/referrals'

const clip = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─────────────────────────────────────────────────────────────────────────────
// POST /checkout  { tier, qty?, details, ref? }  ->  { clientSecret } or { waitlist: true }
//
// Creates a Stripe Checkout session and returns its URL. The browser sends a
// tier id and NOTHING about money: the amount comes from config.ts, here, on
// the server, so a ticket can never be bought at a price somebody typed.
//
// Stripe's hosted checkout shows card, Apple Pay and Google Pay on its own
// whenever those wallets are switched on in the Stripe dashboard
// (Settings -> Payment methods). Nothing in this code needs to change for them,
// and because the page is Stripe's, no Apple Pay domain verification is needed
// on the event's own domain either.
//
// The URLs it sends people back to are built from the request's own origin, so
// the same code works on this site and on the event's custom domain.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY
  const body = (await req.json().catch(() => ({}))) as {
    tier?: string; qty?: number; ref?: string
    details?: Record<string, string>
  }
  // WHO IS COMING. Our own form, before Stripe. Name, email and phone are
  // required; the rest is optional and feeds the follow-up.
  const d = body.details ?? {}
  const who = {
    name: clip(d.name, 200), email: clip(d.email, 200).toLowerCase(), phone: clip(d.phone, 60),
    business: clip(d.business, 200), website: clip(d.website, 255),
    challenge: clip(d.challenge, 450), result: clip(d.result, 450),
  }
  if (!who.name || !EMAIL_RE.test(who.email) || who.phone.replace(/\D/g, '').length < 6) {
    return NextResponse.json({ ok: false, error: 'Please fill in your name, a valid email and your phone number.' }, { status: 400 })
  }
  const referrer = body.ref ? await getReferrer(cleanCode(body.ref)).catch(() => null) : null
  const ref = referrer?.code ?? ''

  // Nothing is sold until TICKET_SALES_OPEN=true is set in Vercel (see sales.ts).
  // Until then the form still works: it saves them to the list as "waitlist".
  if (!secret || !salesOpen()) {
    if (storeReady()) {
      const t = getTier(String(body.tier ?? ''))
      await saveRegistration({ id: newId(), createdAt: new Date().toISOString(), status: 'waitlist', tier: t?.id ?? '', qty: Math.max(1, Math.min(MAX_PER_ORDER, Math.floor(Number(body.qty ?? 1)) || 1)), ...who, ref })
        .catch(err => console.error('[unstoppable] could not save waitlist', err))
      const m = buildWaitlistEmail(who.name)
      if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) await sendEmail(who.email, m.subject, m.html, `waitlist-${who.email}`).catch(() => {})
      return NextResponse.json({ ok: true, waitlist: true })
    }
    return NextResponse.json({ ok: false, error: SALES_CLOSED_MESSAGE }, { status: 503 })
  }

  const tier = getTier(String(body.tier ?? ''))
  if (!tier) return NextResponse.json({ ok: false, error: 'Unknown ticket type.' }, { status: 400 })
  const qtyRaw = body.qty
  // The 60-seat cap and the 30 early-bird seats, enforced here. If Stripe
  // cannot be counted the sale goes through rather than blocking every buyer
  // on an API hiccup.
  const st = await stock()
  // A stale page must never buy an expired or sold-out early bird.
  if (!tierOpen(tier, new Date(), st?.tierLeft)) {
    return NextResponse.json({ ok: false, error: `${tier.name} tickets have closed. Refresh the page for the current price.` }, { status: 409 })
  }

  const qty = Math.floor(Number(qtyRaw ?? 1))
  if (!Number.isFinite(qty) || qty < 1 || qty > MAX_PER_ORDER) {
    return NextResponse.json({ ok: false, error: `Choose between 1 and ${MAX_PER_ORDER} tickets.` }, { status: 400 })
  }
  const left: number | null = st ? Math.min(st.left, tier.seats ? (st.tierLeft[tier.id] ?? tier.seats) : st.left) : null
  if (left !== null && left <= 0) {
    return NextResponse.json({ ok: false, error: 'This event is sold out.' }, { status: 409 })
  }
  if (left !== null && qty > left) {
    return NextResponse.json({ ok: false, error: `Only ${left} seat${left === 1 ? '' : 's'} left. Lower the number of tickets.` }, { status: 409 })
  }

  const origin = req.nextUrl.origin
  // The folder's own path on this site, or '' when it is served at the root of
  // its own domain. Derived from where this route was called, so moving the
  // folder needs no edit here.
  const base = req.nextUrl.pathname.replace(/\/checkout\/?$/, '')

  // A referral code can take money off each ticket, if the hosts set that rule.
  const settings = referrer ? await getSettings().catch(() => null) : null
  const off = referrer && settings ? Math.max(0, Math.min(tier.price - 1, Math.floor(settings.friendDiscount || 0))) : 0
  const unit = tier.price - off

  const reg: Registration = { id: newId(), createdAt: new Date().toISOString(), status: 'started', tier: tier.id, qty, ...who, ref }
  if (storeReady()) await saveRegistration(reg).catch(err => console.error('[unstoppable] could not save registration', err))

  // Everything we know goes on the PaymentIntent too, so the admin's guest
  // list (read from Stripe) has it even if the store is ever unreachable.
  const meta = {
    event: EVENT_KEY, tier: tier.id, qty: String(qty), synced: '1', reg: reg.id, ref,
    name: who.name, email: who.email, phone: who.phone, business: who.business,
    website: who.website, challenge: who.challenge, result: who.result,
  }

  try {
    const stripe = new Stripe(secret)
    const session = await stripe.checkout.sessions.create({
      // EMBEDDED: the payment form mounts inside our own /tickets page, in the
      // event's colours, so a buyer never leaves for a Stripe-branded page.
      ui_mode: 'embedded_page',
      mode: 'payment',
      // The event's name, not the company's, at the top of the form. Stripe
      // still prints the account's PUBLIC business name in its terms line and
      // on the receipt email: that is set in the Stripe dashboard, not here.
      branding_settings: {
        display_name: EVENT.name,
        background_color: '#0D0C0A',
        button_color: '#E3AE45',
        border_style: 'rectangular',
        font_family: 'inter',
      },
      customer_email: who.email,
      line_items: [{
        price_data: {
          currency: EVENT.currency,
          unit_amount: unit * 100,
          product_data: {
            name: `${EVENT.name}, ${tier.name} ticket${off ? ` (friend of ${referrer!.name}, $${off} off)` : ''}`,
            description: `${dateLabel()} · ${EVENT.city}`,
          },
        },
        quantity: qty,
      }],
      return_url: `${origin}${base}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      metadata: { event: EVENT_KEY, tier: tier.id, qty: String(qty), reg: reg.id, ref, name: who.name },
      // qty on the PaymentIntent is what seats.ts counts. Do not drop it.
      payment_intent_data: {
        metadata: meta,
        // What appears on the card statement after the account prefix.
        statement_descriptor_suffix: 'UNSTOPPABLE',
      },
    })
    return NextResponse.json({ ok: true, clientSecret: session.client_secret })
  } catch (err) {
    console.error('[unstoppable] checkout failed', err)
    return NextResponse.json({ ok: false, error: 'Checkout could not start. Please try again in a moment.' }, { status: 502 })
  }
}
