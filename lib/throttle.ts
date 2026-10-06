import type { NextRequest } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// A SMALL SPEED LIMIT for the public forms. It counts requests per key (an
// address, or an address plus an email) in a fixed window and says when a key
// has had its share.
//
// In memory, so it is per server instance: it will not stop a botnet, but it
// stops one person or one script hammering a form, which is what these routes
// need (the admin sign-in mail, the waitlist mail, referral-code guessing).
// The door password has its own, stricter counter in lib/door-auth.ts.
// ─────────────────────────────────────────────────────────────────────────────

const hits = new Map<string, { n: number; until: number }>()

/** The caller's address as Vercel reports it. */
export function clientIp(req: NextRequest): string {
  return (req.headers.get('x-real-ip') ?? (req.headers.get('x-forwarded-for') ?? '').split(',').pop() ?? '').trim() || 'unknown'
}

/** Counts one request for `key`; true when the key is over `max` in `windowMs`. */
export function overLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  if (hits.size > 5000) for (const [k, v] of hits) if (v.until < now) hits.delete(k)
  const h = hits.get(key)
  if (!h || h.until < now) { hits.set(key, { n: 1, until: now + windowMs }); return false }
  h.n += 1
  return h.n > max
}
