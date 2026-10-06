'use client'

import { useEffect, useState } from 'react'

// The phone remembers its tickets. Saved on the thank-you page and whenever a
// ticket link is opened; shown as a "Your ticket" button when they come back.
// Only the signed ticket code is stored (no name, no email). The emailed
// ticket stays the backup if the browser forgets.
const KEY = 'uticket'

function read(): string[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, 5) : [] } catch { return [] }
}

/** Saves a ticket code on this device. Renders nothing. */
export function RememberTicket({ code }: { code: string }) {
  useEffect(() => {
    if (!code) return
    try { localStorage.setItem(KEY, JSON.stringify([code, ...read().filter(c => c !== code)].slice(0, 5))) } catch { /* storage blocked: the email has the ticket */ }
  }, [code])
  return null
}

/** A floating "Your ticket" button for a returning buyer. Nothing for anyone else. */
export function MyTicketButton() {
  const [codes, setCodes] = useState<string[]>([])
  useEffect(() => { setCodes(read()) }, [])
  if (!codes.length) return null
  return (
    <a href={`/t/${codes[0]}`} className="my-ticket" aria-label="Show your ticket">
      <span aria-hidden="true">🎟</span> Your ticket{codes.length > 1 ? 's' : ''}
      <style>{`.my-ticket{position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 64px);z-index:60;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 18px;background:#E3AE45;color:#000;font:800 14.5px var(--vv-body),system-ui,sans-serif;text-decoration:none;border-radius:999px;box-shadow:0 8px 28px rgba(0,0,0,.5)}`}</style>
    </a>
  )
}
