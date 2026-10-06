import Stripe from 'stripe'
import { EVENT, TIERS, MAX_PER_ORDER } from './config'
import { seatsSoldElsewhere } from './sales'
import { isRefunded } from '../lib/guests'

// ─────────────────────────────────────────────────────────────────────────────
// SEATS. Stripe is the ticket ledger: every paid ticket is a succeeded
// PaymentIntent carrying metadata event + qty (set in checkout/route.ts). The
// page reads this to print "N seats left", and the checkout reads it to refuse
// an order that would go past EVENT.seats.
//
// ⚠️ Two buyers paying for the last seat in the same minute can both get
// through: the count is checked when checkout STARTS, not when it is paid.
// At 60 seats that is a refund email, not a crisis.
// ─────────────────────────────────────────────────────────────────────────────

// ⚠️ Kept from the first version of this page on optimizeyourvibe.com. It is
// the seat ledger key: change it and every ticket already sold stops counting.
export const EVENT_KEY = 'vision-voice-bali'
export { MAX_PER_ORDER }

export interface Stock {
  /** Seats left in the room. */
  left: number
  /** Seats left per tier that has its own cap (early bird: 30). */
  tierLeft: Record<string, number>
}

/** Sold tickets, total and per tier, or null if Stripe cannot be asked. */
export async function seatsSold(): Promise<{ total: number; byTier: Record<string, number> } | null> {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return null
  try {
    const stripe = new Stripe(secret)
    let total = 0
    const byTier: Record<string, number> = {}
    let page: string | undefined
    // Search pages are 100 deep; a 60-seat event needs one, the loop is a guard.
    for (let i = 0; i < 10; i++) {
      const res = await stripe.paymentIntents.search({
        query: `metadata['event']:'${EVENT_KEY}' AND status:'succeeded'`,
        limit: 100,
        expand: ['data.latest_charge'],
        ...(page ? { page } : {}),
      })
      // A fully refunded order gives its seats back.
      for (const pi of res.data.filter(p => !isRefunded(p))) {
        const q = Math.max(1, parseInt(pi.metadata?.qty ?? '1', 10) || 1)
        total += q
        const t = pi.metadata?.tier || 'unknown'
        byTier[t] = (byTier[t] ?? 0) + q
      }
      if (!res.has_more || !res.next_page) break
      page = res.next_page
    }
    return { total, byTier }
  } catch (err) {
    console.error('[unstoppable] could not count seats', err)
    return null
  }
}

/** What is left to sell, or null when it cannot be counted (the page then shows no counter). */
export async function stock(): Promise<Stock | null> {
  const sold = await seatsSold()
  if (!sold) return null
  const tierLeft: Record<string, number> = {}
  for (const t of TIERS) if (t.seats) tierLeft[t.id] = Math.max(0, t.seats - (sold.byTier[t.id] ?? 0))
  // Tickets sold outside this Stripe account still take a seat in the room.
  return { left: Math.max(0, EVENT.seats - sold.total - seatsSoldElsewhere()), tierLeft }
}
