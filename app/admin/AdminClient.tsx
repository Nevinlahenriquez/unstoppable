'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EmailStage, Guest } from '../../lib/guests'
import { ADMIN_CSS } from './styles'
import type { Referrer, ReferralSettings, Registration } from '../../lib/referrals'
import ReferralsTab from './ReferralsTab'

export interface EmailCard { stage: EmailStage; label: string; when: string; dueLabel: string; subject: string; html: string }
type Tab = 'overview' | 'guests' | 'referrals' | 'emails'

const STAGE_SHORT: Record<EmailStage, string> = { confirmation: 'Confirmation', d7: '1 week', d1: '1 day', day: 'Day of', after: 'Thank you' }
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })
const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^0-9]/g, '')}`

export default function AdminClient(props: {
  me: string
  guests: Guest[] | null
  loadError: string
  emails: EmailCard[]
  event: { name: string; date: string; seats: number }
  tiers: { id: string; name: string; price: number; seats: number }[]
  salesOpen: boolean
  stripeConnected: boolean
  emailReady: boolean
  soldElsewhere: number
  referrers: Referrer[]
  settings: ReferralSettings
  registrations: Registration[]
  siteUrl: string
  storeOk: boolean
}) {
  const { me, loadError, emails, event, tiers, salesOpen, stripeConnected, emailReady, soldElsewhere } = props
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [guests, setGuests] = useState<Guest[]>(props.guests ?? [])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState<Record<string, { ok: boolean; text: string }>>({})
  const [preview, setPreview] = useState<EmailStage | null>(null)

  const seatsSold = guests.reduce((n, g) => n + g.qty, 0) + soldElsewhere
  const revenue = guests.reduce((n, g) => n + g.amount, 0)
  const checkedIn = guests.reduce((n, g) => n + g.checkedInCount, 0)
  const early = tiers.find(t => t.seats)
  const earlySold = early ? guests.filter(g => g.tier === early.id).reduce((n, g) => n + g.qty, 0) : 0

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return guests
    return guests.filter(g => [g.name, g.email, g.phone, g.business, g.website, g.challenge, g.result].join(' ').toLowerCase().includes(s))
  }, [guests, q])

  // Filled in the form but no payment (or sales were closed): the follow-up list.
  const paidEmails = useMemo(() => new Set(guests.map(g => g.email.toLowerCase())), [guests])
  const unpaid = useMemo(() => props.registrations.filter(r => r.status !== 'paid' && !paidEmails.has(r.email.toLowerCase())).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [props.registrations, paidEmails])

  const sentLog = useMemo(() => guests.flatMap(g => (Object.entries(g.sent) as [EmailStage, string][]).map(([stage, at]) => ({ g, stage, at }))).sort((a, b) => b.at.localeCompare(a.at)), [guests])

  async function post(url: string, body: object) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
    const d = (await res?.json().catch(() => ({}))) as { ok?: boolean; error?: string; guest?: Guest; to?: string } | undefined
    if (res?.status === 401) { router.refresh(); return { ok: false, error: 'Please sign in again.' } }
    return { ok: !!(res?.ok && d?.ok), error: d?.error, guest: d?.guest, to: d?.to }
  }

  async function checkIn(g: Guest) {
    setBusy(`ci-${g.id}`)
    const r = await post('/admin/api/guest', { id: g.id, action: g.checkedIn ? 'uncheck' : 'checkin' })
    if (r.ok && r.guest) setGuests(gs => gs.map(x => (x.id === g.id ? r.guest! : x)))
    else setNote(n => ({ ...n, [g.id]: { ok: false, text: r.error || 'Could not update check-in.' } }))
    setBusy('')
  }

  async function resend(g: Guest, stage: EmailStage) {
    setBusy(`rs-${g.id}`)
    const r = await post('/admin/api/guest', { id: g.id, action: 'resend', stage })
    setNote(n => ({ ...n, [g.id]: { ok: r.ok, text: r.ok ? `${STAGE_SHORT[stage]} email sent to ${g.email}.` : r.error || 'Could not send.' } }))
    if (r.ok) router.refresh()
    setBusy('')
  }

  async function test(stage: EmailStage) {
    setBusy(`t-${stage}`)
    const r = await post('/admin/api/test-email', { stage })
    setNote(n => ({ ...n, [stage]: { ok: r.ok, text: r.ok ? `Test sent to ${r.to}.` : r.error || 'Could not send the test.' } }))
    setBusy('')
  }

  return (
    <main className="ad">
      <header className="ad-top">
        <div className="ad-top-in">
          <div className="ad-head">
            <div>
              <p className="ad-kicker">Admin · {event.date}</p>
              <h1>{event.name}</h1>
            </div>
            <form className="ad-me" action="/admin/logout" method="post">
              <a href="/admin/scan" className="ad-btn sm" style={{ marginBottom: 6 }}>Scan tickets</a><br />{me}<br /><button>Sign out</button>
            </form>
          </div>
          <nav className="ad-tabs" role="tablist">
            {([['overview', 'Overview'], ['guests', `Guests (${guests.length})`], ['referrals', `Referrals (${props.referrers.length})`], ['emails', 'Emails']] as [Tab, string][]).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className="ad-tab" onClick={() => setTab(k)}>{l}</button>
            ))}
          </nav>
        </div>
      </header>

      <div className="ad-body">
        {!salesOpen && <p className="ad-banner">Ticket sales are <b>closed</b>. The page shows “Ticket sales open very soon” until you switch them on.</p>}
        {!stripeConnected && <p className="ad-banner bad">Stripe is not connected yet, so there are no guests to show. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel.</p>}
        {!emailReady && <p className="ad-banner bad">Guest emails are off: RESEND_API_KEY or EMAIL_FROM is missing in Vercel.</p>}
        {loadError && <p className="ad-banner bad">{loadError}</p>}

        {tab === 'overview' && (
          <>
            <div className="ad-stats">
              <div className="ad-stat"><span>Seats sold</span><b>{seatsSold}<small style={{ fontSize: 16, color: '#8E8576' }}> / {event.seats}</small></b><div className="ad-bar"><i style={{ width: `${Math.min(100, (seatsSold / event.seats) * 100)}%` }} /></div></div>
              <div className="ad-stat"><span>Seats left</span><b>{Math.max(0, event.seats - seatsSold)}</b></div>
              <div className="ad-stat"><span>Revenue</span><b>${revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</b></div>
              {early ? <div className="ad-stat"><span>{early.name}</span><b>{earlySold}<small style={{ fontSize: 16, color: '#8E8576' }}> / {early.seats}</small></b></div> : null}
              <div className="ad-stat"><span>Checked in</span><b>{checkedIn}</b></div>
            </div>
            {soldElsewhere > 0 && <p className="ad-small" style={{ margin: '-10px 0 18px' }}>Includes {soldElsewhere} seat{soldElsewhere === 1 ? '' : 's'} sold outside this Stripe account.</p>}
            <div className="ad-grid2">
              <section className="ad-card">
                <h2>Latest guests</h2>
                {guests.length ? (
                  <ul className="ad-list">
                    {guests.slice(0, 6).map(g => (
                      <li key={g.id}>{g.name || g.email}{g.qty > 1 ? ` · ${g.qty} seats` : ''}<small>{g.business || 'No business given'} · {when(g.createdAt)}</small></li>
                    ))}
                  </ul>
                ) : <p className="ad-empty">No tickets sold yet. Guests appear here the moment they pay.</p>}
              </section>
              <section className="ad-card">
                <h2>What they want from the day</h2>
                {guests.some(g => g.result) ? (
                  <ul className="ad-list">
                    {guests.filter(g => g.result).slice(0, 8).map(g => <li key={g.id}>“{g.result}”<small>{g.name}</small></li>)}
                  </ul>
                ) : <p className="ad-empty">Answers to “the result you want from the day” show up here, so you can shape the day around them.</p>}
              </section>
              <section className="ad-card">
                <h2>Their biggest challenges</h2>
                {guests.some(g => g.challenge) ? (
                  <ul className="ad-list">
                    {guests.filter(g => g.challenge).slice(0, 8).map(g => <li key={g.id}>“{g.challenge}”<small>{g.name}{g.business ? ` · ${g.business}` : ''}</small></li>)}
                  </ul>
                ) : <p className="ad-empty">Nothing yet. This is optional at checkout.</p>}
              </section>
              <section className="ad-card">
                <h2>Prices</h2>
                <ul className="ad-list">
                  {tiers.map(t => <li key={t.id}>{t.name}: ${t.price}<small>{t.seats ? `First ${t.seats} seats` : 'After early bird'}</small></li>)}
                </ul>
              </section>
            </div>
          </>
        )}

        {tab === 'guests' && (
          <>
            <div className="ad-tools">
              <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email, phone, business…" aria-label="Search guests" />
              <a className="ad-btn ghost sm" href="/admin/export">Download CSV</a>
            </div>
            {!shown.length && <p className="ad-empty">{guests.length ? 'Nobody matches that search.' : 'No guests yet.'}</p>}
            {shown.map(g => (
              <details key={g.id} className="ad-g">
                <summary>
                  <span className="ad-g-name">{g.name || g.email}{g.qty > 1 ? ` (${g.qty})` : ''}</span>
                  <span className={`ad-pill${g.checkedIn ? ' ok' : ''}`}>{g.checkedIn ? (g.qty > 1 && g.checkedInCount < g.qty ? `In ${g.checkedInCount}/${g.qty}` : 'Checked in') : tiers.find(t => t.id === g.tier)?.name || 'Ticket'}</span>
                  <span className="ad-g-sub">{[g.business, g.email].filter(Boolean).join(' · ')}</span>
                </summary>
                <div className="ad-g-body">
                  <dl className="ad-dl">
                    <div><dt>Email</dt><dd>{g.email ? <a href={`mailto:${g.email}`}>{g.email}</a> : '—'}</dd></div>
                    <div><dt>Phone</dt><dd>{g.phone ? <><a href={`tel:${g.phone}`}>{g.phone}</a> · <a href={waLink(g.phone)} target="_blank" rel="noopener noreferrer">WhatsApp</a></> : '—'}</dd></div>
                    <div><dt>Business</dt><dd>{g.business || '—'}</dd></div>
                    <div><dt>Website or Instagram</dt><dd>{g.website || '—'}</dd></div>
                    <div><dt>Biggest challenge</dt><dd>{g.challenge || '—'}</dd></div>
                    <div><dt>Result they want</dt><dd>{g.result || '—'}</dd></div>
                    <div><dt>Ticket</dt><dd>{tiers.find(t => t.id === g.tier)?.name || g.tier} · {g.qty} seat{g.qty === 1 ? '' : 's'} · ${g.amount} · {when(g.createdAt)}</dd></div>
                    <div><dt>Emails sent</dt><dd className="ad-sent">{Object.keys(g.sent).length ? (Object.entries(g.sent) as [EmailStage, string][]).map(([s, at]) => <span key={s} className="ad-pill ok">{STAGE_SHORT[s]} · {when(at)}</span>) : 'None yet'}</dd></div>
                  </dl>
                  <div className="ad-actions">
                    <button className="ad-btn sm" disabled={!!busy} onClick={() => checkIn(g)}>{g.checkedIn ? 'Undo check-in' : 'Check in'}</button>
                    <button className="ad-btn ghost sm" disabled={!!busy || !g.email} onClick={() => resend(g, 'confirmation')}>Resend confirmation</button>
                  </div>
                  {note[g.id] && <p className={`ad-note${note[g.id].ok ? '' : ' bad'}`}>{note[g.id].text}</p>}
                </div>
              </details>
            ))}
            <section className="ad-card" style={{ marginTop: 22 }}>
              <h2>Signed up, not paid yet ({unpaid.length})</h2>
              <p className="ad-muted" style={{ marginTop: 0, fontSize: 14 }}>They filled in the ticket form{salesOpen ? ' but did not finish paying' : ' while sales were closed'}. Worth a WhatsApp.</p>
              {unpaid.length ? (
                <div className="ad-scroll">
                  <table className="ad-table">
                    <thead><tr><th>When</th><th>Who</th><th>Phone</th><th>Seats</th><th>Referral</th></tr></thead>
                    <tbody>{unpaid.map(r => (
                      <tr key={r.id}>
                        <td>{when(r.createdAt)}</td>
                        <td>{r.name}<br /><small style={{ color: '#8E8576' }}>{[r.email, r.business].filter(Boolean).join(' · ')}</small>{r.result ? <><br /><small style={{ color: '#B5AD9F' }}>Wants: {r.result}</small></> : null}</td>
                        <td>{r.phone ? <a href={waLink(r.phone)} target="_blank" rel="noopener noreferrer" style={{ color: '#E3AE45' }}>{r.phone}</a> : '—'}</td>
                        <td>{r.qty}</td>
                        <td>{r.ref || '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <p className="ad-empty">Nobody waiting.</p>}
            </section>
          </>
        )}

        {tab === 'referrals' && (
          <ReferralsTab referrers={props.referrers} settings={props.settings} registrations={props.registrations} guests={guests} siteUrl={props.siteUrl} storeOk={props.storeOk} />
        )}

        {tab === 'emails' && (
          <>
            <p className="ad-muted" style={{ marginTop: 0 }}>Every guest gets these automatically, from hello@updates.unstoppable.events. Replies go to your inbox.</p>
            <div className="ad-mail">
              {emails.map(e => {
                const sent = guests.filter(g => g.sent[e.stage]).length
                return (
                  <section key={e.stage} className="ad-card">
                    <div className="ad-mail-h">
                      <div>
                        <b>{e.label}</b>
                        <p>{e.when}{e.dueLabel ? ` · ${e.dueLabel}` : ''}</p>
                        <p className="subj">Subject: {e.subject}</p>
                      </div>
                      <span className="ad-pill">{sent} / {guests.length} sent</span>
                    </div>
                    <div className="ad-actions" style={{ marginTop: 12 }}>
                      <button className="ad-btn ghost sm" onClick={() => setPreview(preview === e.stage ? null : e.stage)}>{preview === e.stage ? 'Hide preview' : 'Preview'}</button>
                      <button className="ad-btn sm" disabled={!!busy || !emailReady} onClick={() => test(e.stage)}>{busy === `t-${e.stage}` ? 'Sending…' : 'Send me a test'}</button>
                    </div>
                    {note[e.stage] && <p className={`ad-note${note[e.stage].ok ? '' : ' bad'}`}>{note[e.stage].text}</p>}
                    {preview === e.stage && <iframe className="ad-frame" title={`${e.label} preview`} srcDoc={e.html} sandbox="" />}
                  </section>
                )
              })}
            </div>
            <section className="ad-card">
              <h2>Sent to guests</h2>
              {sentLog.length ? (
                <div className="ad-scroll">
                  <table className="ad-table">
                    <thead><tr><th>When</th><th>Guest</th><th>Email</th></tr></thead>
                    <tbody>{sentLog.map(r => <tr key={`${r.g.id}-${r.stage}`}><td>{when(r.at)}</td><td>{r.g.name || r.g.email}<br /><small style={{ color: '#8E8576' }}>{r.g.email}</small></td><td>{STAGE_SHORT[r.stage]}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : <p className="ad-empty">Nothing sent yet. Each email lands here with the time it went out.</p>}
            </section>
          </>
        )}
      </div>
      <style>{ADMIN_CSS}</style>
    </main>
  )
}
