import { put, get, list, del } from '@vercel/blob'

// ─────────────────────────────────────────────────────────────────────────────
// THE EVENT'S OWN DATA STORE. A private Vercel Blob store (unstoppable-data),
// connected to this project only, so nothing here touches the Optimize Your
// Vibe database. One small JSON file per record:
//
//   registrations/<id>.json   everyone who filled in the ticket form (paid or not)
//   referrers/<CODE>.json     the people with a referral link
//   settings/referral.json    the reward rule, edited in /admin
//
// Stripe is still the money ledger: a ticket counts only when Stripe says paid.
// The store holds what happens BEFORE payment (the form) and the referrals.
// Needs BLOB_READ_WRITE_TOKEN, which Vercel set when the store was connected.
// ─────────────────────────────────────────────────────────────────────────────

export const storeReady = () => !!process.env.BLOB_READ_WRITE_TOKEN

export async function putJSON(path: string, data: unknown): Promise<void> {
  await put(path, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  })
}

export async function getJSON<T>(path: string): Promise<T | null> {
  if (!storeReady()) return null
  try {
    const r = await get(path, { access: 'private', useCache: false })
    if (!r || !r.stream) return null
    const text = await new Response(r.stream).text()
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export async function listJSON<T>(prefix: string): Promise<T[]> {
  if (!storeReady()) return []
  const paths: string[] = []
  let cursor: string | undefined
  for (let i = 0; i < 20; i++) {
    const res = await list({ prefix, cursor, limit: 1000 })
    paths.push(...res.blobs.map(b => b.pathname))
    if (!res.hasMore || !res.cursor) break
    cursor = res.cursor
  }
  const rows = await Promise.all(paths.map(p => getJSON<T>(p)))
  return rows.filter((r): r is Awaited<T> => r != null) as T[]
}

export async function removeJSON(path: string): Promise<void> {
  await del(path)
}
