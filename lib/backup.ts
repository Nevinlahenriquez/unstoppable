import { list } from '@vercel/blob'
import { putJSON, storeReady } from './store'
import type { Guest } from './guests'

// ─────────────────────────────────────────────────────────────────────────────
// BACKUP OF EVERY BUYER, outside Stripe. Stripe stays the ledger; this is the
// copy for the mailing list and outreach after the event. One file per paid
// order (guests/<payment id>.json), written on the thank-you page and filled
// in by the hourly cron for anyone it missed.
// ─────────────────────────────────────────────────────────────────────────────

const strip = (g: Guest) => ({ ...g, backedUpAt: new Date().toISOString() })

export async function backupGuest(g: Guest): Promise<void> {
  if (storeReady()) await putJSON(`guests/${g.id}.json`, strip(g))
}

/** Writes a backup for every paid guest that does not have one yet. */
export async function backupMissing(guests: Guest[]): Promise<number> {
  if (!storeReady() || !guests.length) return 0
  const have = new Set<string>()
  let cursor: string | undefined
  for (let i = 0; i < 20; i++) {
    const res = await list({ prefix: 'guests/', cursor, limit: 1000 })
    res.blobs.forEach(b => have.add(b.pathname))
    if (!res.hasMore || !res.cursor) break
    cursor = res.cursor
  }
  const missing = guests.filter(g => !have.has(`guests/${g.id}.json`))
  await Promise.all(missing.map(g => backupGuest(g).catch(err => console.error('[unstoppable] backup failed', g.id, err))))
  return missing.length
}
