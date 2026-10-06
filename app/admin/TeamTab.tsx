'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// The Team tab: who can open this dashboard, and a one-time invite link to add
// someone (Luke). Only owners (ADMIN_EMAILS in Vercel) can invite or remove.

export interface TeamData {
  owners: string[]
  added: { email: string; addedAt: string; addedBy: string }[]
  invites: { id: string; createdAt: string; expiresAt: string; sends: number }[]
  canManage: boolean
}

const day = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })

export default function TeamTab({ team, me, storeOk }: { team: TeamData; me: string; storeOk: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [armed, setArmed] = useState('')

  async function call(body: object) {
    setBusy(true); setMsg(null)
    const res = await fetch('/admin/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
    const d = (await res?.json().catch(() => ({}))) as { ok?: boolean; error?: string; url?: string } | undefined
    setBusy(false)
    if (res?.ok && d?.ok) { router.refresh(); return d }
    setMsg({ ok: false, text: d?.error || 'That did not save. Try again.' })
    return null
  }

  const copy = (t: string) => { navigator.clipboard?.writeText(t).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <>
      {!storeOk && <p className="ad-banner bad">The event data store is not connected (BLOB_READ_WRITE_TOKEN), so invited admins cannot be saved.</p>}
      {msg && <p className={`ad-banner${msg.ok ? '' : ' bad'}`}>{msg.text}</p>}
      <div className="ad-grid2">
        <section className="ad-card">
          <h2>Who has access</h2>
          <div className="ad-scroll">
            <table className="ad-table">
              <tbody>
                {team.owners.map(e => (
                  <tr key={e}><td>{e}{e === me ? ' (you)' : ''}</td><td><span className="ad-pill ok">Owner</span></td><td /></tr>
                ))}
                {team.added.map(a => (
                  <tr key={a.email}>
                    <td>{a.email}{a.email === me ? ' (you)' : ''}<br /><small style={{ color: '#8E8576' }}>Added {day(a.addedAt)}</small></td>
                    <td><span className="ad-pill">Admin</span></td>
                    <td style={{ textAlign: 'right' }}>{team.canManage && (
                      <button className="ad-btn ghost sm" disabled={busy} onClick={async () => {
                        if (armed !== a.email) return setArmed(a.email)
                        setArmed('')
                        if (await call({ action: 'remove', email: a.email })) setMsg({ ok: true, text: `${a.email} no longer has access.` })
                      }}>{armed === a.email ? 'Tap again to remove' : 'Remove'}</button>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ad-small">Owners are set in Vercel (ADMIN_EMAILS). Removing an admin locks them out on their next page load.</p>
        </section>

        <section className="ad-card">
          <h2>Invite someone</h2>
          {team.canManage ? (
            <>
              <p className="ad-muted" style={{ marginTop: 0 }}>Make a link and send it. It works once, for 7 days. They enter their email, confirm it from their inbox, and from then on that email can sign in here.</p>
              <button className="ad-btn" disabled={busy || !storeOk} onClick={async () => {
                const d = await call({ action: 'invite' })
                if (d?.url) { setLink(d.url); setMsg({ ok: true, text: 'Invite link ready. Copy it and send it.' }) }
              }}>Create invite link</button>
              {link && (
                <div style={{ marginTop: 14 }}>
                  <input readOnly value={link} onFocus={e => e.currentTarget.select()} style={{ width: '100%' }} aria-label="Invite link" />
                  <button className="ad-btn ghost sm" style={{ marginTop: 8 }} onClick={() => copy(link)}>{copied ? 'Copied' : 'Copy link'}</button>
                </div>
              )}
              {team.invites.length > 0 && (
                <>
                  <h3 style={{ margin: '20px 0 8px', fontSize: 14 }}>Open invites</h3>
                  {team.invites.map(i => (
                    <p key={i.id} className="ad-small" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span>Made {day(i.createdAt)} · valid until {day(i.expiresAt)}</span>
                      <button className="ad-btn ghost sm" disabled={busy} onClick={async () => { if (await call({ action: 'revoke', id: i.id })) setMsg({ ok: true, text: 'Invite cancelled.' }) }}>Cancel</button>
                    </p>
                  ))}
                </>
              )}
            </>
          ) : <p className="ad-muted">Only the event owners can invite or remove people.</p>}
        </section>
      </div>
    </>
  )
}
