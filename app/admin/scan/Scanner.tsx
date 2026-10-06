'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

type Result = { ok: boolean; status: string; error?: string; seat?: number; guest?: { name: string; qty: number; checkedInCount: number; checkedIn: string } }

// The door scanner. Uses the phone's back camera and reads QR codes in the page
// (jsQR), so it works on iPhone and Android with nothing to install.
export default function Scanner({ api = '/admin/api/scan', home = '/admin', door = false }: { api?: string; home?: string; door?: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const lock = useRef(false)
  const last = useRef({ code: '', at: 0 })
  const [camErr, setCamErr] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [manual, setManual] = useState('')
  const [count, setCount] = useState(0)

  const check = useCallback(async (code: string) => {
    lock.current = true
    const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) }).catch(() => null)
    const d = ((await res?.json().catch(() => null)) ?? { ok: false, status: 'error', error: 'No connection. Scan again.' }) as Result
    if (d.status === 'auth') { window.location.href = home; return }
    setResult(d)
    if (d.ok) setCount(c => c + 1)
    try { navigator.vibrate?.(d.ok ? 80 : [60, 60, 60]) } catch {}
  }, [api, home])

  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false
    const tick = () => {
      if (stopped) return
      const v = video.current, c = canvas.current
      if (v && c && v.readyState >= 2 && !lock.current) {
        const w = v.videoWidth, h = v.videoHeight
        const scale = Math.min(1, 640 / Math.max(w, h))
        c.width = Math.round(w * scale); c.height = Math.round(h * scale)
        const ctx = c.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(v, 0, 0, c.width, c.height)
          const img = ctx.getImageData(0, 0, c.width, c.height)
          const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
          // The same code held in front of the camera must not admit two seats.
          if (hit?.data && !(hit.data === last.current.code && Date.now() - last.current.at < 4000)) {
            last.current = { code: hit.data, at: Date.now() }
            check(hit.data)
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(s => {
        stream = s
        if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}) }
        raf = requestAnimationFrame(tick)
      })
      .catch(() => setCamErr('The camera is blocked. Allow camera access for this site in your browser settings, or paste the ticket link below.'))
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()) }
  }, [check])

  const next = () => { setResult(null); lock.current = false; last.current.at = Date.now() }
  const tone = !result ? '' : result.ok ? '#1F6B34' : result.status === 'already' ? '#8A5A00' : '#8A2A1A'

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px 16px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 28 }}>Door</h1>
        {door
          ? <form action="/door/logout" method="post"><button className="ad-btn ghost sm">Sign out</button></form>
          : <a href="/admin" className="ad-btn ghost sm">Back to admin</a>}
      </div>
      <p className="ad-muted" style={{ margin: '0 0 12px', fontSize: 14 }}>Point the camera at the guest&apos;s QR code. One scan lets in one person. Scanned in this session: <b style={{ color: '#fff' }}>{count}</b></p>
      <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#111', aspectRatio: '1 / 1' }}>
        <video ref={video} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div aria-hidden style={{ position: 'absolute', inset: '18%', border: '3px solid #E3AE45', borderRadius: 8 }} />
        {result && (
          <div role="alert" style={{ position: 'absolute', inset: 0, background: tone, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <p style={{ margin: 0, fontFamily: 'var(--vv-display), Impact, sans-serif', fontSize: 40, textTransform: 'uppercase' }}>{result.ok ? 'Welcome in' : result.status === 'already' ? 'Already in' : 'Not valid'}</p>
            {result.guest && <p style={{ margin: '10px 0 0', fontSize: 22, fontWeight: 700 }}>{result.guest.name || 'Guest'}</p>}
            {result.ok && result.guest && result.guest.qty > 1 && <p style={{ margin: '6px 0 0', fontSize: 17 }}>Seat {result.seat} of {result.guest.qty}</p>}
            {!result.ok && <p style={{ margin: '8px 0 0', fontSize: 16 }}>{result.error}</p>}
            {result.status === 'already' && result.guest?.checkedIn && <p style={{ margin: '6px 0 0', fontSize: 14 }}>First scanned {new Date(result.guest.checkedIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })} Bali time</p>}
            <button className="ad-btn" style={{ background: '#fff', marginTop: 22, minWidth: 180 }} onClick={next}>Scan next</button>
          </div>
        )}
      </div>
      <canvas ref={canvas} hidden />
      {camErr && <p className="ad-banner bad" style={{ marginTop: 14 }}>{camErr}</p>}
      <form className="ad-form" style={{ marginTop: 18 }} onSubmit={e => { e.preventDefault(); if (manual.trim()) { check(manual.trim()); setManual('') } }}>
        <label>Or paste the ticket link<input value={manual} onChange={e => setManual(e.target.value)} placeholder="https://unstoppable.events/t/..." /></label>
        <button className="ad-btn" disabled={!manual.trim()}>Check ticket</button>
      </form>
      <p className="ad-small">{door
        ? 'No ticket, or the screen says Not valid? Do not let them in yet. Send them to Nevin or Luke.'
        : 'No ticket? Find them in the guest list in admin and press Check in.'}</p>
    </div>
  )
}
