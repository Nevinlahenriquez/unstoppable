import { getGuest, setMeta } from './guests'
import { isSample } from './ticket'
import { readTicket } from './ticket'

// One scan at the door: admits ONE seat of the paid order behind a QR code.
// Shared by the hosts' scanner (/admin/scan) and the door team's (/door).
// The answer carries only what the door needs to see: the name on the ticket,
// how many seats, and when it was first scanned. Never an email, a phone
// number or a payment amount.
//   ok        admitted now (seat N of qty)
//   already   every seat on this ticket is already in
//   invalid   not one of our tickets, or the order is not paid
export interface DoorGuest { name: string; qty: number; checkedInCount: number; checkedIn: string }
export interface AdmitResult { ok: boolean; status: 'ok' | 'already' | 'invalid' | 'error'; error?: string; seat?: number; guest?: DoorGuest }

const slim = (g: { name: string; qty: number; checkedInCount: number; checkedIn: string }): DoorGuest =>
  ({ name: g.name, qty: g.qty, checkedInCount: g.checkedInCount, checkedIn: g.checkedIn })

export async function admit(code: unknown): Promise<AdmitResult> {
  const id = readTicket(String(code ?? ''))
  if (!id) return { ok: false, status: 'invalid', error: 'This is not a valid ticket.' }
  if (isSample(id)) return { ok: false, status: 'invalid', error: 'This is the sample ticket from a test email. Not valid at the door.' }
  const g = await getGuest(id).catch(() => null)
  if (!g) return { ok: false, status: 'invalid', error: 'No paid order found for this ticket.' }
  if (g.checkedInCount >= g.qty) {
    return { ok: false, status: 'already', guest: slim(g), error: `Already checked in${g.qty > 1 ? ` (all ${g.qty} seats)` : ''}.` }
  }
  const n = g.checkedInCount + 1
  const saved = await setMeta(id, { checked_in: g.checkedIn || new Date().toISOString(), checked_in_n: String(n) }).catch(() => null)
  if (!saved) return { ok: false, status: 'error', error: 'Could not save the check-in. Scan again.' }
  return { ok: true, status: 'ok', guest: slim(saved), seat: n }
}
