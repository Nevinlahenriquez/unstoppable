// ─────────────────────────────────────────────────────────────────────────────
// THE SWITCH AND THE ACCOUNT. Everything about who takes the money lives in
// environment variables, so swapping the Stripe account (for example to a
// local Bali company) is a change in Vercel, never a code change.
//
//   TICKET_SALES_OPEN=true               nothing can be bought until this is set
//   STRIPE_SECRET_KEY                     the selling account's secret key
//   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    the SAME account's publishable key
//   SEATS_SOLD_ELSEWHERE                  tickets sold outside this account
//                                         (an older account, cash, comps), so
//                                         the 60-seat counter stays true after
//                                         a switch. Optional, default 0.
//
// ⚠️ The two Stripe keys must come from the same account. A secret key from
// one account and a publishable key from another fails at the payment form.
// ─────────────────────────────────────────────────────────────────────────────

export function salesOpen(): boolean {
  return process.env.TICKET_SALES_OPEN === 'true' && !!process.env.STRIPE_SECRET_KEY
}

export function seatsSoldElsewhere(): number {
  const n = parseInt(process.env.SEATS_SOLD_ELSEWHERE ?? '0', 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const SALES_CLOSED_MESSAGE = 'Ticket sales open very soon.'
