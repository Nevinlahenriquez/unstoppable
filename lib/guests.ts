import Stripe from 'stripe'
import { EVENT_KEY } from '../app/seats'

// ─────────────────────────────────────────────────────────────────────────────
// GUESTS. There is no database on purpose: Stripe is the ledger. Every paid
// order is a succeeded PaymentIntent tagged event=EVENT_KEY, and everything we
// know about the buyer lives in that PaymentIntent's metadata:
//
//   name, email, phone, business, website, challenge, result   who they are
//   sent_confirmation, sent_d7, sent_d1, sent_day              emails sent (ISO time)
//   checked_in, checked_in_n                                    door check-in (first ISO time, seats in)
//
// The details are typed into Stripe's checkout form, so they arrive on the
// Checkout Session. syncGuest() copies them onto the PaymentIntent once, so the
// admin reads one list instead of sixty sessions.
//
// ⚠️ Metadata values are capped at 500 characters by Stripe; clip() keeps
// every write under that, or Stripe refuses the whole update.
// ─────────────────────────────────────────────────────────────────────────────

export type EmailStage = 'confirmation' | 'd7' | 'd1' | 'day' | 'after'
export const STAGES: EmailStage[] = ['confirmation', 'd7', 'd1', 'day', 'after']

export interface Guest {
  id: string
  createdAt: string
  tier: string
  qty: number
  amount: number
  currency: string
  name: string
  email: string
  phone: string
  business: string
  website: string
  challenge: string
  result: string
  ref: string
  /** Fully refunded in Stripe: not a ticket any more (no entry, no seat, no emails). */
  refunded: boolean
  checkedIn: string
  /** Seats of this order already through the door (one QR admits all its seats, one scan each). */
  checkedInCount: number
  sent: Partial<Record<EmailStage, string>>
}

export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  return key ? new Stripe(key) : null
}

const clip = (s: unknown, n = 480) => String(s ?? '').trim().slice(0, n)

/** Every read of a payment expands its charge, because that is where a refund shows. */
export const WITH_CHARGE = ['latest_charge']

/**
 * True when the money went back. A refund leaves the PaymentIntent "succeeded",
 * so the status alone still reads as paid; the charge says what was refunded.
 * A PARTIAL refund (a discount after the fact) keeps the ticket. Only a full one
 * cancels it. Unexpanded charge = cannot tell = treated as not refunded, which is
 * why every read here expands it.
 */
export function isRefunded(pi: Stripe.PaymentIntent): boolean {
  const c = pi.latest_charge
  if (!c || typeof c === 'string') return false
  return c.refunded || (c.amount_refunded > 0 && c.amount_refunded >= (c.amount_captured || c.amount))
}

export function toGuest(pi: Stripe.PaymentIntent): Guest {
  const m = pi.metadata ?? {}
  const sent: Guest['sent'] = {}
  for (const s of STAGES) if (m[`sent_${s}`]) sent[s] = m[`sent_${s}`]
  return {
    id: pi.id,
    createdAt: new Date(pi.created * 1000).toISOString(),
    tier: m.tier || '',
    qty: Math.max(1, parseInt(m.qty ?? '1', 10) || 1),
    amount: (pi.amount_received || pi.amount || 0) / 100,
    currency: pi.currency,
    name: m.name || '',
    email: m.email || pi.receipt_email || '',
    phone: m.phone || '',
    business: m.business || '',
    website: m.website || '',
    challenge: m.challenge || '',
    result: m.result || '',
    ref: m.ref || '',
    refunded: isRefunded(pi),
    checkedIn: m.checked_in || '',
    checkedInCount: m.checked_in_n ? parseInt(m.checked_in_n, 10) || 0 : m.checked_in ? Math.max(1, parseInt(m.qty ?? '1', 10) || 1) : 0,
    sent,
  }
}

/** Copies the buyer's details from the Checkout Session onto the PaymentIntent, once. */
export async function syncGuest(s: Stripe, pi: Stripe.PaymentIntent, session?: Stripe.Checkout.Session): Promise<Stripe.PaymentIntent> {
  if (pi.metadata?.synced === '1') return pi
  const cs = session ?? (await s.checkout.sessions.list({ payment_intent: pi.id, limit: 1 })).data[0]
  if (!cs) return pi
  const d = cs.customer_details
  const field = (k: string) => cs.custom_fields?.find(f => f.key === k)?.text?.value ?? ''
  return s.paymentIntents.update(pi.id, {
    expand: WITH_CHARGE,
    metadata: {
      synced: '1',
      name: clip(d?.individual_name || d?.name, 200),
      email: clip(d?.email, 200),
      phone: clip(d?.phone, 60),
      business: clip(d?.business_name, 200),
      website: clip(field('website'), 255),
      challenge: clip(field('challenge'), 255),
      result: clip(field('result'), 255),
    },
  })
}

/** Every paid, not refunded order for this event, newest first, with details synced. Null when Stripe is not connected. */
export async function listGuests(): Promise<Guest[] | null> {
  const s = stripe()
  if (!s) return null
  const out: Stripe.PaymentIntent[] = []
  let page: string | undefined
  for (let i = 0; i < 10; i++) {
    const res = await s.paymentIntents.search({
      query: `metadata['event']:'${EVENT_KEY}' AND status:'succeeded'`,
      limit: 100,
      expand: ['data.latest_charge'],
      ...(page ? { page } : {}),
    })
    out.push(...res.data.filter(pi => !isRefunded(pi)))
    if (!res.has_more || !res.next_page) break
    page = res.next_page
  }
  const synced = await Promise.all(out.map(pi => syncGuest(s, pi).catch(() => pi)))
  return synced.map(toGuest).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function setMeta(id: string, meta: Record<string, string>): Promise<Guest | null> {
  const s = stripe()
  if (!s || !/^pi_[A-Za-z0-9]+$/.test(id)) return null
  const pi = await s.paymentIntents.retrieve(id)
  if (pi.metadata?.event !== EVENT_KEY) return null
  return toGuest(await s.paymentIntents.update(id, { metadata: meta, expand: WITH_CHARGE }))
}

/** A paid order of this event (check .refunded before treating it as a ticket), or null. */
export async function getGuest(id: string): Promise<Guest | null> {
  const s = stripe()
  if (!s || !/^pi_[A-Za-z0-9]+$/.test(id)) return null
  const pi = await s.paymentIntents.retrieve(id, { expand: WITH_CHARGE })
  return pi.metadata?.event === EVENT_KEY && pi.status === 'succeeded' ? toGuest(pi) : null
}
