import { getJSON, listJSON, putJSON, removeJSON } from './store'

// ─────────────────────────────────────────────────────────────────────────────
// REFERRALS AND REGISTRATIONS.
//
// A referrer is somebody the hosts hand a personal link to:
//   https://unstoppable.events/?ref=MAYA
// The code rides along to the ticket form (also typeable there), lands on the
// registration and on the Stripe payment, and the admin counts it.
//
// THE REWARD RULE IS NOT DECIDED YET, so it is a setting, not code:
//   friendDiscount   dollars off EACH ticket for whoever uses a code (0 = none)
//   rewardPerTicket  dollars the referrer earns per paid ticket they brought
//   freeTicketAt     paid tickets after which the referrer's own seat is free (0 = off)
//   note             the rule in words, shown in the admin
// ─────────────────────────────────────────────────────────────────────────────

export interface Referrer { code: string; name: string; email: string; createdAt: string }

export interface ReferralSettings { friendDiscount: number; rewardPerTicket: number; freeTicketAt: number; note: string }

export const DEFAULT_SETTINGS: ReferralSettings = { friendDiscount: 0, rewardPerTicket: 0, freeTicketAt: 0, note: '' }

export interface Registration {
  id: string
  createdAt: string
  /** started = sent to payment, paid = Stripe confirmed, waitlist = sales were closed */
  status: 'started' | 'paid' | 'waitlist'
  tier: string
  qty: number
  name: string
  email: string
  phone: string
  business: string
  website: string
  challenge: string
  result: string
  ref: string
  paymentId?: string
  paidAt?: string
}

export const cleanCode = (s: unknown) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)

export async function getSettings(): Promise<ReferralSettings> {
  const s = await getJSON<Partial<ReferralSettings>>('settings/referral.json')
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) }
}
export const saveSettings = (s: ReferralSettings) => putJSON('settings/referral.json', s)

export const getReferrer = (code: string) => (cleanCode(code) ? getJSON<Referrer>(`referrers/${cleanCode(code)}.json`) : Promise.resolve(null))
export const listReferrers = () => listJSON<Referrer>('referrers/')
export const saveReferrer = (r: Referrer) => putJSON(`referrers/${r.code}.json`, r)
export const removeReferrer = (code: string) => removeJSON(`referrers/${cleanCode(code)}.json`)

export const getRegistration = (id: string) => (/^r_[a-z0-9]+$/.test(id) ? getJSON<Registration>(`registrations/${id}.json`) : Promise.resolve(null))
export const listRegistrations = () => listJSON<Registration>('registrations/')
export const saveRegistration = (r: Registration) => putJSON(`registrations/${r.id}.json`, r)

export const newId = () => 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
