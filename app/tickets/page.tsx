import type { Metadata } from 'next'
import TicketsClient from './TicketsClient'
import { EVENT, currentTier, getTier, tierOpen, MAX_PER_ORDER } from '../config'
import { stock } from '../seats'
import { salesOpen } from '../sales'

// The branded booking page: order summary on one side, Stripe's payment form
// embedded on the other, in the event's colours. Never a Stripe-hosted page.

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Tickets · ${EVENT.name}`, robots: { index: false, follow: false } }

export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ tier?: string; qty?: string }> }) {
  const sp = await searchParams
  const st = await stock()
  const now = new Date()
  // Whatever tier the link asked for, sell the one actually on sale now.
  const asked = getTier(String(sp.tier ?? ''))
  const tier = asked && tierOpen(asked, now, st?.tierLeft) ? asked : currentTier(now, st?.tierLeft)
  const qty = Math.min(MAX_PER_ORDER, Math.max(1, Math.floor(Number(sp.qty ?? 1)) || 1))
  return <TicketsClient tierId={tier.id} initialQty={qty} stock={st} open={salesOpen()} />
}
