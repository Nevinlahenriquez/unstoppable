import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { put } from '@vercel/blob'
import { getJSON, listJSON, putJSON, removeJSON, storeReady } from './store'

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ACCESS. Two kinds of admin:
//   OWNERS   the emails in ADMIN_EMAILS (Vercel). Always admins, and the only
//            ones who can invite or remove people.
//   ADDED    people an owner invited (Luke). Saved in the private Blob store as
//            admins/<hash of email>.json. Removing one in /admin locks them out
//            on their next page load, cookie or not.
// There is no password: you type your email, a sign-in link arrives (valid 15
// minutes), and the link sets a 30-day cookie. Tokens are signed with
// ADMIN_SECRET.
//
// INVITES. An owner makes a link in /admin -> Team. It works ONCE and for 7
// days. The person types their email, gets a confirm link AT that address
// (so a typo or a stranger cannot claim it), and opening it makes them an
// admin and signs them in. The invite is used up by a create-only write, so
// two clicks can never both claim it.
// ─────────────────────────────────────────────────────────────────────────────

export const COOKIE = 'uadm'
const LINK_MS = 15 * 60 * 1000
const JOIN_MS = 30 * 60 * 1000
export const SESSION_MS = 30 * 24 * 60 * 60 * 1000
export const INVITE_MS = 7 * 24 * 60 * 60 * 1000
export const INVITE_MAX_SENDS = 5

const norm = (e: string) => String(e ?? '').trim().toLowerCase()
export const validEmail = (e: string) => /^[^\s@<>"']{1,64}@[^\s@<>"']+\.[a-z]{2,}$/i.test(e) && e.length <= 200

export function ownerEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '').split(',').map(norm).filter(Boolean)
}
export const isOwner = (email: string) => ownerEmails().includes(norm(email))

// ── Added admins ────────────────────────────────────────────────────────────
export interface AddedAdmin { email: string; addedAt: string; addedBy: string }
const adminPath = (email: string) => `admins/${createHash('sha256').update(norm(email)).digest('hex').slice(0, 32)}.json`

export async function isAllowed(email: string): Promise<boolean> {
  const e = norm(email)
  if (!e) return false
  if (isOwner(e)) return true
  if (!storeReady()) return false
  const row = await getJSON<AddedAdmin>(adminPath(e))
  return !!row && norm(row.email) === e
}

export async function listAddedAdmins(): Promise<AddedAdmin[]> {
  const rows = await listJSON<AddedAdmin>('admins/')
  return rows.filter(r => !isOwner(r.email)).sort((a, b) => a.addedAt.localeCompare(b.addedAt))
}
export async function addAdmin(email: string, addedBy: string) {
  await putJSON(adminPath(email), { email: norm(email), addedAt: new Date().toISOString(), addedBy: norm(addedBy) } satisfies AddedAdmin)
}
export async function removeAdmin(email: string) {
  await removeJSON(adminPath(email)).catch(() => {})
}

// ── Signed tokens ───────────────────────────────────────────────────────────
function sign(payload: string): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET is not set')
  return createHmac('sha256', secret).update(payload).digest('base64url')
}
function sameSig(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

type Kind = 'link' | 'session' | 'join'
interface Payload { e: string; k: Kind; x: number; i?: string }

export function makeToken(email: string, kind: 'link' | 'session'): string {
  return encode({ e: norm(email), k: kind, x: Date.now() + (kind === 'link' ? LINK_MS : SESSION_MS) })
}
function encode(p: Payload) {
  const body = Buffer.from(JSON.stringify(p)).toString('base64url')
  return `${body}.${sign(body)}`
}
function decode(token: string | undefined | null, kind: Kind): Payload | null {
  if (!token || !process.env.ADMIN_SECRET) return null
  const [body, sig] = token.split('.')
  if (!body || !sig || !sameSig(sign(body), sig)) return null
  try {
    const d = JSON.parse(Buffer.from(body, 'base64url').toString()) as Payload
    return d.k === kind && d.x >= Date.now() && typeof d.e === 'string' ? d : null
  } catch { return null }
}

/** A sign-in or session token's email, if it is valid AND the email is still an admin. */
export async function readToken(token: string | undefined, kind: 'link' | 'session'): Promise<string | null> {
  const d = decode(token, kind)
  return d && (await isAllowed(d.e)) ? d.e : null
}

/** The signed-in admin's email, or null. */
export async function currentAdmin(): Promise<string | null> {
  const jar = await cookies()
  return readToken(jar.get(COOKIE)?.value, 'session')
}

// ── Invites ─────────────────────────────────────────────────────────────────
export interface Invite { id: string; by: string; createdAt: string; expiresAt: string; sends: number }
const invitePath = (id: string) => `admin-invites/${id}.json`
const usedPath = (id: string) => `admin-invites-used/${id}.json`

export const inviteCode = (id: string) => `${id}.${sign(`invite:${id}`).slice(0, 22)}`
export function readInviteCode(code: string): string | null {
  const [id, sig] = String(code ?? '').split('.')
  if (!id || !sig || !/^[A-Za-z0-9_-]{16,40}$/.test(id) || !process.env.ADMIN_SECRET) return null
  return sameSig(sign(`invite:${id}`).slice(0, 22), sig) ? id : null
}

export async function createInvite(by: string): Promise<Invite> {
  const now = Date.now()
  const inv: Invite = { id: randomBytes(16).toString('base64url'), by: norm(by), createdAt: new Date(now).toISOString(), expiresAt: new Date(now + INVITE_MS).toISOString(), sends: 0 }
  await putJSON(invitePath(inv.id), inv)
  return inv
}
/** An invite that can still be used, or null (unknown, revoked, expired or used). */
export async function openInvite(id: string): Promise<Invite | null> {
  const inv = await getJSON<Invite>(invitePath(id))
  return inv && Date.parse(inv.expiresAt) > Date.now() ? inv : null
}
export async function listInvites(): Promise<Invite[]> {
  const rows = await listJSON<Invite>('admin-invites/')
  const now = Date.now()
  // Expired ones are tidied away as they are noticed.
  await Promise.all(rows.filter(r => Date.parse(r.expiresAt) <= now).map(r => removeJSON(invitePath(r.id)).catch(() => {})))
  return rows.filter(r => Date.parse(r.expiresAt) > now).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
export async function revokeInvite(id: string) {
  await removeJSON(invitePath(id)).catch(() => {})
}
export async function countInviteSend(inv: Invite) {
  await putJSON(invitePath(inv.id), { ...inv, sends: inv.sends + 1 })
}

/** The confirm link emailed to the person joining. */
export const makeJoinToken = (email: string, inviteId: string) => encode({ e: norm(email), k: 'join', x: Date.now() + JOIN_MS, i: inviteId })
export function readJoinToken(token: string | null): { email: string; inviteId: string } | null {
  const d = decode(token, 'join')
  return d?.i ? { email: d.e, inviteId: d.i } : null
}

/** Uses the invite up. True for exactly one caller, however many click at once. */
export async function claimInvite(id: string, email: string): Promise<boolean> {
  try {
    await put(usedPath(id), JSON.stringify({ email: norm(email), at: new Date().toISOString() }), {
      access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json',
    })
  } catch { return false }
  await revokeInvite(id)
  return true
}
