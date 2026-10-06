import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

// ─────────────────────────────────────────────────────────────────────────────
// THE DOOR TEAM. Amavi staff and volunteers open /door and type ONE shared
// password (DOOR_PASSWORD in Vercel). That unlocks the ticket scanner and
// nothing else: no guest list, no emails, no money, no admin.
//
// The cookie is signed with ADMIN_SECRET and tied to the password itself, so
// CHANGING DOOR_PASSWORD SIGNS EVERY DOOR PHONE OUT at once. Do that after the
// event, or the moment the password leaks. Unset = the door page is closed.
// ─────────────────────────────────────────────────────────────────────────────

export const DOOR_COOKIE = 'udoor'
export const DOOR_MS = 3 * 24 * 60 * 60 * 1000

const pwHash = (pw: string) => createHash('sha256').update(`door:${pw}`).digest('base64url').slice(0, 16)

function sign(body: string): string {
  return createHmac('sha256', process.env.ADMIN_SECRET as string).update(`door:${body}`).digest('base64url')
}

export const doorConfigured = () => !!(process.env.DOOR_PASSWORD && process.env.ADMIN_SECRET)

export function checkPassword(input: string): boolean {
  const want = process.env.DOOR_PASSWORD
  if (!want) return false
  const a = createHash('sha256').update(String(input).trim()).digest()
  const b = createHash('sha256').update(want.trim()).digest()
  return timingSafeEqual(a, b)
}

export function makeDoorToken(): string {
  const body = Buffer.from(JSON.stringify({ x: Date.now() + DOOR_MS, p: pwHash(process.env.DOOR_PASSWORD as string) })).toString('base64url')
  return `${body}.${sign(body)}`
}

function readDoorToken(token: string | undefined): boolean {
  if (!token || !doorConfigured()) return false
  const [body, sig] = token.split('.')
  if (!body || !sig) return false
  const a = Buffer.from(sign(body)), b = Buffer.from(sig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false
  try {
    const d = JSON.parse(Buffer.from(body, 'base64url').toString()) as { x: number; p: string }
    return d.x > Date.now() && d.p === pwHash(process.env.DOOR_PASSWORD as string)
  } catch { return false }
}

export async function isDoorStaff(): Promise<boolean> {
  return readDoorToken((await cookies()).get(DOOR_COOKIE)?.value)
}

// A wrong password is slowed down per address. In memory, so it is per
// server instance: enough to stop someone guessing by hand at the door.
const tries = new Map<string, { n: number; until: number }>()
export function throttled(ip: string): boolean {
  const t = tries.get(ip)
  return !!t && t.n >= 8 && t.until > Date.now()
}
export function noteFailure(ip: string) {
  const t = tries.get(ip)
  const fresh = !t || t.until < Date.now()
  tries.set(ip, { n: fresh ? 1 : t!.n + 1, until: Date.now() + 15 * 60 * 1000 })
}
export const clearFailures = (ip: string) => tries.delete(ip)
