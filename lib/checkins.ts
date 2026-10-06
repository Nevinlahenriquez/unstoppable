import { put, list, del } from '@vercel/blob'
import { storeReady } from './store'

// ─────────────────────────────────────────────────────────────────────────────
// WHO IS THROUGH THE DOOR. One file per used seat in the private Blob store:
//
//   checkins/<payment id>/<seat>.json
//
// A seat is claimed with a CREATE-ONLY write (allowOverwrite: false). The store
// refuses a second write to the same path, so when two door phones scan the
// same seat at the same moment exactly one of them gets "Welcome in" and the
// other gets "Already in". That is the whole guarantee; nothing here does a
// read-then-write. The count on the Stripe payment (checked_in_n) is only a
// copy for the admin list; these files are the truth.
// ─────────────────────────────────────────────────────────────────────────────

const dir = (id: string) => `checkins/${id}/`
const path = (id: string, seat: number) => `${dir(id)}${seat}.json`

/** seat -> ISO time it was used, for every used seat of this order. */
export async function usedSeats(id: string): Promise<Map<number, string>> {
  const out = new Map<number, string>()
  if (!storeReady()) return out
  const res = await list({ prefix: dir(id), limit: 100 })
  for (const b of res.blobs) {
    const n = Number(b.pathname.slice(dir(id).length).replace(/\.json$/, ''))
    if (Number.isInteger(n) && n > 0) out.set(n, new Date(b.uploadedAt).toISOString())
  }
  return out
}

export type Claim = { ok: true; at: string } | { ok: false; already: true; at: string } | { ok: false; already: false; error: string }

/** Uses one seat. Succeeds for exactly one caller, however many scan it at once. */
export async function claimSeat(id: string, seat: number, by: string): Promise<Claim> {
  if (!storeReady()) return { ok: false, already: false, error: 'The check-in list is not connected. Tell the hosts.' }
  const at = new Date().toISOString()
  try {
    await put(path(id, seat), JSON.stringify({ at, by }), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/json',
    })
    return { ok: true, at }
  } catch (err) {
    // Refused: either somebody already used the seat, or the store hiccuped.
    // Only a file that is really there counts as "already in".
    const used = await usedSeats(id).catch(() => null)
    const prev = used?.get(seat)
    if (prev) return { ok: false, already: true, at: prev }
    console.error('[unstoppable] check-in write failed', err)
    return { ok: false, already: false, error: 'Could not save the check-in. Scan again.' }
  }
}

/** Frees every seat of an order (the hosts' Undo in /admin). */
export async function releaseSeats(id: string): Promise<void> {
  if (!storeReady()) return
  const res = await list({ prefix: dir(id), limit: 100 })
  if (res.blobs.length) await del(res.blobs.map(b => b.url))
}
