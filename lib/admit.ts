import { getGuest, setMeta } from './guests'
import { isSample, readCode } from './ticket'
import { claimSeat, usedSeats } from './checkins'

// One scan at the door. Shared by the hosts' scanner (/admin/scan) and the door
// team's (/door). Every QR holds ONE seat, and that seat is admitted exactly
// once (lib/checkins.ts does the create-only write that makes it so, even when
// two phones scan at the same moment). An older order-level code, if anyone
// still shows one, admits the next free seat of that order.
// The answer carries only what the door needs to see: the name on the ticket,
// the seat, and when it was used. Never an email, a phone number or an amount.
//   ok        admitted now
//   already   this seat (or every seat of the order) was already used
//   invalid   not one of our tickets, or the order is not paid
export interface DoorGuest { name: string; qty: number; checkedInCount: number; checkedIn: string }
export interface AdmitResult { ok: boolean; status: 'ok' | 'already' | 'invalid' | 'error'; error?: string; seat?: number; guest?: DoorGuest }

const baliTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })

export async function admit(code: unknown, by = 'door'): Promise<AdmitResult> {
  const ref = readCode(String(code ?? ''))
  if (!ref) return { ok: false, status: 'invalid', error: 'This is not a valid ticket.' }
  if (isSample(ref.id)) return { ok: false, status: 'invalid', error: 'This is the sample ticket from a test email. Not valid at the door.' }
  const g = await getGuest(ref.id).catch(() => null)
  if (!g) return { ok: false, status: 'invalid', error: 'No paid order found for this ticket.' }
  if (g.refunded) return { ok: false, status: 'invalid', error: 'This ticket was refunded, so it is not valid.' }
  if (ref.seat != null && ref.seat > g.qty) return { ok: false, status: 'invalid', error: 'This seat is not part of the order.' }

  const used = await usedSeats(g.id).catch(() => new Map<number, string>())
  const view = (m: Map<number, string>, extra?: [number, string]): DoorGuest => {
    const all = new Map(m)
    if (extra) all.set(extra[0], extra[1])
    const times = [...all.values()].sort()
    return { name: g.name, qty: g.qty, checkedInCount: all.size, checkedIn: times[0] ?? '' }
  }

  const candidates = ref.seat != null ? [ref.seat] : Array.from({ length: g.qty }, (_, i) => i + 1).filter(n => !used.has(n))
  let lastAlready: { seat: number; at: string } | null = ref.seat != null && used.has(ref.seat) ? { seat: ref.seat, at: used.get(ref.seat)! } : null
  if (!lastAlready) {
    for (const seat of candidates) {
      const c = await claimSeat(g.id, seat, by)
      if (c.ok) {
        const guest = view(used, [seat, c.at])
        // Copy the count onto the Stripe payment for the admin list. Best effort:
        // the seat is already safely claimed whatever happens here.
        await setMeta(g.id, { checked_in: guest.checkedIn, checked_in_n: String(guest.checkedInCount) }).catch(() => null)
        return { ok: true, status: 'ok', seat, guest }
      }
      if (!c.already) return { ok: false, status: 'error', error: c.error }
      used.set(seat, c.at)
      lastAlready = { seat, at: c.at }
    }
  }
  const guest = view(used)
  if (ref.seat != null && lastAlready) {
    return { ok: false, status: 'already', seat: lastAlready.seat, guest: { ...guest, checkedIn: lastAlready.at }, error: `This ticket was already used at ${baliTime(lastAlready.at)} Bali time.` }
  }
  return { ok: false, status: 'already', guest, error: `Already checked in${g.qty > 1 ? ` (all ${g.qty} seats)` : ''}.` }
}
