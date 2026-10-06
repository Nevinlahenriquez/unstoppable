'use client'

import { useState } from 'react'
import { ADMIN_CSS } from './styles'

export default function AdminLogin({ expired, configured }: { expired: boolean; configured: boolean }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending'); setError('')
    const res = await fetch('/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => null)
    const d = (await res?.json().catch(() => ({}))) as { ok?: boolean; error?: string } | undefined
    if (res?.ok && d?.ok) setState('sent')
    else { setState('error'); setError(d?.error || 'Something went wrong. Try again.') }
  }

  return (
    <main className="ad ad-center">
      <div className="ad-login">
        <p className="ad-kicker">I Am Unstoppable · Admin</p>
        <h1>Event dashboard</h1>
        {!configured ? (
          <p className="ad-muted">Sign-in is not switched on yet. ADMIN_EMAILS and ADMIN_SECRET need to be set in Vercel.</p>
        ) : state === 'sent' ? (
          <p className="ad-muted">If <b>{email}</b> has access, a sign-in link is on its way. Open it on this device. It works for 15 minutes.</p>
        ) : (
          <form onSubmit={submit}>
            {expired && <p className="ad-warn">That link has expired or was already used. Ask for a new one.</p>}
            <label htmlFor="ad-email">Your email</label>
            <input id="ad-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            <button className="ad-btn" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}</button>
            {state === 'error' && <p className="ad-warn">{error}</p>}
            <p className="ad-small">Only the hosts have access.</p>
          </form>
        )}
      </div>
      <style>{ADMIN_CSS}</style>
    </main>
  )
}
