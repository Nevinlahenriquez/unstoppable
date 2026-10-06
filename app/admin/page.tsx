import type { Metadata } from 'next'
import { currentAdmin } from '../../lib/admin-auth'
import { listGuests, STAGES, type Guest } from '../../lib/guests'
import { buildEmail, dueAt, STAGE_INFO } from '../../lib/emails'
import { EVENT, TIERS, dateLabel } from '../config'
import { salesOpen, seatsSoldElsewhere } from '../sales'
import AdminLogin from './AdminLogin'
import { storeReady } from '../../lib/store'
import { DEFAULT_SETTINGS, getSettings, listReferrers, listRegistrations, type Referrer, type Registration } from '../../lib/referrals'
import AdminClient, { type EmailCard } from './AdminClient'

// ─────────────────────────────────────────────────────────────────────────────
// /admin · the event dashboard for Nevin and Luke. Overview, the guest list
// and the emails, all read live from Stripe (the ledger) on every load.
// Modelled on the Events tab of the Optimize Your Vibe dashboard.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Admin · ${EVENT.name}`, robots: { index: false, follow: false } }

const fmt = (d: Date | null) =>
  d ? d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' Bali time' : ''

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const me = await currentAdmin()
  if (!me) {
    const { expired } = await searchParams
    return <AdminLogin expired={!!expired} configured={!!process.env.ADMIN_SECRET && !!process.env.ADMIN_EMAILS} />
  }

  let guests: Guest[] | null = null
  let loadError = ''
  try {
    guests = await listGuests()
  } catch (err) {
    console.error('[unstoppable] admin could not read guests', err)
    loadError = 'Stripe could not be reached just now. Refresh in a minute.'
  }

  let referrers: Referrer[] = []
  let registrations: Registration[] = []
  let settings = DEFAULT_SETTINGS
  try {
    ;[referrers, registrations, settings] = await Promise.all([listReferrers(), listRegistrations(), getSettings()])
  } catch (err) {
    console.error('[unstoppable] admin could not read the event store', err)
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://unstoppable.events'

  const emails: EmailCard[] = STAGES.map(s => ({
    stage: s,
    label: STAGE_INFO[s].label,
    when: STAGE_INFO[s].when,
    dueLabel: fmt(dueAt(s)),
    subject: buildEmail(s, { name: 'Alex', qty: 1, tier: 'early', result: 'Speak on a stage with total confidence' }).subject,
    html: buildEmail(s, { name: 'Alex', qty: 1, tier: 'early', result: 'Speak on a stage with total confidence' }).html,
  }))

  return (
    <AdminClient
      me={me}
      guests={guests}
      loadError={loadError}
      emails={emails}
      event={{ name: EVENT.name, date: dateLabel(), seats: EVENT.seats }}
      tiers={TIERS.map(t => ({ id: t.id, name: t.name, price: t.price, seats: t.seats ?? 0 }))}
      salesOpen={salesOpen()}
      stripeConnected={!!process.env.STRIPE_SECRET_KEY}
      emailReady={!!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM}
      soldElsewhere={seatsSoldElsewhere()}
      referrers={referrers}
      registrations={registrations}
      settings={settings}
      siteUrl={siteUrl}
      storeOk={storeReady()}
    />
  )
}
