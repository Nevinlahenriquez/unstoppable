'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { loadStripe, type Stripe, type StripeEmbeddedCheckout } from '@stripe/stripe-js'
import { CalendarDays, Clock, MapPin, ShieldCheck, Utensils, Users, Lock } from 'lucide-react'
import amaviLogo from '../amavi-logo.jpg'
import amaviInterior from '../amavi-interior.webp'
import { EVENT, VENUE, getTier, dateLabel, money, MAX_PER_ORDER, INCLUDED } from '../config'
import type { Stock } from '../seats'
import { SALES_CLOSED_MESSAGE } from '../sales'

// ─────────────────────────────────────────────────────────────────────────────
// I AM UNSTOPPABLE · the booking page. Step 1: how many seats (summary on the
// left). Step 2: Stripe's payment form mounts on the right, inside this page,
// styled by branding_settings in checkout/route.ts. Changing the number of
// seats tears the form down and builds a fresh session, because a session's
// quantity is fixed once created.
// ─────────────────────────────────────────────────────────────────────────────

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
let stripePromise: Promise<Stripe | null> | null = null
const getStripe = () => (PK ? (stripePromise ??= loadStripe(PK)) : Promise.resolve(null))

export default function TicketsClient({ tierId, initialQty, stock, open }: { tierId: string; initialQty: number; stock: Stock | null; open: boolean }) {
  const tier = getTier(tierId)!
  const left = stock ? (tier.seats ? Math.min(stock.left, stock.tierLeft[tier.id] ?? tier.seats) : stock.left) : null
  const soldOut = left !== null && left <= 0
  const maxQty = Math.max(1, Math.min(MAX_PER_ORDER, left ?? MAX_PER_ORDER))
  const [qty, setQty] = useState(Math.min(initialQty, maxQty))
  const [paying, setPaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const host = useRef<HTMLDivElement>(null)
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null)

  useEffect(() => {
    if (!paying) return
    let cancelled = false
    const base = window.location.pathname.replace(/\/tickets\/?$/, '')
    const fetchClientSecret = async () => {
      const res = await fetch(`${base}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier.id, qty }),
      })
      const d = (await res.json().catch(() => ({}))) as { clientSecret?: string; error?: string }
      if (!res.ok || !d.clientSecret) throw new Error(d.error || 'Checkout could not start. Please try again.')
      return d.clientSecret
    }
    ;(async () => {
      try {
        const stripe = await getStripe()
        if (!stripe) throw new Error('Ticket sales are not switched on yet.')
        const co = await stripe.initEmbeddedCheckout({ fetchClientSecret })
        if (cancelled) { co.destroy(); return }
        checkoutRef.current = co
        if (host.current) { co.mount(host.current); host.current.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
        setLoading(false)
      } catch (e) {
        if (!cancelled) { setError(e instanceof Error ? e.message : 'Checkout could not start.'); setLoading(false); setPaying(false) }
      }
    })()
    return () => {
      cancelled = true
      try { checkoutRef.current?.destroy() } catch { /* already gone */ }
      checkoutRef.current = null
    }
  }, [paying, qty, tier.id])

  const go = () => { setError(''); setLoading(true); setPaying(true) }
  const back = () => { window.location.href = window.location.pathname.replace(/\/tickets\/?$/, '') || '/' }

  return (
    <main className="tk">
      <header className="tk-top">
        <button className="tk-back" onClick={back}>← Back to the event</button>
        <span className="tk-brand">{EVENT.name}<i>.</i></span>
        <span className="tk-secure"><Lock size={14} aria-hidden="true" /> Secure</span>
      </header>

      {/* progress: seats -> payment -> confirmed */}
      <ol className="tk-steps" aria-label="Booking progress">
        <li className="on">Seats</li>
        <li className={paying ? 'on' : ''}>Payment</li>
        <li>Confirmed</li>
      </ol>

      <div className="tk-grid">
        {/* ── Summary ───────────────────────────────────────────────── */}
        <section className="tk-sum">
          <div className="tk-hero">
            <Image src={amaviInterior} alt="" fill priority sizes="(max-width: 900px) 100vw, 560px" style={{ objectFit: 'cover' }} />
            <div className="tk-hero-in">
              <p className="tk-kicker">Your booking</p>
              <h1><span>{EVENT.name.split(' ').slice(0, -1).join(' ')}</span> <b>{EVENT.name.split(' ').slice(-1)}</b></h1>
              <p className="tk-sub">{EVENT.subtitle} · Luke Anning &amp; Nevin Henriquez</p>
            </div>
          </div>
          <ul className="tk-facts">
            <li><CalendarDays size={18} aria-hidden="true" />{dateLabel()}</li>
            <li><Clock size={18} aria-hidden="true" />{EVENT.startTime}–{EVENT.endTime} {EVENT.timeZoneLabel}</li>
            <li><MapPin size={18} aria-hidden="true" />{VENUE.name}, {VENUE.area}</li>
            <li><Utensils size={18} aria-hidden="true" />Catering by Amavi</li>
          </ul>

          <div className="tk-card">
            <div className="tk-stub" aria-hidden="true"><span>Admit</span><b>{qty}</b></div>
            <div className="tk-row">
              <div>
                <p className="tk-tier">{tier.name}</p>
                <p className="tk-muted">{money(tier.price)} per seat{left !== null && !soldOut ? ` · ${left} left at this price` : ''}</p>
              </div>
              <div className="tk-qty" aria-label="Number of tickets">
                <button type="button" aria-label="One ticket fewer" disabled={paying || qty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <output aria-live="polite">{qty}</output>
                <button type="button" aria-label="One ticket more" disabled={paying || qty >= maxQty} onClick={() => setQty(q => Math.min(maxQty, q + 1))}>+</button>
              </div>
            </div>
            <ul className="tk-incl">{INCLUDED.map(i => <li key={i}>{i}</li>)}</ul>
            <div className="tk-perf" aria-hidden="true" />
            <div className="tk-total">
              <span>Total</span>
              <b>{money(tier.price * qty)} <small>USD</small></b>
            </div>
          </div>

          {stock && (
            <div className="tk-meter">
              <span><Users size={15} aria-hidden="true" /> {soldOut ? 'Sold out' : `${stock.left} of ${EVENT.seats} seats left`}</span>
              <div><i style={{ width: `${Math.round(((EVENT.seats - stock.left) / EVENT.seats) * 100)}%` }} /></div>
            </div>
          )}

          <div className="tk-partner">
            <span>In collaboration with</span>
            <Image src={amaviLogo} alt={VENUE.name} sizes="140px" style={{ width: 140, height: 'auto' }} />
          </div>
        </section>

        {/* ── Payment ───────────────────────────────────────────────── */}
        <section className="tk-pay">
          {soldOut ? (
            <div className="tk-step"><h2>Sold out</h2><p className="tk-muted">Every seat is taken. Write to <a href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a> to join the waiting list.</p></div>
          ) : !open ? (
            <div className="tk-step">
              <p className="tk-kicker">Almost there</p>
              <h2>{SALES_CLOSED_MESSAGE}</h2>
              <p className="tk-muted">Want a seat the moment they do? Write to <a href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a> and we will hold one for you.</p>
            </div>
          ) : !paying ? (
            <div className="tk-step">
              <p className="tk-kicker">Step 1 of 2</p>
              <h2>{qty > 1 ? `${qty} seats` : 'Your seat'}, {money(tier.price * qty)}</h2>
              <p className="tk-muted">Choose your seats, then pay right here. Card, Apple Pay and Google Pay. Your ticket arrives by email straight away.</p>
              <button className="tk-btn" onClick={go}>Continue to payment →</button>
              {error && <p className="tk-error" role="alert">{error}</p>}
              <p className="tk-trust"><ShieldCheck size={16} aria-hidden="true" /> Encrypted payment. We never see your card.</p>
            </div>
          ) : (
            <div className="tk-step tk-step-pay">
              <div className="tk-step-head">
                <p className="tk-kicker">Step 2 of 2 · Payment</p>
                <button className="tk-change" onClick={() => setPaying(false)}>Change seats</button>
              </div>
              {loading && <p className="tk-muted tk-loading">Opening secure payment…</p>}
              <div ref={host} className="tk-host" />
            </div>
          )}
        </section>
      </div>

      {/* Phone: total and the one action, always under the thumb. */}
      {open && !paying && !soldOut && (
        <div className="tk-bar">
          <div><small>{qty > 1 ? `${qty} seats` : '1 seat'} · {tier.name}</small><b>{money(tier.price * qty)}</b></div>
          <button className="tk-btn" onClick={go}>Pay securely →</button>
        </div>
      )}

      <style>{`
        .tk{min-height:100vh;background:radial-gradient(ellipse at 20% 0%,rgba(227,174,69,.18),transparent 55%),#050505;color:#F7F3EA;font-family:var(--vv-body),Inter,system-ui,sans-serif;padding:0 20px 60px}
        .tk *{box-sizing:border-box}
        .tk-top{max-width:1160px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 0;border-bottom:1px solid rgba(227,174,69,.18)}
        .tk-back{background:none;border:0;color:#B5AD9F;font:600 14px/1 inherit;cursor:pointer;padding:10px 0}
        .tk-brand{font-family:var(--vv-display),Impact,sans-serif;text-transform:uppercase;font-size:20px;letter-spacing:.03em}
        .tk-brand i{font-style:normal;color:#E3AE45}
        .tk-secure{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#E3AE45}
        .tk-steps{max-width:1160px;margin:18px auto 0;padding:0;list-style:none;display:flex;gap:8px;counter-reset:st}
        .tk-steps li{flex:1;counter-increment:st;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#6E675B;padding-top:10px;border-top:3px solid rgba(227,174,69,.15)}
        .tk-steps li:before{content:counter(st) '  '}
        .tk-steps li.on{color:#F7D27A;border-color:#E3AE45}
        .tk-hero{position:relative;border-radius:6px;overflow:hidden;border:1px solid rgba(227,174,69,.25);margin-bottom:20px;min-height:220px;display:flex;align-items:flex-end}
        .tk-hero img{filter:sepia(.45) saturate(1.2) contrast(1.05)}
        .tk-hero:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.92) 85%)}
        .tk-hero-in{position:relative;z-index:1;padding:22px}
        .tk-grid{max-width:1160px;margin:28px auto 0;display:grid;grid-template-columns:1fr 1.1fr;gap:28px;align-items:start}
        .tk-kicker{margin:0 0 10px;font-size:11.5px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#E3AE45}
        .tk-sum h1{margin:0;font-family:var(--vv-display),Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:clamp(44px,6vw,72px);line-height:.95}
        .tk-sum h1 span{display:block;font-size:.4em;letter-spacing:.16em}
        .tk-sum h1 b{font-weight:400;background:linear-gradient(100deg,#F7D27A,#E3AE45 40%,#FFF3C9 60%,#C98A1E);-webkit-background-clip:text;background-clip:text;color:transparent}
        .tk-sub{margin:10px 0 22px;color:#B5AD9F;font-size:14px}
        .tk-facts{list-style:none;margin:0 0 24px;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .tk-facts li{display:flex;align-items:center;gap:10px;font-size:14.5px;font-weight:600}
        .tk-facts svg{color:#E3AE45;flex-shrink:0}
        .tk-card{position:relative;border:1px solid rgba(227,174,69,.6);border-radius:10px;background:radial-gradient(ellipse at 100% 0%,rgba(247,210,122,.18),transparent 55%),linear-gradient(160deg,#21190A,#0B0905);padding:24px 24px 22px;box-shadow:0 30px 80px -30px rgba(227,174,69,.45),inset 0 1px 0 rgba(247,210,122,.25)}
        .tk-stub{position:absolute;right:-1px;top:18px;display:flex;flex-direction:column;align-items:center;padding:8px 12px;background:linear-gradient(180deg,#F7D27A,#E3AE45);color:#000;border-radius:4px 0 0 4px}
        .tk-stub span{font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase}
        .tk-stub b{font-family:var(--vv-display),Impact,sans-serif;font-weight:400;font-size:24px;line-height:1}
        .tk-card .tk-row{padding-right:62px}
        .tk-perf{position:relative;height:0;border-top:2px dashed rgba(227,174,69,.35);margin:6px -24px 0}
        .tk-perf:before,.tk-perf:after{content:'';position:absolute;top:-12px;width:22px;height:22px;border-radius:50%;background:#050505;border:1px solid rgba(227,174,69,.6)}
        .tk-perf:before{left:-12px;clip-path:inset(0 0 0 50%)}
        .tk-perf:after{right:-12px;clip-path:inset(0 50% 0 0)}
        .tk-row{display:flex;justify-content:space-between;align-items:center;gap:16px}
        .tk-tier{margin:0;font-family:var(--vv-display),Impact,sans-serif;text-transform:uppercase;font-size:28px}
        .tk-muted{margin:4px 0 0;color:#B5AD9F;font-size:14px;line-height:1.55}
        .tk-muted a{color:#E3AE45}
        .tk-qty{display:flex;align-items:center;gap:6px}
        .tk-qty button{width:44px;height:44px;border-radius:4px;border:1px solid rgba(227,174,69,.35);background:#000;color:#F7D27A;font-size:22px;cursor:pointer}
        .tk-qty button:disabled{opacity:.35;cursor:default}
        .tk-qty output{min-width:30px;text-align:center;font-family:var(--vv-display),Impact,sans-serif;font-size:26px}
        .tk-incl{list-style:none;margin:18px 0 20px;padding:16px 0 0;border-top:1px solid rgba(227,174,69,.18);display:grid;gap:8px}
        .tk-incl li{font-size:14px;color:#D9D2C4;display:flex;gap:10px}
        .tk-incl li:before{content:'✦';color:#E3AE45;font-size:11px;line-height:1.9}
        .tk-total{display:flex;justify-content:space-between;align-items:baseline;padding-top:18px}
        .tk-total span{font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#B5AD9F}
        .tk-total b{font-family:var(--vv-display),Impact,sans-serif;font-weight:400;font-size:44px;color:#F7D27A}
        .tk-total small{font-family:var(--vv-body),Inter,sans-serif;font-size:12px;color:#B5AD9F;letter-spacing:.14em}
        .tk-meter{margin-top:18px}
        .tk-meter span{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#F7D27A;margin-bottom:8px}
        .tk-meter div{height:6px;border-radius:2px;background:rgba(227,174,69,.15);overflow:hidden}
        .tk-meter i{display:block;height:100%;min-width:4px;background:linear-gradient(90deg,#E3AE45,#F7D27A)}
        .tk-partner{margin-top:26px;display:flex;align-items:center;gap:14px;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#8E8576}
        .tk-partner img{mix-blend-mode:lighten}
        .tk-pay{position:sticky;top:20px}
        .tk-step{border:1px solid rgba(227,174,69,.3);border-radius:6px;background:#0D0C0A;padding:28px}
        .tk-step h2{margin:0;font-family:var(--vv-display),Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:clamp(32px,4vw,46px);line-height:1}
        .tk-btn{margin-top:22px;width:100%;min-height:60px;border:0;border-radius:4px;background:linear-gradient(180deg,#F7D27A,#E3AE45);color:#000;font:800 15px/1 var(--vv-body),Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;box-shadow:0 20px 60px -18px rgba(227,174,69,.7)}
        .tk-trust{display:flex;align-items:center;gap:8px;margin:16px 0 0;font-size:13px;color:#8E8576}
        .tk-trust svg{color:#E3AE45}
        .tk-error{margin:14px 0 0;color:#F0B8A0}
        .tk-step-pay{padding:18px}
        .tk-step-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .tk-step-head .tk-kicker{margin:0}
        .tk-change{background:none;border:1px solid rgba(227,174,69,.35);border-radius:4px;color:#F7D27A;font:600 13px/1 inherit;padding:10px 12px;cursor:pointer}
        .tk-loading{padding:30px 0;text-align:center}
        .tk-host{min-height:200px;border-radius:4px;overflow:hidden}
        .tk-bar{display:none}
        @media (max-width:900px){
          .tk-grid{grid-template-columns:1fr;margin-top:18px}
          .tk-pay{position:static}
          .tk{padding-bottom:120px}
          .tk-pay .tk-step:not(.tk-step-pay) .tk-btn{display:none}
          .tk-bar{display:flex;position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:50;align-items:center;justify-content:space-between;gap:12px;padding:10px 10px 10px 18px;border-radius:8px;background:rgba(8,8,8,.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(227,174,69,.45);box-shadow:0 20px 60px -10px rgba(0,0,0,.9)}
          .tk-bar small{display:block;font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#B5AD9F}
          .tk-bar b{font-family:var(--vv-display),Impact,sans-serif;font-weight:400;font-size:30px;line-height:1;color:#F7D27A}
          .tk-bar .tk-btn{margin:0;width:auto;min-height:54px;padding:0 20px;font-size:13px}
        }
        @media (max-width:560px){
          .tk{padding:0 14px 40px}
          .tk-secure{display:none}
          .tk-facts{grid-template-columns:1fr}
          .tk-card,.tk-step{padding:20px 18px}
          .tk-perf{margin:6px -18px 0}
          .tk-hero{min-height:200px}
          .tk-hero-in{padding:18px}
          .tk-sum h1{font-size:46px}
          .tk-facts{gap:12px;padding:14px;border:1px solid rgba(227,174,69,.18);border-radius:6px;background:#0B0A08}
          .tk-steps{margin-top:12px}
          .tk-step-pay{padding:10px}
        }
      `}</style>
    </main>
  )
}
