'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import nevinPhoto from './nevin.jpg'
import lukePhoto from './luke.jpg'
import amaviLogo from './amavi-logo.jpg'
import amaviInterior from './amavi-interior.webp'
import amaviPool from './amavi-pool.jpg'
import circlePhoto from './circle.jpg'
import roomEurope from './room-europe.jpg'
import roomAruba from './room-aruba.jpg'
import roomBarcelona from './room-barcelona.jpg'
import roomCuracao from './room-curacao.jpg'
import { Sun, Eye, BookOpen, Target, Mic, Users, Utensils, MapPin, Coffee, Flame, Crown, Sparkles, type LucideIcon } from 'lucide-react'
import {
  EVENT, VENUE, TIERS, INCLUDED, INCLUDED_DETAIL, OUTCOMES, SHIFT, MISSION, TRUST, SPEAKERS, FLOW, FOR_YOU, FAQ,
  currentTier, tierOpen, dateLabel, formatDate, money, MAX_PER_ORDER, type Tier,
} from './config'
import type { Stock } from './seats'

// ─────────────────────────────────────────────────────────────────────────────
// I AM UNSTOPPABLE (Vision & Voice) · the landing page. Every word and number comes from
// config.ts; this file is layout only. One CSS block at the bottom (.vv-*).
//
// Design: quiet luxury. Warm black and bone, one muted gold, an editorial
// serif (Instrument Serif) with italic accents over Inter, hairlines instead of
// boxes, and a lot of air. The one action on the page is buying a ticket, so
// every button does that and nothing else competes with it.
// ─────────────────────────────────────────────────────────────────────────────

function useCheckout() {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  // Payment happens on our own branded /tickets page, never a Stripe page.
  function buy(tier: Tier, qty = 1) {
    setBusy(tier.id)
    setError('')
    window.location.assign(`${window.location.pathname.replace(/\/$/, '')}/tickets?tier=${tier.id}&qty=${qty}`)
  }
  return { busy, error, buy }
}

/** Reveal on scroll. One observer for the page; off under reduced motion. */
function useReveal(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-r]'))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      items.forEach(i => i.classList.add('vv-in'))
      return
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('vv-in'); io.unobserve(e.target) }
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    items.forEach(i => io.observe(i))
    return () => io.disconnect()
  }, [root])
}

/**
 * Scroll emotion. One rAF-throttled listener writes CSS variables, and CSS
 * does the rest: --vv-p (page progress, the gold bar), --vv-y (hero drift),
 * and per element [data-s] a --s from 0 (entering the bottom) to 1 (passing
 * the middle). Off under reduced motion: everything renders at its end state.
 */
function useScrollFx(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-s]'))
    if (reduce) { targets.forEach(t => t.style.setProperty('--s', '1')); return }
    let raf = 0
    const run = () => {
      raf = 0
      const h = document.documentElement.scrollHeight - innerHeight
      el.style.setProperty('--vv-p', String(h > 0 ? scrollY / h : 0))
      el.style.setProperty('--vv-y', String(Math.min(scrollY, innerHeight)))
      for (const t of targets) {
        const r = t.getBoundingClientRect()
        const s = (innerHeight - r.top) / (innerHeight * 0.75)
        t.style.setProperty('--s', String(Math.max(0, Math.min(1, s))))
      }
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(run) }
    run()
    addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [root])
}

// The statement, lit word by word as it scrolls into view. g = gold.
const STATEMENT: { t: string; g?: boolean }[] = [
  { t: 'You do not need more information. You need to' },
  { t: 'see where you are going', g: true },
  { t: 'so clearly that doubt goes quiet, and the voice to' },
  { t: 'make other people see it too.', g: true },
  { t: 'One day. Both.' },
]
const STATEMENT_WORDS = STATEMENT.flatMap(seg => seg.t.split(' ').map(w => ({ w, g: !!seg.g })))

/**
 * Time left until a real moment (an ISO timestamp with its Bali offset): the
 * doors opening, or the end of early bird. Renders nothing on the server pass
 * and until mounted, so it can never cause a hydration mismatch.
 */
function useCountdown(endISO: string) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    if (!endISO) return
    const end = new Date(endISO).getTime()
    const tick = () => setLeft(Math.max(0, end - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [endISO])
  if (left === null || left <= 0) return null
  const s = Math.floor(left / 1000)
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}

// Icon keys used in config.ts. A key missing here renders the sparkle-free fallback (Sun).
const ICONS: Record<string, LucideIcon> = { sun: Sun, eye: Eye, book: BookOpen, target: Target, mic: Mic, users: Users, utensils: Utensils, map: MapPin, coffee: Coffee, flame: Flame, crown: Crown, sparkles: Sparkles }
const Icon = ({ name, size = 22 }: { name: string; size?: number }) => {
  const C = ICONS[name] ?? Sun
  return <C size={size} strokeWidth={1.6} aria-hidden="true" />
}

// Real rooms Nevin has filled. Shown as proof, never captioned as this event.
const ROOMS = [
  { src: roomEurope, alt: 'A room after one of Nevin\'s live events in Europe' },
  { src: roomAruba, alt: 'An AI workshop with Nevin in Aruba' },
  { src: circlePhoto, alt: 'A community evening with Nevin' },
  { src: roomBarcelona, alt: 'A live event with Nevin in Barcelona' },
  { src: roomCuracao, alt: 'A workshop group with Nevin' },
]

const pad = (n: number) => String(n).padStart(2, '0')
const shortDate = (iso: string) => formatDate(iso)

const MARQUEE = ['Clarity', 'Certainty', 'Vision', 'Goals from within', 'Voice', 'Presence', 'Influence', 'Connection', 'Momentum']

const DOORS_ISO = EVENT.dateISO && EVENT.startTime ? `${EVENT.dateISO}T${EVENT.startTime}:00+08:00` : ''

/** Seats a tier can still sell, from the live count; null = not counted. */
function tierSeatsLeft(t: Tier, stock: Stock | null): number | null {
  if (!stock) return null
  return t.seats ? Math.min(stock.left, stock.tierLeft[t.id] ?? t.seats) : stock.left
}

export default function EventClient({ stock }: { stock: Stock | null }) {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  useScrollFx(root)
  const tierLeft = stock?.tierLeft
  const now = currentTier(new Date(), tierLeft)
  const early = TIERS.find(t => t.id === 'early')
  const cd = useCountdown(early?.endsOn && now.id === 'early' ? `${early.endsOn}T23:59:59+08:00` : '')
  const doors = useCountdown(DOORS_ISO)
  const nowLeft = tierSeatsLeft(now, stock)
  const soldOut = stock !== null && stock.left <= 0
  const [qty, setQty] = useState(1)
  const maxQty = Math.max(1, Math.min(MAX_PER_ORDER, nowLeft ?? MAX_PER_ORDER))
  const { busy, error, buy } = useCheckout()
  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  useEffect(() => {
    const on = () => {
      setScrolled(window.scrollY > 40)
      setPastHero(window.scrollY > window.innerHeight * 0.85)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const jump = () => document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="vv" ref={root}>
      <div className="vv-progress" aria-hidden="true" />
      {/* ── Floating nav ────────────────────────────────────────────────── */}
      <header className={`vv-nav${scrolled ? ' vv-nav-on' : ''}`}>
        <span className="vv-logo">{EVENT.name}<i>.</i></span>
        <nav className="vv-links" aria-label="Sections">
          <a href="#day">The day</a>
          <a href="#hosts">Hosts</a>
          <a href="#venue">Venue</a>
          <a href="#faq">FAQ</a>
        </nav>
        <button className="vv-pill vv-pill-sm" onClick={jump}>
          Tickets <span className="vv-pill-sub">from {money(now.price)}</span>
        </button>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────
          No photograph, on purpose: an invitation, not a snapshot. The light
          is a slow gold aura (CSS only), the texture is film grain. */}
      <section className="vv-hero">
        <div className="vv-hero-photo" aria-hidden="true">
          <Image src={amaviInterior} alt="" fill priority sizes="100vw" style={{ objectFit: 'cover' }} />
        </div>
        <div className="vv-aura" aria-hidden="true">
          <span className="vv-orb vv-orb1" />
          <span className="vv-orb vv-orb2" />
          <span className="vv-orb vv-orb3" />
        </div>
        <svg className="vv-grain" aria-hidden="true">
          <filter id="vv-noise"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves={2} stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#vv-noise)" />
        </svg>
        <div className="vv-frame" aria-hidden="true" />
        <div className="vv-wrap vv-hero-in">
          <p className="vv-eyebrow vv-load vv-d1">
            <span className="vv-tick" /> A one-day breakthrough &amp; networking event<span className="vv-eyebrow-x"> · {VENUE.partnerLine}</span> <span className="vv-tick" />
          </p>
          <h1 className="vv-h1 vv-load vv-d2">
            {/* "I Am" sits above as an italic lead-in; the last word carries the gold. */}
            {EVENT.name.includes(' ') && <span className="vv-h1-lead">{EVENT.name.slice(0, EVENT.name.lastIndexOf(' '))}</span>}
            <span className="vv-sheen">{EVENT.name.slice(EVENT.name.lastIndexOf(' ') + 1)}</span>
            <span className="vv-sub">{EVENT.subtitle}</span>
          </h1>
          <div className="vv-collab vv-load vv-d3">
            <p className="vv-collab-hosts"><span>Luke Anning</span><em>×</em><span>Nevin Henriquez</span></p>
            <p className="vv-collab-with">In collaboration with <b>{VENUE.name}</b></p>
          </div>
          <p className="vv-promise vv-load vv-d3">
            {EVENT.promise.map((w, i) => <span key={w}>{i > 0 && <em aria-hidden="true">✦</em>}{w}</span>)}
          </p>
          <p className="vv-lede vv-load vv-d3">{EVENT.tagline}</p>
          <div className="vv-hero-cta vv-load vv-d4">
            <button className="vv-pill vv-pill-light" onClick={jump}>
              Claim your seat <span className="vv-arrow" aria-hidden="true">→</span>
            </button>
            <a className="vv-ghost" href="#shift">See what changes</a>
          </div>
          {DOORS_ISO && (
            <div className="vv-timer vv-load vv-d4" role="timer" aria-label="Time until the doors open">
              <p className="vv-timer-label">Doors open in</p>
              <div className="vv-timer-row">
                {([['Days', doors ? String(doors.d) : '--'], ['Hours', doors ? pad(doors.h) : '--'], ['Min', doors ? pad(doors.m) : '--'], ['Sec', doors ? pad(doors.s) : '--']] as const).map(([k, v]) => (
                  <div key={k} className="vv-timer-cell"><b>{v}</b><span>{k}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="vv-seal vv-load vv-d5" aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <defs><path id="vv-seal-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
            <text><textPath href="#vv-seal-path">{`${EVENT.seats} seats only ✦ ${VENUE.name} ${VENUE.area.split(',')[0]} ✦ ${shortDate(EVENT.dateISO)} ✦ `}</textPath></text>
          </svg>
          <span>{EVENT.seats}</span>
        </div>
        <div className="vv-wrap vv-load vv-d5">
          <dl className="vv-facts">
            <div><dt>Date</dt><dd>{dateLabel()}</dd></div>
            <div><dt>Time</dt><dd>{EVENT.startTime}–{EVENT.endTime} <small>WITA</small></dd></div>
            <div><dt>Venue</dt><dd>{VENUE.name}, Canggu</dd></div>
            <div><dt>From</dt><dd>{money(now.price)} <small>{now.name.toLowerCase()}{nowLeft !== null && now.seats ? ` · ${nowLeft} left` : ''}</small></dd></div>
          </dl>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────────────────── */}
      <div className="vv-marquee" aria-hidden="true">
        <div className="vv-marquee-track">
          {[...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i}>{w}<em>✦</em></span>
          ))}
        </div>
      </div>

      {/* ── Statement ───────────────────────────────────────────────────── */}
      <section className="vv-sec">
        <div className="vv-wrap vv-statement">
          <p className="vv-label">The breakthrough</p>
          <p className="vv-big vv-lit" data-s aria-label={STATEMENT.map(x => x.t).join(' ')}>
            {STATEMENT_WORDS.map((x, i) => (
              <span key={i} aria-hidden="true" className={x.g ? 'vv-w vv-w-g' : 'vv-w'} style={{ '--i': i / STATEMENT_WORDS.length } as React.CSSProperties}>{x.w} </span>
            ))}
          </p>
        </div>
      </section>

      {/* ── The shift: who walks in, who walks out ───────────────────────── */}
      <section className="vv-shift" id="shift">
        <div className="vv-wrap">
          <div className="vv-head vv-center" data-r>
            <p className="vv-label vv-label-gold">The result</p>
            <h2 className="vv-h2">Walk in <i>hoping.</i> Walk out <span className="vv-sheen">unstoppable.</span></h2>
          </div>
          <div className="vv-shift-grid" role="table" aria-label="Before and after the day">
            <div className="vv-shift-row vv-shift-head" role="row">
              <span role="columnheader">Walk in with</span>
              <span aria-hidden="true" />
              <span role="columnheader">Walk out with</span>
            </div>
            {SHIFT.map((x, i) => (
              <div key={x.after} className="vv-shift-row" role="row" data-r style={{ transitionDelay: `${i * 90}ms` }}>
                <span role="cell" className="vv-shift-before">{x.before}</span>
                <span className="vv-shift-arrow" aria-hidden="true">→</span>
                <span role="cell" className="vv-shift-after">{x.after}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two halves ──────────────────────────────────────────────────── */}
      <section className="vv-halves" id="day">
        {([
          { photo: lukePhoto, n: '01', when: 'Morning · Luke', beat: 'See it.', icon: 'eye', h: <>The <i>inner</i> world</>, items: ['Guided visualisation', 'A vision you can feel', 'Goals from within'] },
          { photo: nevinPhoto, n: '02', when: 'Afternoon · Nevin', beat: 'Say it.', icon: 'mic', h: <>The <i>outer</i> voice</>, items: ['Voice and presence', 'A story that lands', 'Speak, with feedback'] },
        ]).map(h => (
          <article key={h.n} className="vv-half" data-r>
            <div className="vv-half-photo">
              <Image src={h.photo} alt="" fill sizes="(max-width: 960px) 100vw, 580px" style={{ objectFit: 'cover', objectPosition: '50% 25%' }} placeholder="blur" />
              <span className="vv-half-icon"><Icon name={h.icon} size={26} /></span>
              <span className="vv-half-n">{h.n}</span>
            </div>
            <div className="vv-half-body">
              <span className="vv-label vv-label-gold">{h.when}</span>
              <p className="vv-half-beat">{h.beat}</p>
              <h2 className="vv-h2">{h.h}</h2>
              <ul>{h.items.map(x => <li key={x}>{x}</li>)}</ul>
            </div>
          </article>
        ))}
      </section>
      <div className="vv-wrap">
        <div className="vv-circles" data-r>
          <span className="vv-circles-icon"><Icon name="users" size={30} /></span>
          <div>
            <span className="vv-label vv-label-gold">All day · Networking circles</span>
            <p>Small guided groups between every session and over food. You leave knowing the room.</p>
          </div>
        </div>
      </div>

      {/* ── Outcomes ────────────────────────────────────────────────────── */}
      <section className="vv-sec">
        <div className="vv-wrap">
          <div className="vv-head" data-r>
            <p className="vv-label">What you take home</p>
            <h2 className="vv-h2">Four results. <i>One day.</i></h2>
          </div>
          <div className="vv-outcomes">
            {OUTCOMES.map((o, i) => (
              <article key={o.n} data-r style={{ transitionDelay: `${i * 80}ms` }}>
                <span className="vv-ico"><Icon name={o.icon} size={26} /></span>
                <h3>{o.title}</h3>
                <p>{o.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Running order ───────────────────────────────────────────────── */}
      <section className="vv-sec vv-bone">
        <div className="vv-wrap vv-split">
          <div className="vv-sticky" data-r>
            <p className="vv-label">How the day flows</p>
            <h2 className="vv-h2">See it. Say it. <i>Become it.</i></h2>
            <p className="vv-body">{dateLabel()}, {EVENT.startTime} to {EVENT.endTime} {EVENT.timeZoneLabel}. The full schedule is sent with your ticket.</p>
          </div>
          <ol className="vv-flow">
            <li className="vv-flow-time" data-r><span>{EVENT.startTime}</span>Doors open</li>
            {FLOW.map(f => (
              <li key={f.title} data-r className={`vv-flow-${f.label.toLowerCase()}`}>
                <span className="vv-flow-node"><Icon name={f.icon} size={18} /></span>
                <span className="vv-flow-tag">{f.label}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
            <li className="vv-flow-time" data-r><span>{EVENT.endTime}</span>Close</li>
          </ol>
        </div>
      </section>

      {/* ── Hosts ───────────────────────────────────────────────────────── */}
      <section className="vv-sec vv-dark" id="hosts">
        <div className="vv-wrap">
          <div className="vv-head" data-r>
            <p className="vv-label vv-label-gold">Your hosts</p>
            <h2 className="vv-h2">Two guides. <i>One for each half of you.</i></h2>
          </div>
          <div className="vv-hosts">
            {SPEAKERS.map((s, i) => (
              <article key={s.name} className="vv-host" data-r style={{ transitionDelay: `${i * 120}ms` }}>
                <div className="vv-host-photo">
                  {s.photo
                    ? <Image src={s.photo === 'luke' ? lukePhoto : nevinPhoto} alt={s.name} fill sizes="(max-width: 860px) 100vw, 540px" style={{ objectFit: 'cover', objectPosition: '50% 30%' }} placeholder="blur" />
                    : <span className="vv-mono" aria-hidden="true">{s.initials}</span>}
                  <span className="vv-host-half">{s.half}</span>
                </div>
                <h3>{s.name}</h3>
                <p className="vv-role">{s.role}</p>
                <p className="vv-host-bio">{s.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Venue ───────────────────────────────────────────────────────── */}
      <section className="vv-venue" id="venue">
        <div className="vv-wrap vv-venue-grid">
        <div className="vv-venue-in" data-r>
          <p className="vv-label vv-label-gold">{VENUE.partnerLine}</p>
          <div className="vv-venue-logo">
            <Image src={amaviLogo} alt={`${VENUE.name} logo`} sizes="320px" style={{ width: '100%', height: 'auto' }} />
          </div>
          <h2 className="vv-venue-name">Kitchen · Lounge · Pool</h2>
          <p className="vv-venue-area">{VENUE.area}</p>
          <p className="vv-body vv-on-dark vv-narrow">{VENUE.description}</p>
          <dl className="vv-venue-facts">
            <div><dt>Partner</dt><dd>{VENUE.name}</dd></div>
            <div><dt>Address</dt><dd>{VENUE.mapsUrl ? <a className="vv-link" href={VENUE.mapsUrl} target="_blank" rel="noopener noreferrer">{VENUE.address || 'Open in Google Maps'}</a> : (VENUE.address || 'Sent with your ticket')}</dd></div>
            <div><dt>Room</dt><dd>{EVENT.seats} guests</dd></div>
            <div><dt>Food</dt><dd>Included</dd></div>
          </dl>
          {VENUE.mapsUrl && <a href={VENUE.mapsUrl} target="_blank" rel="noopener noreferrer" className="vv-ghost vv-ghost-light">Open in Google Maps →</a>}
        </div>
        <div className="vv-venue-photos" data-s>
          <div className="vv-venue-main">
            <Image src={amaviInterior} alt="Inside Amavi, Canggu: the arched hall" fill sizes="(max-width: 960px) 100vw, 560px" style={{ objectFit: 'cover' }} placeholder="blur" />
          </div>
          <div className="vv-venue-small">
            <Image src={amaviPool} alt="The lounge at Amavi, opening onto the pool" fill sizes="(max-width: 960px) 50vw, 260px" style={{ objectFit: 'cover' }} placeholder="blur" />
          </div>
        </div>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────────────────────────────── */}
      <section className="vv-sec vv-mission">
        <div className="vv-wrap vv-narrow-wrap" data-r>
          <p className="vv-label">Why we are doing this</p>
          <blockquote>{MISSION.quote}</blockquote>
          <p className="vv-by">{MISSION.by}</p>
        </div>
      </section>

      {/* ── Proof ───────────────────────────────────────────────────────── */}
      <section className="vv-sec vv-proof">
        <div className="vv-wrap">
          <div className="vv-head vv-center" data-r>
            <p className="vv-label vv-label-gold">Rooms we have filled</p>
            <h2 className="vv-h2">550+ live rooms. <i>Here are a few.</i></h2>
          </div>
          <div className="vv-mosaic" data-s>
            {ROOMS.map((ph, i) => (
              <div key={i} className={`vv-tile vv-tile-${i}`}>
                <Image src={ph.src} alt={ph.alt} fill sizes="(max-width: 960px) 50vw, 400px" style={{ objectFit: 'cover' }} placeholder="blur" />
              </div>
            ))}
          </div>
          <div className="vv-stats">
            {TRUST.map((t, i) => (
              <div key={t.v} data-r style={{ transitionDelay: `${i * 80}ms` }}>
                <b>{t.k}</b><span>{t.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For you ─────────────────────────────────────────────────────── */}
      <section className="vv-sec">
        <div className="vv-wrap vv-split">
          <div data-r>
            <p className="vv-label">Is this for you?</p>
            <h2 className="vv-h2">This day is for you <i>if you are done playing small.</i></h2>
          </div>
          <ul className="vv-for">
            {FOR_YOU.map((t, i) => <li key={t} data-r style={{ transitionDelay: `${i * 70}ms` }}><span>{pad(i + 1)}</span>{t}</li>)}
          </ul>
        </div>
      </section>

      {/* ── Included ────────────────────────────────────────────────────── */}
      <section className="vv-sec vv-bone">
        <div className="vv-wrap">
          <div className="vv-head" data-r>
            <p className="vv-label">What is included</p>
            <h2 className="vv-h2">Everything in <i>your ticket.</i></h2>
          </div>
          <div className="vv-incl">
            {INCLUDED_DETAIL.map((i, n) => (
              <article key={i.title} data-r style={{ transitionDelay: `${(n % 4) * 70}ms` }}>
                <span className="vv-ico"><Icon name={i.icon} size={24} /></span>
                <h3>{i.title}</h3>
                <p>{i.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tickets ─────────────────────────────────────────────────────── */}
      <section className="vv-sec vv-dark" id="tickets">
        <div className="vv-wrap">
          <div className="vv-head vv-center" data-r>
            <p className="vv-label vv-label-gold">Tickets</p>
            <h2 className="vv-h2">{EVENT.seats} seats. <i>Decide now.</i></h2>
            <p className="vv-body vv-on-dark">The people who change their lives decide before they feel ready. Only {early?.seats ?? 'the first'} seats go at early bird, until {early?.endsOn ? shortDate(early.endsOn) : 'it closes'} or until they are gone. Then it does not come back.</p>
            {stock && (
              <div className="vv-meter" aria-label={`${stock.left} of ${EVENT.seats} seats left`}>
                <div className="vv-meter-top">
                  <span>{soldOut ? 'Sold out' : `${stock.left} of ${EVENT.seats} seats left`}</span>
                  {early?.seats && <span>{stock.tierLeft.early ?? early.seats} of {early.seats} early bird left</span>}
                </div>
                <div className="vv-meter-bar"><i style={{ width: `${Math.round(((EVENT.seats - stock.left) / EVENT.seats) * 100)}%` }} /></div>
              </div>
            )}
            {cd && (
              <div className="vv-count" aria-label="Time left at the early bird price">
                <span className="vv-count-label">Early bird ends in</span>
                <span className="vv-count-num"><b>{cd.d}</b>d</span>
                <span className="vv-count-num"><b>{pad(cd.h)}</b>h</span>
                <span className="vv-count-num"><b>{pad(cd.m)}</b>m</span>
                <span className="vv-count-num"><b>{pad(cd.s)}</b>s</span>
              </div>
            )}
          </div>
          <div className="vv-tiers">
            {TIERS.map(t => {
              const open = tierOpen(t, new Date(), tierLeft)
              const left = tierSeatsLeft(t, stock)
              const live = t.id === now.id
              return (
                <article key={t.id} className={`vv-tier${live ? ' vv-tier-live' : ''}${!open ? ' vv-tier-closed' : ''}`} data-r>
                  <div className="vv-tier-top">
                    <h3>{t.name}</h3>
                    {live && <span className="vv-badge">On sale now</span>}
                    {!open && <span className="vv-badge vv-badge-off">Closed</span>}
                  </div>
                  <p className="vv-price">{money(t.price)}<small>USD</small></p>
                  <p className="vv-tier-note">
                    {t.seats ? `First ${t.seats} seats${t.endsOn ? `, until ${shortDate(t.endsOn)}` : ''}${left !== null && open ? ` · ${left} left` : ''}` : t.endsOn ? `Until ${shortDate(t.endsOn)}` : t.id === 'late' && early?.endsOn ? `From ${shortDate(new Date(new Date(`${early.endsOn}T12:00:00Z`).getTime() + 864e5).toISOString().slice(0, 10))}` : t.blurb}
                  </p>
                  <ul>{INCLUDED.map(i => <li key={i}>{i}</li>)}</ul>
                  {!open ? (
                    <span className="vv-tier-off">{t.seats && left === 0 ? 'Sold out' : 'Closed'}</span>
                  ) : soldOut ? (
                    <span className="vv-tier-off">Sold out</span>
                  ) : live ? (
                    <>
                      <div className="vv-qty">
                        <span>Tickets</span>
                        <div className="vv-qty-ctl">
                          <button type="button" aria-label="One ticket fewer" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
                          <output aria-live="polite">{Math.min(qty, maxQty)}</output>
                          <button type="button" aria-label="One ticket more" onClick={() => setQty(q => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}>+</button>
                        </div>
                        <b>{money(t.price * Math.min(qty, maxQty))}</b>
                      </div>
                      <button className="vv-pill vv-pill-gold vv-pill-full" onClick={() => buy(t, Math.min(qty, maxQty))} disabled={busy !== null}>
                        {busy === t.id ? 'Opening your booking…' : <>{Math.min(qty, maxQty) > 1 ? `Claim ${Math.min(qty, maxQty)} seats` : 'Claim my seat'} <span className="vv-arrow" aria-hidden="true">→</span></>}
                      </button>
                    </>
                  ) : (
                    <span className="vv-tier-off">Opens when early bird closes</span>
                  )}
                </article>
              )
            })}
          </div>
          {error && <p className="vv-error" role="alert">{error}</p>}
          <p className="vv-pay">Secure checkout by Stripe · Card, Apple Pay and Google Pay · Receipt by email</p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="vv-sec" id="faq">
        <div className="vv-wrap vv-split">
          <div data-r>
            <p className="vv-label">Questions</p>
            <h2 className="vv-h2">Before you <i>book.</i></h2>
            <p className="vv-body">Anything else? Write to <a className="vv-link" href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a></p>
          </div>
          <div className="vv-faq">
            {FAQ.map(f => (
              <details key={f.q} data-r>
                <summary>{f.q}<span aria-hidden="true" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Close ───────────────────────────────────────────────────────── */}
      <section className="vv-final">
        <div className="vv-wrap" data-r>
          <p className="vv-label vv-label-gold">{dateLabel()} · {VENUE.partnerLine}</p>
          <h2 className="vv-final-h">One day. <i>The rest of your life</i> <span className="vv-sheen">unstoppable.</span></h2>
          <button className="vv-pill vv-pill-light" onClick={jump}>
            Claim your seat · {money(now.price)} <span className="vv-arrow" aria-hidden="true">→</span>
          </button>
          <p className="vv-final-note">{stock ? `${stock.left} of ${EVENT.seats} seats left` : `${EVENT.seats} seats`} · {now.name} price{now.endsOn ? ` until ${shortDate(now.endsOn)}` : ''}</p>
        </div>
      </section>

      <footer className="vv-foot">
        <span className="vv-logo">{EVENT.name}<i>.</i></span>
        <span>{EVENT.subtitle} · Luke Anning &amp; Nevin Henriquez · {VENUE.partnerLine}</span>
        <a href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a>
      </footer>

      {/* Phone: the one action stays a thumb away once the hero has scrolled past. */}
      <div className={`vv-sticky-buy${pastHero ? ' vv-sticky-on' : ''}`}>
        <div>
          <b>{money(now.price)}</b>
          <span>{now.name}{nowLeft !== null && now.seats ? ` · ${nowLeft} left` : ` · ${shortDate(EVENT.dateISO)}`}</span>
        </div>
        <button className="vv-pill vv-pill-gold vv-pill-sm" onClick={jump}>Claim seat</button>
      </div>

      <style>{CSS}</style>
    </div>
  )
}

const CSS = `
.vv{--ink:#050505;--ink2:#0D0C0A;--ink3:#16140F;--bone:#F7F3EA;--paper:#080808;--sand:#14120E;--gold:#E3AE45;--gold2:#F7D27A;--text:#F7F3EA;--body:#B5AD9F;--muted:#8E8576;--line:rgba(227,174,69,.18);--dline:rgba(227,174,69,.18);--dbody:#B5AD9F;
  --serif:var(--vv-display),'Anton',Impact,sans-serif;--sans:var(--vv-body),'Inter',system-ui,sans-serif;
  background:var(--paper);color:var(--text);font-family:var(--sans);font-weight:400;font-size:16px;line-height:1.65;overflow-x:clip;-webkit-font-smoothing:antialiased}
.vv *{box-sizing:border-box}
.vv [id]{scroll-margin-top:84px}
.vv h1,.vv h2,.vv h3{font-family:var(--serif);font-weight:400;margin:0;letter-spacing:.005em;text-transform:uppercase;line-height:.95}
.vv i,.vv em{font-style:normal}
.vv-wrap{max-width:1200px;margin:0 auto;padding:0 24px}
.vv-narrow-wrap{max-width:900px}
.vv-label{font-family:var(--sans);font-size:12px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);margin:0 0 22px}
.vv-label,.vv-label-gold{color:var(--gold)}
.vv-h2{font-size:clamp(40px,5.6vw,76px);line-height:.95}
.vv-h2 i{color:var(--gold)}
.vv-body{color:var(--body);font-size:17px;font-weight:300;margin:22px 0 0;max-width:560px}
.vv-on-dark{color:var(--dbody)}
.vv-narrow{max-width:640px}
.vv-num{font-family:var(--serif);font-size:26px;color:var(--gold)}
.vv-link{color:inherit;text-decoration:underline;text-decoration-color:var(--gold);text-underline-offset:4px}

/* reveal */
.vv [data-r]{opacity:0;transform:translateY(22px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
.vv [data-r].vv-in{opacity:1;transform:none}
.vv-load{opacity:0;transform:translateY(18px);animation:vvUp 1.1s cubic-bezier(.2,.7,.2,1) forwards}
.vv-d1{animation-delay:.1s}.vv-d2{animation-delay:.22s}.vv-d3{animation-delay:.4s}.vv-d4{animation-delay:.55s}.vv-d5{animation-delay:.75s}
@keyframes vvUp{to{opacity:1;transform:none}}

/* buttons */
.vv-pill{display:inline-flex;align-items:center;justify-content:center;gap:12px;border:0;cursor:pointer;font:800 14px/1 var(--sans);letter-spacing:.12em;text-transform:uppercase;padding:0 30px;min-height:58px;border-radius:4px;transition:transform .25s ease,background .25s ease,box-shadow .25s ease;white-space:nowrap}
.vv-pill:hover{transform:translateY(-2px)}
.vv-pill:disabled{opacity:.7;cursor:wait;transform:none}
.vv-pill-light{background:linear-gradient(180deg,var(--gold2),var(--gold));color:#000;box-shadow:0 20px 60px -18px rgba(227,174,69,.7)}
.vv-pill-gold{background:linear-gradient(180deg,var(--gold2),var(--gold));color:#000;box-shadow:0 20px 50px -22px rgba(227,174,69,.8)}
.vv-pill-gold:hover{background:var(--gold2)}
.vv-pill-sm{min-height:44px;padding:0 18px;font-size:12px}
.vv-pill-full{width:100%}
.vv-pill-sub{opacity:.6;font-weight:400}
.vv-arrow{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:3px;background:#000;color:var(--gold2);font-size:14px;margin-right:-14px;transition:transform .25s ease}
.vv-pill:hover .vv-arrow{transform:translateX(3px)}
.vv-ghost{color:var(--bone);font-size:15px;font-weight:400;text-decoration:none;border-bottom:1px solid rgba(244,239,231,.4);padding-bottom:3px;transition:border-color .2s}
.vv-ghost:hover{border-color:var(--bone)}
.vv-ghost-light{display:inline-block;margin-top:30px}

/* nav */
.vv-nav{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:30;width:min(1160px,calc(100% - 28px));display:flex;align-items:center;justify-content:space-between;gap:16px;padding:8px 8px 8px 22px;border-radius:6px;color:var(--bone);border:1px solid transparent;transition:background .35s ease,border-color .35s ease,backdrop-filter .35s ease}
.vv-nav-on{background:rgba(16,14,12,.86);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-color:var(--dline)}
.vv-logo{font-family:var(--serif);font-size:22px;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap}
.vv-logo i{color:var(--gold)}
.vv-links{display:flex;gap:28px}
.vv-links a{color:rgba(244,239,231,.75);text-decoration:none;font-size:14px;transition:color .2s}
.vv-links a:hover{color:var(--bone)}
.vv-nav .vv-pill-sm{background:linear-gradient(180deg,var(--gold2),var(--gold));color:#000}

/* hero */
.vv-hero{position:relative;min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;color:var(--bone);background:#000;overflow:hidden;padding-bottom:28px;text-align:center}
.vv-aura{position:absolute;inset:0;overflow:hidden}
.vv-orb{position:absolute;border-radius:50%;filter:blur(90px);will-change:transform}
.vv-orb1{width:62vmax;height:62vmax;left:50%;top:38%;margin:-31vmax 0 0 -31vmax;background:radial-gradient(circle,rgba(227,174,69,.5),rgba(227,174,69,0) 62%);animation:vvBreathe 14s ease-in-out infinite alternate}
.vv-orb2{width:44vmax;height:44vmax;left:-10vmax;top:-12vmax;background:radial-gradient(circle,rgba(160,90,20,.45),transparent 65%);animation:vvDrift 22s ease-in-out infinite alternate}
.vv-orb3{width:40vmax;height:40vmax;right:-12vmax;bottom:-14vmax;background:radial-gradient(circle,rgba(200,120,30,.3),transparent 65%);animation:vvDrift 26s ease-in-out infinite alternate-reverse}
@keyframes vvBreathe{0%{transform:scale(.88);opacity:.75}100%{transform:scale(1.08);opacity:1}}
@keyframes vvDrift{0%{transform:translate(0,0)}100%{transform:translate(6vmax,4vmax)}}
.vv-frame{position:absolute;inset:18px;border:1px solid rgba(227,174,69,.22);border-radius:4px;pointer-events:none}
.vv-grain{position:absolute;inset:0;width:100%;height:100%;opacity:.09;pointer-events:none;mix-blend-mode:overlay}
.vv-hero-in{position:relative;padding-top:150px;display:flex;flex-direction:column;align-items:center}
.vv-hero>.vv-wrap{width:100%}
.vv-eyebrow{display:inline-flex;align-items:center;gap:16px;font-size:11.5px;font-weight:500;letter-spacing:.32em;text-transform:uppercase;color:var(--gold2);margin:0 0 34px}
.vv-tick{width:34px;height:1px;background:linear-gradient(90deg,transparent,var(--gold))}
.vv-tick:last-child{transform:scaleX(-1)}
.vv-dot{width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 4px rgba(227,174,69,.2)}
.vv-h1{font-size:clamp(64px,15.5vw,250px);line-height:.88;letter-spacing:.005em;display:flex;flex-direction:column;align-items:center}
.vv-h1-lead{font-size:.3em;letter-spacing:.18em;color:var(--bone);margin-bottom:.12em}
.vv-sub{font-family:var(--sans);font-size:12px;font-weight:500;letter-spacing:.5em;text-transform:uppercase;color:rgba(244,239,231,.6);margin-top:26px;padding-left:.5em}
/* the one gold-on-gold sheen on the page: a slow light passing over metal */
.vv-sheen{background:linear-gradient(100deg,#F7D27A 0%,#E3AE45 22%,#FFF3C9 42%,#C98A1E 58%,#F2C463 78%,#B07818 100%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:vvSheen 9s ease-in-out infinite alternate;font-style:normal}
@keyframes vvSheen{0%{background-position:100% 0}100%{background-position:0 0}}
.vv-h1 .vv-sheen{filter:drop-shadow(0 10px 50px rgba(227,174,69,.45))}
.vv-promise{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 18px;margin:30px 0 0;font-family:var(--serif);text-transform:uppercase;letter-spacing:.04em;font-size:clamp(24px,3vw,38px);line-height:1.1;color:var(--bone)}
.vv-promise span{display:inline-flex;align-items:center;gap:18px}
.vv-promise em{font-style:normal;font-size:.36em;color:var(--gold)}
.vv-promise span:last-child{color:var(--gold)}
.vv-lede{font-family:var(--sans);font-weight:400;font-size:clamp(17px,1.6vw,20px);line-height:1.4;max-width:600px;color:rgba(244,239,231,.78);margin:22px auto 42px}
.vv-hero-cta{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:18px 30px}
.vv-seal{position:absolute;right:56px;top:120px;width:150px;height:150px;display:flex;align-items:center;justify-content:center}
.vv-seal svg{position:absolute;inset:0;width:100%;height:100%;animation:vvSpin 40s linear infinite;overflow:visible}
.vv-seal text{fill:rgba(244,239,231,.7);font-family:var(--sans);font-size:11px;letter-spacing:3.2px;text-transform:uppercase}
.vv-seal>span{font-family:var(--serif);font-size:48px;color:var(--gold)}
@keyframes vvSpin{to{transform:rotate(360deg)}}
.vv-facts{position:relative;margin:64px 0 0;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--dline)}
.vv-facts{text-align:left}
.vv-facts div{padding:20px 20px 4px 0}
.vv-facts div+div{padding-left:20px;border-left:1px solid var(--dline)}
.vv-facts dt{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(244,239,231,.5);margin-bottom:6px}
.vv-facts dd{margin:0;font-family:var(--sans);font-weight:700;font-size:18px;line-height:1.3}
.vv-facts small{font-family:var(--sans);font-size:12px;opacity:.6}

/* scroll emotion */
.vv-progress{position:fixed;left:0;top:0;height:3px;width:100%;z-index:60;transform-origin:0 50%;transform:scaleX(var(--vv-p,0));background:linear-gradient(90deg,var(--gold),var(--gold2));box-shadow:0 0 14px rgba(227,174,69,.8);pointer-events:none}
.vv-aura{transform:translateY(calc(var(--vv-y,0) * .35px)) scale(calc(1 + var(--vv-y,0) * .0003))}
.vv-hero-in{transform:translateY(calc(var(--vv-y,0) * -.12px));opacity:calc(1 - var(--vv-y,0) / 1400)}
.vv-lit .vv-w{opacity:clamp(.14,calc((var(--s,1) * 1.25 - var(--i)) * 8),1);transition:opacity .2s linear}
.vv-lit .vv-w-g{color:var(--gold)}
/* no transform or opacity on the logo: either one isolates it and the black of the file stops blending away */
.vv-venue-logo{width:min(320px,70vw);margin:4px 0 26px}
.vv-venue-logo img{mix-blend-mode:lighten;display:block}
.vv-venue-main{transform:translateY(calc((1 - var(--s,1)) * 60px))}
.vv-venue-small{transform:translateY(calc((1 - var(--s,1)) * 140px))}
.vv-collab{margin:26px 0 0;display:flex;flex-direction:column;align-items:center;gap:12px;text-transform:uppercase}
.vv-collab p{margin:0}
.vv-collab-hosts{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px 14px;font-size:13px;font-weight:700;letter-spacing:.22em;color:var(--bone)}
.vv-collab em{font-style:normal;color:var(--gold);font-size:16px;letter-spacing:0}
.vv-collab-with{display:inline-flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border:1px solid rgba(227,174,69,.5);border-radius:4px;background:rgba(0,0,0,.45);font-size:11px;font-weight:600;letter-spacing:.2em;color:var(--muted)}
.vv-collab-with b{padding:5px 10px;border-radius:3px;background:linear-gradient(180deg,var(--gold2),var(--gold));color:#000;font-weight:800;letter-spacing:.22em}

/* hero timer */
.vv-timer{margin-top:44px}
.vv-timer-label{margin:0 0 12px;font-size:11.5px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--gold)}
.vv-timer-row{display:flex;gap:10px;justify-content:center}
.vv-timer-cell{min-width:86px;padding:14px 10px 10px;border:1px solid rgba(227,174,69,.4);background:rgba(0,0,0,.55);border-radius:4px;display:flex;flex-direction:column;align-items:center}
.vv-timer-cell b{font-family:var(--serif);font-weight:400;font-size:48px;line-height:1;color:var(--gold2);font-variant-numeric:tabular-nums}
.vv-timer-cell span{margin-top:6px;font-size:10.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}

/* seats meter, quantity */
.vv-meter{max-width:620px;margin:34px auto 0;text-align:left}
.vv-meter-top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:12.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold2);margin-bottom:10px}
.vv-meter-top span:last-child{color:var(--muted)}
.vv-meter-bar{height:8px;border-radius:2px;background:rgba(227,174,69,.15);overflow:hidden}
.vv-meter-bar i{display:block;height:100%;min-width:4px;background:linear-gradient(90deg,var(--gold),var(--gold2));box-shadow:0 0 18px rgba(227,174,69,.7)}
.vv-qty{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:12px 14px;border:1px solid var(--dline);border-radius:4px}
.vv-qty>span{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.vv-qty-ctl{display:flex;align-items:center;gap:6px}
.vv-qty-ctl button{width:44px;height:44px;border-radius:4px;border:1px solid var(--dline);background:#000;color:var(--gold2);font-size:22px;cursor:pointer}
.vv-qty-ctl button:disabled{opacity:.35;cursor:default}
.vv-qty output{min-width:34px;text-align:center;font-family:var(--serif);font-size:28px}
.vv-qty>b{font-family:var(--serif);font-weight:400;font-size:28px;color:var(--gold2)}

/* marquee */
.vv-marquee{background:var(--gold);color:#000!important;color:var(--bone);border-top:1px solid var(--dline);overflow:hidden;padding:22px 0}
.vv-marquee-track{display:flex;width:max-content;animation:vvMarq 38s linear infinite}
.vv-marquee span{font-family:var(--serif);font-size:32px;text-transform:uppercase;letter-spacing:.04em;padding:0 22px;white-space:nowrap;display:inline-flex;align-items:center;gap:44px}
.vv-marquee em{font-style:normal;color:#000;font-size:14px}
@keyframes vvMarq{to{transform:translateX(-50%)}}

/* sections */
.vv-sec{padding:130px 0}
.vv-bone{background:var(--ink2)}
.vv-dark{background:var(--ink);color:var(--bone)}
.vv-dark .vv-label:not(.vv-label-gold){color:rgba(244,239,231,.5)}
.vv-head{margin-bottom:64px;max-width:760px}
.vv-center{text-align:center;margin-left:auto;margin-right:auto}
.vv-center .vv-body{margin-left:auto;margin-right:auto}
.vv-statement{max-width:1040px}
.vv-big{font-family:var(--serif);text-transform:uppercase;font-size:clamp(34px,4.6vw,64px);line-height:1.02;letter-spacing:.005em;margin:0}
.vv-big i{color:var(--gold)}
.vv-statement .vv-body{margin-top:40px}
.vv-split{display:grid;grid-template-columns:5fr 7fr;gap:80px;align-items:start}
.vv-sticky{position:sticky;top:120px}

/* shift */
.vv-shift{background:var(--ink);color:var(--bone);padding:140px 0;background-image:radial-gradient(ellipse at 50% 0%,rgba(227,174,69,.18),transparent 60%)}
.vv-shift .vv-h2{font-size:clamp(40px,6vw,84px)}
.vv-shift-grid{max-width:1000px;margin:0 auto;border-top:1px solid var(--dline)}
.vv-shift-row{display:grid;grid-template-columns:1fr 64px 1fr;align-items:center;gap:20px;padding:28px 0;border-bottom:1px solid var(--dline)}
.vv-shift-head{padding:18px 0}
.vv-shift-head span{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(244,239,231,.45)}
.vv-shift-head span:last-child{color:var(--gold)}
.vv-shift-before{font-size:17px;font-weight:300;color:rgba(244,239,231,.5);text-decoration:line-through;text-decoration-color:rgba(227,174,69,.45);text-decoration-thickness:1px}
.vv-shift-arrow{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:4px;border:1px solid rgba(227,174,69,.4);color:var(--gold);font-size:16px}
.vv-shift-after{font-family:var(--sans);font-weight:700;font-size:clamp(19px,2vw,24px);line-height:1.2;color:var(--bone)}

/* halves */

/* outcomes */

/* flow */

/* hosts */
.vv-hosts{display:grid;grid-template-columns:1fr 1fr;gap:36px}
.vv-host-photo{position:relative;aspect-ratio:4/5;border-radius:6px;border:1px solid var(--line);overflow:hidden;background:radial-gradient(ellipse at 30% 20%,rgba(227,174,69,.35),transparent 60%),linear-gradient(160deg,#2C2620,#14110E)}
.vv-mono{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:200px;color:rgba(226,197,151,.8)}
.vv-host-half{position:absolute;left:18px;bottom:18px;padding:9px 14px;border-radius:3px;background:rgba(0,0,0,.7);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--bone);border:1px solid var(--dline)}
.vv-host h3{font-size:42px;margin:28px 0 4px}
.vv-role{color:var(--gold);font-size:13px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 16px}
.vv-host-bio{color:var(--dbody);font-weight:300;margin:0;max-width:520px}

/* mission */
.vv-mission{text-align:center;background:var(--ink2)}
.vv-mission blockquote{margin:0;font-family:var(--sans);font-weight:700;font-size:clamp(22px,2.6vw,34px);line-height:1.35;letter-spacing:-.01em}
.vv-mission blockquote:before{content:'“';display:block;font-size:100px;line-height:.6;color:var(--gold);margin-bottom:12px}
.vv-by{margin:34px 0 0;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted)}

/* editorial grade, so every photo sits in one palette */
.vv-host-photo img,.vv-proof-photo img,.vv-venue-photos img{filter:contrast(1.08) saturate(1.05)}

/* proof */

/* for you */
.vv-for{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.vv-for li{display:flex;gap:26px;align-items:baseline;padding:26px 0;border-bottom:1px solid var(--line);font-family:var(--sans);font-weight:700;font-size:clamp(22px,2.2vw,28px);line-height:1.25}
.vv-for span{font-family:var(--sans);font-size:12px;letter-spacing:.14em;color:var(--gold);flex-shrink:0}

/* venue */
.vv-venue{position:relative;background:var(--ink2);color:var(--bone);padding:150px 0;overflow:hidden;background-image:radial-gradient(ellipse at 15% 100%,rgba(227,174,69,.2),transparent 55%),radial-gradient(ellipse at 100% 0%,rgba(110,86,58,.35),transparent 50%)}
.vv-venue-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.vv-venue-name{font-family:var(--serif);text-transform:uppercase;font-size:clamp(34px,4.2vw,58px);line-height:1;letter-spacing:.01em;color:var(--bone)}
.vv-venue-photos{position:relative;padding-bottom:70px}
.vv-venue-main{position:relative;aspect-ratio:4/5;border-radius:6px;overflow:hidden;border:1px solid var(--line);box-shadow:0 40px 100px -40px rgba(0,0,0,.9)}
.vv-venue-small{position:absolute;left:-44px;bottom:0;width:46%;aspect-ratio:4/5;border-radius:6px;overflow:hidden;border:2px solid var(--gold);box-shadow:0 30px 80px -20px rgba(0,0,0,.9)}
.vv-venue-area{font-family:var(--serif);text-transform:uppercase;letter-spacing:.06em;font-size:clamp(26px,3vw,40px);color:var(--gold2);margin:8px 0 0}
.vv-venue-facts{display:grid;grid-template-columns:repeat(2,auto);justify-content:start;gap:0;margin:48px 0 0;border-top:1px solid var(--dline)}
.vv-venue-facts div{padding:20px 40px 0 0}
.vv-venue-facts div:nth-child(even){padding-left:40px;border-left:1px solid var(--dline)}
.vv-venue-facts dt{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(244,239,231,.5);margin-bottom:6px}
.vv-venue-facts dd{margin:0;font-family:var(--sans);font-weight:700;font-size:18px}

/* included */

/* tickets */
.vv-count{display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 18px;margin-top:34px;padding:14px 26px;border-radius:4px;border:1px solid rgba(227,174,69,.45);background:rgba(227,174,69,.08)}
.vv-count-label{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
.vv-count-num{font-size:13px;color:var(--dbody)}
.vv-count-num b{font-family:var(--serif);font-weight:400;font-size:26px;color:var(--bone);margin-right:2px;font-variant-numeric:tabular-nums}
.vv-tiers{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:940px;margin:0 auto}
.vv-tier{position:relative;border-radius:6px;padding:40px 36px 36px;background:var(--ink3);border:1px solid var(--dline);display:flex;flex-direction:column}
.vv-tier-live{background:linear-gradient(160deg,#1E1709,#0B0905);border:2px solid var(--gold);box-shadow:0 40px 100px -40px rgba(227,174,69,.6)}
.vv-tier-closed{opacity:.5}
.vv-tier-top{display:flex;justify-content:space-between;align-items:center;gap:12px}
.vv-tier h3{font-size:32px}
.vv-badge{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;padding:7px 12px;border-radius:3px;background:var(--gold);color:#000;font-weight:800}
.vv-badge-off{background:transparent;border:1px solid var(--dline);color:var(--dbody)}
.vv-price{font-family:var(--serif);font-size:104px;line-height:1;margin:26px 0 6px;letter-spacing:0;color:var(--gold2)}
.vv-price small{font-family:var(--sans);font-size:13px;letter-spacing:.14em;color:var(--dbody);margin-left:10px}
.vv-tier-note{margin:0 0 28px;color:var(--gold2);font-size:14px}
.vv-tier ul{list-style:none;padding:0;margin:0 0 34px;flex:1;border-top:1px solid var(--dline)}
.vv-tier li{padding:13px 0;border-bottom:1px solid var(--dline);color:var(--dbody);font-size:15px;font-weight:300;display:flex;gap:12px}
.vv-tier li:before{content:'✦';color:var(--gold);font-size:11px;line-height:2.1}
.vv-tier-off{display:flex;align-items:center;justify-content:center;min-height:58px;border-radius:4px;border:1px solid var(--dline);color:var(--dbody);font-size:14px}
.vv-error{text-align:center;margin:24px 0 0;color:#F0B8A0}
.vv-pay{text-align:center;margin:34px 0 0;color:rgba(244,239,231,.45);font-size:13px;letter-spacing:.04em}

/* faq */
.vv-faq{border-top:1px solid var(--line)}
.vv-faq details{border-bottom:1px solid var(--line)}
.vv-faq summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:26px 0;font-family:var(--sans);font-weight:700;font-size:19px;line-height:1.2}
.vv-faq summary::-webkit-details-marker{display:none}
.vv-faq summary span{position:relative;flex-shrink:0;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);transition:transform .3s ease,background .3s}
.vv-faq summary span:before,.vv-faq summary span:after{content:'';position:absolute;left:50%;top:50%;width:12px;height:1px;background:var(--text);transform:translate(-50%,-50%)}
.vv-faq summary span:after{transform:translate(-50%,-50%) rotate(90deg);transition:transform .3s}
.vv-faq details[open] summary span{background:var(--gold)}
.vv-faq details[open] summary span:after{transform:translate(-50%,-50%) rotate(0)}
.vv-faq p{margin:0 0 28px;color:var(--body);font-weight:300;max-width:600px}

/* final */
.vv-final{background:#000;color:var(--bone);text-align:center;padding:160px 0 150px;background-image:radial-gradient(ellipse at 50% 0%,rgba(227,174,69,.35),transparent 60%)}
/* '.vv .' prefix on purpose: the '.vv h2{margin:0}' reset above is more specific than a single class,
   and it silently zeroed this margin, so the headline sat off-centre and on top of the button. */
.vv .vv-final-h{font-family:var(--serif);text-transform:uppercase;font-size:clamp(46px,7.4vw,112px);line-height:.98;letter-spacing:.005em;margin:0 auto 60px;max-width:1000px}
.vv-final-h i{color:var(--gold)}
.vv-final-note{margin:24px 0 0;font-size:13px;color:rgba(244,239,231,.5);letter-spacing:.04em}
.vv-foot{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px;padding:30px 24px 110px;background:var(--ink);color:rgba(244,239,231,.5);font-size:13.5px;border-top:1px solid var(--dline)}
.vv-foot .vv-logo{color:var(--bone);font-size:20px}
.vv-foot a{color:var(--gold2);text-decoration:none}

/* icon chip, shared */
.vv-ico{display:inline-flex;align-items:center;justify-content:center;width:58px;height:58px;border-radius:4px;color:var(--gold2);background:radial-gradient(circle at 30% 20%,rgba(247,210,122,.22),rgba(227,174,69,.06));border:1px solid rgba(227,174,69,.45);box-shadow:0 10px 30px -12px rgba(227,174,69,.5)}

/* hero photo: Amavi under the gold */
.vv-hero-photo{position:absolute;inset:0;opacity:.28;filter:grayscale(.35) sepia(.5) saturate(1.3) contrast(1.1)}
.vv-hero-photo:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.35) 40%,#000 96%)}

/* halves: two photo cards */
.vv-halves{display:grid;grid-template-columns:1fr 1fr;max-width:1200px;margin:0 auto;padding:0 24px;gap:20px}
.vv-half{border-radius:6px;overflow:hidden;border:1px solid var(--line);background:var(--ink2);display:flex;flex-direction:column}
.vv-half-photo{position:relative;aspect-ratio:16/10}
.vv-half-photo:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(13,12,10,.95))}
.vv-half-icon{position:absolute;left:24px;bottom:-26px;z-index:2;display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:4px;background:linear-gradient(180deg,var(--gold2),var(--gold));color:#000;box-shadow:0 14px 34px -10px rgba(227,174,69,.7)}
.vv-half-n{position:absolute;right:20px;top:14px;z-index:2;font-family:var(--serif);font-size:56px;line-height:1;color:rgba(247,243,234,.85)}
.vv-half-body{padding:46px 32px 32px}
.vv-half-body .vv-label{margin:0 0 10px}
.vv-half-beat{font-family:var(--serif);text-transform:uppercase;letter-spacing:.06em;font-size:20px;color:var(--gold);margin:0 0 4px}
.vv-half .vv-h2{font-size:clamp(38px,4vw,54px);margin-bottom:22px}
.vv-half ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.vv-half li{padding:9px 14px;border:1px solid var(--line);border-radius:3px;font-size:14px;font-weight:600;color:var(--bone)}
.vv-circles{margin:20px 0 0;padding:24px 28px;border-radius:6px;border:1px solid rgba(227,174,69,.45);background:linear-gradient(90deg,rgba(227,174,69,.12),transparent 70%);display:flex;gap:22px;align-items:center}
.vv-circles-icon{flex-shrink:0;display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:linear-gradient(180deg,var(--gold2),var(--gold));color:#000}
.vv-circles .vv-label{margin:0 0 4px}
.vv-circles p{margin:0;font-size:16px;color:var(--bone);font-weight:500}

/* outcomes: icon cards */
.vv-outcomes{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.vv-outcomes article{padding:30px 26px;border:1px solid var(--line);border-radius:6px;background:var(--ink2)}
.vv-outcomes h3{font-size:28px;line-height:1;margin:22px 0 10px}
.vv-outcomes p{margin:0;color:var(--body);font-size:15px}

/* flow: icon nodes on a gold line */
.vv-flow{list-style:none;margin:0;padding:0;border-left:2px solid rgba(227,174,69,.35)}
.vv-flow li{position:relative;padding:0 0 34px 48px}
.vv-flow-node{position:absolute;left:-19px;top:-2px;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#000;border:1px solid var(--gold);color:var(--gold2)}
.vv-flow-outer .vv-flow-node,.vv-flow-close .vv-flow-node{background:linear-gradient(180deg,var(--gold2),var(--gold));color:#000}
.vv-flow-tag{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
.vv-flow h3{font-size:28px;line-height:1;margin:4px 0 6px}
.vv-flow p{margin:0;color:var(--body);max-width:520px}
.vv-flow-time{display:flex;align-items:baseline;gap:16px;font-size:14px;letter-spacing:.06em;color:var(--muted);padding-bottom:34px!important}
.vv-flow-time:before{content:'';position:absolute;left:-7px;top:12px;width:12px;height:12px;border-radius:50%;background:var(--gold)}
.vv-flow-time span{font-family:var(--serif);font-size:40px;color:var(--text)}
.vv-flow li:last-child{padding-bottom:0!important}

/* proof: photo mosaic + stats */
.vv-proof{background:#000}
.vv-mosaic{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:240px 240px;gap:10px}
.vv-tile{position:relative;border-radius:6px;overflow:hidden;border:1px solid var(--line);transform:translateY(calc((1 - var(--s,1)) * 40px));transition:transform .2s linear}
.vv-tile img{filter:contrast(1.08) saturate(1.05);transition:transform .8s ease}
.vv-tile:hover img{transform:scale(1.04)}
.vv-tile-0{grid-row:span 2}
.vv-tile-1{transform:translateY(calc((1 - var(--s,1)) * 90px))}
.vv-tile-3{transform:translateY(calc((1 - var(--s,1)) * 120px))}
.vv-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:22px}
.vv-stats div{padding:24px 22px;border:1px solid var(--line);border-radius:6px;background:var(--ink2)}
.vv-stats b{display:block;font-family:var(--serif);font-weight:400;font-size:56px;line-height:1;color:var(--gold2)}
.vv-stats span{display:block;margin-top:8px;font-size:13.5px;color:var(--body)}

/* included: icon tiles */
.vv-incl{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.vv-incl article{padding:28px 24px;border:1px solid var(--line);border-radius:6px;background:var(--ink3)}
.vv-incl h3{font-size:24px;line-height:1.05;margin:20px 0 8px}
.vv-incl p{margin:0;color:var(--body);font-size:14.5px}

/* sticky buy, phone only */
.vv-sticky-buy{display:none}

@media (max-width:960px){
  .vv-outcomes,.vv-incl,.vv-stats{grid-template-columns:1fr 1fr}
  .vv-mosaic{grid-template-columns:1fr 1fr;grid-template-rows:260px 160px 160px}
  .vv-tile-0{grid-column:span 2;grid-row:auto}
  .vv-links{display:none}
  .vv-sec{padding:96px 0}
  .vv-split,.vv-halves,.vv-hosts,.vv-tiers{grid-template-columns:1fr}
  .vv-split{gap:44px}
  .vv-sticky{position:static}
  .vv-venue-grid{grid-template-columns:1fr;gap:48px}
  .vv-venue-small{left:-10px}
  .vv-shift{padding:100px 0}
}
@media (max-width:640px){
  .vv-outcomes article,.vv-incl article{padding:22px 18px}
  .vv-outcomes h3{font-size:23px;margin-top:16px}
  .vv-incl h3{font-size:20px;margin-top:16px}
  .vv-ico{width:48px;height:48px}
  .vv-half-body{padding:42px 22px 26px}
  .vv-half-n{font-size:44px}
  .vv-circles{padding:20px 18px;gap:16px}
  .vv-circles-icon{width:52px;height:52px}
  .vv-mosaic{grid-template-rows:220px 130px 130px;gap:8px}
  .vv-stats b{font-size:44px}
  .vv-stats div{padding:18px 16px}
  .vv-flow h3{font-size:24px}
  .vv-wrap,.vv-halves{padding:0 18px}
  .vv-nav{top:10px;padding:6px 6px 6px 18px}
  .vv-logo{font-size:20px}
  .vv-nav .vv-pill-sub{display:none}
  .vv-hero-in{padding-top:120px}
  .vv-seal{display:none}
  .vv-frame{inset:8px;border-radius:20px}
  .vv-tick{width:18px}
  .vv-eyebrow{letter-spacing:.2em;gap:10px;font-size:10.5px}
  .vv-facts{grid-template-columns:1fr 1fr;margin-top:44px}
  .vv-facts div:nth-child(3){padding-left:0;border-left:0}
  .vv-facts div:nth-child(n+3){border-top:1px solid var(--dline);margin-top:14px}
  .vv-facts dd{font-size:19px}
  .vv-hero-cta .vv-pill{width:100%}
  .vv-marquee span{font-size:24px}
  .vv-venue{padding:110px 0}
  .vv-venue-small{left:auto;right:-6px;width:44%}
  .vv-venue-facts{grid-template-columns:1fr}
  .vv-venue-facts div,.vv-venue-facts div:nth-child(even){padding:16px 0 0;border-left:0}
  .vv-tier{padding:34px 24px 26px}
  .vv-price{font-size:84px}
  .vv-faq summary{font-size:17px}
  .vv-mono{font-size:150px}
  .vv-host h3{font-size:36px}
  .vv-count{border-radius:4px;padding:14px 20px;gap:4px 16px}
  .vv-count-label{flex-basis:100%;text-align:center}
  .vv-sticky-buy{display:flex;position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:40;align-items:center;justify-content:space-between;gap:12px;padding:8px 8px 8px 20px;border-radius:6px;background:rgba(0,0,0,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--dline);color:var(--bone);transform:translateY(140%);transition:transform .4s cubic-bezier(.2,.7,.2,1)}
  .vv-sticky-on{transform:none}
  .vv-timer{margin-top:34px}
  .vv-collab-hosts{font-size:11.5px;letter-spacing:.16em;gap:6px 10px}
  .vv-collab-with{font-size:10px;letter-spacing:.14em}
  .vv-tick{display:none}
  .vv-timer-row{gap:6px}
  .vv-timer-cell{min-width:0;flex:1;padding:12px 4px 8px}
  .vv-timer-cell b{font-size:36px}
  .vv-timer-cell span{font-size:9.5px;letter-spacing:.14em}
  .vv-meter-top{font-size:11px}
  .vv-eyebrow-x{display:none}
  .vv-sub{letter-spacing:.32em;font-size:11px;margin-top:20px}
  .vv-shift-row{grid-template-columns:1fr;gap:8px;padding:22px 0}
  .vv-shift-head{display:none}
  .vv-shift-arrow{width:auto;height:auto;border:0;justify-content:flex-start;transform:rotate(90deg);width:16px}
  .vv-sticky-buy b{font-family:var(--serif);font-weight:400;font-size:24px;margin-right:8px}
  .vv-sticky-buy span{font-size:12px;color:var(--dbody)}
}
@media (prefers-reduced-motion:reduce){
  .vv [data-r],.vv-load{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}
  .vv-orb,.vv-seal svg,.vv-marquee-track,.vv-sheen{animation:none!important}
  .vv-pill,.vv-pill:hover{transition:none;transform:none}
  .vv-aura,.vv-hero-in,.vv-venue-logo,.vv-venue-main,.vv-venue-small{transform:none!important;opacity:1!important}
  .vv-progress{display:none}
}
`
