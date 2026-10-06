'use client'

import { useState } from 'react'
import { ADMIN_CSS } from '../admin/styles'

export default function DoorLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await fetch('/door/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }).catch(() => null)
    const d = (await res?.json().catch(() => ({}))) as { ok?: boolean; error?: string } | undefined
    if (res?.ok && d?.ok) { window.location.reload(); return }
    setBusy(false); setError(d?.error || 'No connection. Try again.')
  }

  return (
    <main className="ad ad-center">
      <div className="ad-login">
        <p className="ad-kicker">I Am Unstoppable · Door</p>
        <h1>Ticket check</h1>
        {!configured ? (
          <p className="ad-muted">The door scanner is not switched on yet. Ask Nevin or Luke.</p>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="door-pw">Door password</label>
            <input id="door-pw" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="ad-btn" disabled={busy}>{busy ? 'Checking…' : 'Open the scanner'}</button>
            {error && <p className="ad-warn">{error}</p>}
            <p className="ad-small">You will be asked to allow the camera. This only checks tickets at the door.</p>
          </form>
        )}
      </div>
      <style>{ADMIN_CSS}</style>
    </main>
  )
}
