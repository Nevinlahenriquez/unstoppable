import { EVENT, VENUE, INCLUDED, dateLabel, timeLabel, getTier } from '../app/config'
import type { EmailStage, Guest } from './guests'

// ─────────────────────────────────────────────────────────────────────────────
// GUEST EMAILS. Four automatic emails, sent through Resend from
// EMAIL_FROM (hello@updates.unstoppable.events):
//
//   confirmation  the moment the payment is confirmed
//   d7            one week before, 10:00 Bali time
//   d1            the day before, 10:00 Bali time
//   day           the morning of, 07:00 Bali time
//
// A reminder only goes to a guest who bought BEFORE it was due: somebody who
// buys two days out gets the confirmation, not a "one week to go".
// ⚠️ Keep every line true. Nothing here may promise what the day does not
// deliver (no recordings, no drinks, until config.ts says so).
// ─────────────────────────────────────────────────────────────────────────────

const BALI = '+08:00'

export const STAGE_INFO: Record<EmailStage, { label: string; when: string }> = {
  confirmation: { label: 'Ticket confirmation', when: 'Right after payment' },
  d7: { label: 'One week to go', when: '7 days before, 10:00 Bali time' },
  d1: { label: 'See you tomorrow', when: 'The day before, 10:00 Bali time' },
  day: { label: 'Today is the day', when: 'The morning of, 07:00 Bali time' },
  after: { label: 'Thank you (follow-up)', when: 'The day after, 10:00 Bali time' },
}

function eventDay(offsetDays: number, hhmm: string): Date | null {
  if (!EVENT.dateISO) return null
  const d = new Date(`${EVENT.dateISO}T${hhmm}:00${BALI}`)
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d
}

/** When each reminder is due. Null for the confirmation (it has no clock). */
export function dueAt(stage: EmailStage): Date | null {
  if (stage === 'd7') return eventDay(-7, '10:00')
  if (stage === 'd1') return eventDay(-1, '10:00')
  if (stage === 'day') return eventDay(0, '07:00')
  if (stage === 'after') return eventDay(1, '10:00')
  return null
}

export function eventEnd(): Date | null {
  return EVENT.dateISO ? new Date(`${EVENT.dateISO}T${EVENT.endTime || '23:59'}:00${BALI}`) : null
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function shell(heading: string, body: string): string {
  const where = `${VENUE.name}, ${VENUE.area}${VENUE.address ? ` · ${VENUE.address}` : ''}`
  return `<!doctype html><html><body style="margin:0;background:#000;padding:28px 12px;font-family:Inter,Helvetica,Arial,sans-serif;color:#fff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0D0C0A;border:1px solid rgba(227,174,69,.35);border-radius:6px">
<tr><td style="padding:34px 30px 8px">
<p style="margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#E3AE45">${esc(EVENT.name)} · ${esc(EVENT.city)}</p>
<h1 style="margin:0 0 18px;font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:30px;line-height:1.15;color:#fff">${heading}</h1>
${body}
</td></tr>
<tr><td style="padding:8px 30px 30px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(227,174,69,.25)">
<tr><td style="padding:16px 0 4px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8E8576;font-weight:700">When</td></tr>
<tr><td style="font-size:15px;font-weight:600;color:#fff">${esc(dateLabel())} · ${esc(timeLabel())}</td></tr>
<tr><td style="padding:14px 0 4px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8E8576;font-weight:700">Where</td></tr>
<tr><td style="font-size:15px;font-weight:600;color:#fff">${esc(where)}${VENUE.mapsUrl ? ` · <a href="${esc(VENUE.mapsUrl)}" style="color:#E3AE45">Open in Google Maps</a>` : ''}</td></tr>
</table>
<p style="margin:22px 0 0;font-size:13.5px;line-height:1.6;color:#8E8576">Questions? Just reply to this email or write to <a href="mailto:${esc(EVENT.contactEmail)}" style="color:#E3AE45">${esc(EVENT.contactEmail)}</a>.<br>Luke Anning and Nevin Henriquez</p>
</td></tr></table></td></tr></table></body></html>`
}

const p = (t: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#D9D2C5">${t}</p>`

function firstName(g: Pick<Guest, 'name'>) {
  return esc(g.name.split(' ')[0] || 'there')
}

export function buildEmail(stage: EmailStage, g: Pick<Guest, 'name' | 'qty' | 'tier' | 'result'>): { subject: string; html: string } {
  const n = firstName(g)
  const seats = g.qty > 1 ? `${g.qty} seats` : 'your seat'
  if (stage === 'confirmation') {
    const tier = getTier(g.tier)?.name
    const list = INCLUDED.map(i => `<li style="margin:0 0 6px">${esc(i)}</li>`).join('')
    return {
      subject: `You are in: ${EVENT.name}, ${dateLabel()}`,
      html: shell(`You are in, ${n}.`,
        p(`${g.qty > 1 ? `Your ${g.qty} ${tier ? esc(tier.toLowerCase()) + ' ' : ''}tickets are` : `Your ${tier ? esc(tier.toLowerCase()) + ' ' : ''}ticket is`} confirmed. Stripe sends the payment receipt separately.`) +
        p(`Here is what is waiting for you:`) +
        `<ul style="margin:0 0 18px;padding-left:20px;font-size:15.5px;line-height:1.5;color:#D9D2C5">${list}</ul>` +
        (g.result ? p(`You told us the result you want from the day: <em style="color:#fff">“${esc(g.result)}”</em>. We will hold you to it.`) : '') +
        p(`We will send a reminder a week before and again the day before, with everything you need for the day.`)),
    }
  }
  if (stage === 'd7') {
    return {
      subject: `One week to go: ${EVENT.name}`,
      html: shell(`One week, ${n}.`,
        p(`Seven days from now you walk into ${esc(VENUE.name)} for ${esc(EVENT.name)}.`) +
        p(`One thing to do this week: write down, in one sentence, the life you are building. Not the polished version, the true one. Bring it with you. Luke will take you deeper into it in the morning, and in the afternoon Nevin will have you say it out loud.`) +
        p(`Food, your workbook and a pen are all taken care of. Just bring yourself.`)),
    }
  }
  if (stage === 'd1') {
    return {
      subject: `Tomorrow: ${EVENT.name}`,
      html: shell(`See you tomorrow, ${n}.`,
        p(`Tomorrow is the day. We start at ${esc(EVENT.startTime || 'the morning')} Bali time, so give yourself time to arrive, park and settle in before the start.`) +
        p(`Come rested, wear something comfortable, and bring an open mind. Everything else (the workbook, the pen and the food) is ready for you.`) +
        p(`${seats === 'your seat' ? 'Your seat is' : `Your ${seats} are`} waiting.`)),
    }
  }
  if (stage === 'after') {
    return {
      subject: `Thank you, ${g.name.split(' ')[0] || 'friend'}: ${EVENT.name}`,
      html: shell(`Thank you, ${n}.`,
        p(`Thank you for being part of ${esc(EVENT.name)}. A room is only as strong as the people in it, and you made it what it was.`) +
        (g.result ? p(`Before the day you told us the result you wanted: <em style="color:#fff">“${esc(g.result)}”</em>. Keep that sentence where you will see it every morning this week.`) : '') +
        p(`One thing to do today: take the one sentence you said out loud and act on it once, however small. Momentum starts in the first 48 hours.`) +
        p(`Reply to this email and tell us your biggest takeaway. Luke and Nevin read every reply.`)),
    }
  }
  return {
    subject: `Today: ${EVENT.name}`,
    html: shell(`Today is the day, ${n}.`,
      p(`We open the doors at ${esc(VENUE.name)} and start at ${esc(EVENT.startTime || 'the morning')}. The map is below.`) +
      p(`See it. Say it. Become it. We will see you there.`)),
  }
}

/** Sends one email. The idempotency key stops a double send if two requests race. */
export async function sendEmail(to: string, subject: string, html: string, idempotencyKey?: string): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) return { ok: false, error: 'Email is not set up (RESEND_API_KEY or EMAIL_FROM missing).' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify({ from, to: [to], subject, html, reply_to: EVENT.contactEmail }),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      console.error('[unstoppable] resend refused', res.status, t)
      return { ok: false, error: `Resend refused the email (${res.status}).` }
    }
    return { ok: true }
  } catch (err) {
    console.error('[unstoppable] resend failed', err)
    return { ok: false, error: 'Could not reach Resend.' }
  }
}

/** Sent when somebody fills in the ticket form while sales are still closed. */
export function buildWaitlistEmail(name: string): { subject: string; html: string } {
  return {
    subject: `You are on the list for ${EVENT.name}`,
    html: shell(`You are on the list, ${esc(name.split(' ')[0] || 'there')}.`,
      p('Thank you for saving your spot. Seats open very soon and you will be among the first to hear, with the link to book.') +
      p('Want to come with a friend? Bring them along: the day is better shared.')),
  }
}
