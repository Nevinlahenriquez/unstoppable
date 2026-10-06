'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Guest } from '../../lib/guests'
import type { Referrer, ReferralSettings, Registration } from '../../lib/referrals'

// The Referrals tab: who has a link, who they brought, what they have earned,
// and the reward rule (a setting, because it is not decided yet).

const slug = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)

export default function ReferralsTab({ referrers, settings, registrations, guests, siteUrl, storeOk }: {
  referrers: Referrer[]
  settings: ReferralSettings
  registrations: Registration[]
  guests: Guest[]
  siteUrl: string
  storeOk: boolean
}) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', code: '' })
  const [rule, setRule] = useState(settings)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState('')
  const [armed, setArmed] = useState('')

  async function call(body: object, done: string) {
    setBusy(true); setMsg(null)
    const res = await fetch('/admin/api/referrals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
    const d = (await res?.json().catch(() => ({}))) as { ok?: boolean; error?: string } | undefined
    setBusy(false)
    if (res?.ok && d?.ok) { setMsg({ ok: true, text: done }); router.refresh(); return true }
    setMsg({ ok: false, text: d?.error || 'That did not save. Try again.' })
    return false
  }

  const rows = referrers.map(r => {
    const signed = registrations.filter(x => x.ref === r.code).length
    const paid = guests.filter(g => g.ref === r.code).reduce((n, g) => n + g.qty, 0)
    const earned = paid * (rule.rewardPerTicket || 0)
    const freeSeat = rule.freeTicketAt > 0 && paid >= rule.freeTicketAt
    return { r, signed, paid, earned, freeSeat, link: `${siteUrl}/?ref=${r.code}` }
  }).sort((a, b) => b.paid - a.paid || b.signed - a.signed)

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  return (
    <>
      {!storeOk && <p className="ad-banner bad">The event data store is not connected (BLOB_READ_WRITE_TOKEN), so referrals cannot be saved.</p>}
      {msg && <p className={`ad-banner${msg.ok ? '' : ' bad'}`}>{msg.text}</p>}

      <section className="ad-card" style={{ marginBottom: 16 }}>
        <h2>Leaderboard</h2>
        {rows.length ? (
          <div className="ad-scroll">
            <table className="ad-table">
              <thead><tr><th>#</th><th>Who</th><th>Signed up</th><th>Paid seats</th><th>Reward</th><th>Link</th></tr></thead>
              <tbody>{rows.map((x, i) => (
                <tr key={x.r.code}>
                  <td>{i + 1}</td>
                  <td>{x.r.name}<br /><small style={{ color: '#8E8576' }}>{x.r.code}{x.r.email ? ` · ${x.r.email}` : ''}</small></td>
                  <td>{x.signed}</td>
                  <td><b style={{ color: '#fff' }}>{x.paid}</b></td>
                  <td>{x.earned ? `$${x.earned}` : '—'}{x.freeSeat ? <><br /><span className="ad-pill ok">Free seat earned</span></> : null}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="ad-btn ghost sm" onClick={() => copy(x.link, x.r.code)}>{copied === x.r.code ? 'Copied' : 'Copy link'}</button>{' '}
                    <button className="ad-btn ghost sm" disabled={busy} onClick={() => { if (armed === x.r.code) { setArmed(''); call({ action: 'remove', code: x.r.code }, `${x.r.name} removed.`) } else setArmed(x.r.code) }}>{armed === x.r.code ? 'Tap again to remove' : 'Remove'}</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="ad-empty">No referrers yet. Add the first one below and send them their link.</p>}
      </section>

      <div className="ad-grid2">
        <section className="ad-card">
          <h2>Give someone a link</h2>
          <form className="ad-form" onSubmit={async e => {
            e.preventDefault()
            const code = slug(form.code || form.name.split(' ')[0])
            if (await call({ action: 'add', name: form.name, email: form.email, code }, `Link ready: ${siteUrl}/?ref=${code}`)) setForm({ name: '', email: '', code: '' })
          }}>
            <label>Name<input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
            <label>Email (optional)<input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></label>
            <label>Code (optional, made from the name)<input value={form.code} placeholder={slug(form.name.split(' ')[0]) || 'MAYA'} onChange={e => setForm(f => ({ ...f, code: slug(e.target.value) }))} /></label>
            <button className="ad-btn" disabled={busy || !storeOk}>Create link</button>
          </form>
          <p className="ad-small">Their friends can also type the code on the ticket form.</p>
        </section>

        <section className="ad-card">
          <h2>Reward rule</h2>
          <form className="ad-form" onSubmit={e => { e.preventDefault(); call({ action: 'settings', ...rule }, 'Reward rule saved.') }}>
            <label>Friend discount, $ off each ticket<input type="number" min={0} max={150} value={rule.friendDiscount} onChange={e => setRule(r => ({ ...r, friendDiscount: Number(e.target.value) }))} /></label>
            <label>Referrer earns, $ per paid seat<input type="number" min={0} max={200} value={rule.rewardPerTicket} onChange={e => setRule(r => ({ ...r, rewardPerTicket: Number(e.target.value) }))} /></label>
            <label>Free seat for the referrer after N paid seats (0 = off)<input type="number" min={0} max={60} value={rule.freeTicketAt} onChange={e => setRule(r => ({ ...r, freeTicketAt: Number(e.target.value) }))} /></label>
            <label>The rule in words (for you and Luke)<textarea rows={2} value={rule.note} onChange={e => setRule(r => ({ ...r, note: e.target.value }))} /></label>
            <button className="ad-btn" disabled={busy || !storeOk}>Save rule</button>
          </form>
          <p className="ad-small">The friend discount is applied at payment automatically. Rewards for referrers are counted here; you pay them out or refund their ticket yourself.</p>
        </section>
      </div>
    </>
  )
}
