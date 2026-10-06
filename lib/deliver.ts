import { buildEmail, dueAt, eventEnd, sendEmail } from './emails'
import { setMeta, STAGES, type EmailStage, type Guest } from './guests'

/** Sends one stage to one guest and records it on their order. `force` resends. */
export async function sendStage(g: Guest, stage: EmailStage, force = false): Promise<{ ok: boolean; error?: string }> {
  if (!g.email) return { ok: false, error: 'This guest has no email address.' }
  if (g.sent[stage] && !force) return { ok: true }
  const { subject, html } = buildEmail(stage, g)
  const key = force ? `${stage}-${g.id}-${Date.now()}` : `${stage}-${g.id}`
  const r = await sendEmail(g.email, subject, html, key)
  if (r.ok) await setMeta(g.id, { [`sent_${stage}`]: new Date().toISOString() }).catch(() => null)
  return r
}

/** Which emails a guest is owed right now. */
export function owed(g: Guest, now = new Date()): EmailStage[] {
  const end = eventEnd()
  const out: EmailStage[] = []
  for (const s of STAGES) {
    if (g.sent[s]) continue
    if (s === 'confirmation') { out.push(s); continue }
    const due = dueAt(s)
    if (!due || now < due || (end && now > end)) continue
    // Bought after this reminder was due: the confirmation already covers it.
    if (new Date(g.createdAt) >= due) continue
    out.push(s)
  }
  return out
}

/** The cron's job: every guest, every email they are owed. */
export async function deliverDue(guests: Guest[], now = new Date()) {
  const log: { id: string; stage: EmailStage; ok: boolean; error?: string }[] = []
  for (const g of guests) {
    for (const s of owed(g, now)) {
      const r = await sendStage(g, s)
      log.push({ id: g.id, stage: s, ...r })
    }
  }
  return log
}
