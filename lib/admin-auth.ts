import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ACCESS. Only the emails in ADMIN_EMAILS (comma separated, Nevin and
// Luke) can open /admin. There is no password: you type your email, a sign-in
// link arrives (valid 15 minutes), and the link sets a 30-day cookie.
// Tokens are signed with ADMIN_SECRET. Removing an email from ADMIN_EMAILS
// locks that person out on their next page load, cookie or not.
// ─────────────────────────────────────────────────────────────────────────────

export const COOKIE = 'uadm'
const LINK_MS = 15 * 60 * 1000
export const SESSION_MS = 30 * 24 * 60 * 60 * 1000

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

export function isAllowed(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase())
}

function sign(payload: string): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET is not set')
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function makeToken(email: string, kind: 'link' | 'session'): string {
  const body = Buffer.from(JSON.stringify({ e: email.toLowerCase(), k: kind, x: Date.now() + (kind === 'link' ? LINK_MS : SESSION_MS) })).toString('base64url')
  return `${body}.${sign(body)}`
}

export function readToken(token: string | undefined, kind: 'link' | 'session'): string | null {
  if (!token || !process.env.ADMIN_SECRET) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const want = Buffer.from(sign(body))
  const got = Buffer.from(sig)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const d = JSON.parse(Buffer.from(body, 'base64url').toString()) as { e: string; k: string; x: number }
    if (d.k !== kind || d.x < Date.now() || !isAllowed(d.e)) return null
    return d.e
  } catch { return null }
}

/** The signed-in admin's email, or null. */
export async function currentAdmin(): Promise<string | null> {
  const jar = await cookies()
  return readToken(jar.get(COOKIE)?.value, 'session')
}
