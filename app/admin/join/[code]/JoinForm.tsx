'use client'

import { useState } from 'react'
import { ADMIN_CSS } from '../../styles'

export default function JoinForm({ code, valid, name }: { code: string; valid: boolean; name: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending'); setError('')
    const res = await fetch('/admin/join/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, email }) }).catch(() => null)
    const d = (await res?.json().catch(() => ({}))) as { ok?: boolean; error?: string } | undefined
    if (res?.ok && d?.ok) setState('sent')
    else { setState('error'); setError(d?.error || 'Something went wrong. Try again.') }
  }

  return (
    <main className="ad ad-center">
      <div className="ad-login">
        <p className="ad-kicker">{name} · Admin</p>
        <h1>You are invited</h1>
        {!valid ? (
          <p className="ad-warn">This invite has expired or was already used. Ask Nevin for a new one.</p>
        ) : state === 'sent' ? (
          <p className="ad-muted">Check <b>{email}</b>. Open the link in that email to confirm, and the dashboard opens. It works for 30 minutes.</p>
        ) : (
          <form onSubmit={submit}>
            <p className="ad-muted" style={{ marginTop: 0 }}>Enter the email you want to sign in with. We send a link there to confirm it is yours. After that, this email has access to the event dashboard.</p>
            <label htmlFor="jn-email">Your email</label>
            <input id="jn-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            <button className="ad-btn" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send me the confirm link'}</button>
            {state === 'error' && <p className="ad-warn">{error}</p>}
          </form>
        )}
      </div>
      <style>{ADMIN_CSS}</style>
    </main>
  )
}
