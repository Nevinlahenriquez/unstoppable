// ─────────────────────────────────────────────────────────────────────────────
// I AM UNSTOPPABLE (Vision & Voice) · every fact about the event lives in this file.
//
// A one-day live event in Bali, hosted by Luke (hypnotherapist) and Nevin
// Henriquez (speaker and coach), at Amavi. Change a date, a price or a bio
// HERE and the page, the checkout and the thank-you page all follow.
//
//
// ⚠️ "TBC" is deliberate. Anything not yet decided is left EMPTY and the page
// says "to be announced" rather than printing a date nobody has agreed to.
// ─────────────────────────────────────────────────────────────────────────────

export const EVENT = {
  /** The name on the door. Named for the RESULT, not the method. Alternatives in README.md. */
  name: 'I Am Unstoppable',
  /** Luke's half and Nevin's half, in one line. (First called "Vision & Voice".) */
  subtitle: 'Rewire Your Beliefs. Release Your Voice.',
  /** Three beats, the whole promise. */
  promise: ['See it.', 'Say it.', 'Become it.'],
  tagline: 'One day in Bali to see the future you are building with total clarity, speak it so people say yes, and walk out unstoppable.',
  intro:
    'A live, in-person day for people who are done thinking small. In the morning Luke takes you inward: vision, mindset and guided visualisation, so your goals come from who you really are. In the afternoon Nevin brings it out: how you speak, how you show up, and how you hold a room. Around all of it, this is a networking day: guided circles and shared food, so you leave with real relationships.',
  city: 'Bali',
  /** YYYY-MM-DD. Leave '' until it is confirmed: the page then says "Date to be announced". */
  dateISO: '2026-10-23',
  /** 24h, Bali time. Leave '' until confirmed. */
  startTime: '10:00',
  endTime: '17:00',
  timeZoneLabel: 'Bali time (WITA)',
  /** Total seats. Stated on the page, so it must stay true. */
  seats: 60,
  currency: 'usd',
  /** Shown in the footer and used for questions. */
  contactEmail: 'connect@optimizeyourvibe.com',
} as const

export const VENUE = {
  name: 'Amavi',
  area: 'Canggu, Bali',
  /** Leave '' until confirmed; the page says the address is sent with your ticket. */
  address: '',
  /** A Google Maps link, once confirmed. */
  mapsUrl: 'https://maps.app.goo.gl/EtPS2rLwKU9ZkBNZ9',
  /** The collaboration line. Amavi is a PARTNER of this event, not just the room. */
  partnerLine: 'In collaboration with Amavi',
  description:
    'This day is built together with Amavi, one of the most beautiful spaces on the island. They are not just the room: they are our partner in it. Open, calm and full of light, with the food served right there, it is a space made for a day like this. The full address and arrival details are sent with your ticket.',
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKETS. The price charged is read from THIS list on the SERVER
// (checkout/route.ts). The browser only ever sends a tier id, never a price.
// ─────────────────────────────────────────────────────────────────────────────
export interface Tier {
  id: 'early' | 'late'
  name: string
  /** Whole US dollars. */
  price: number
  blurb: string
  /** YYYY-MM-DD, last day this tier can be bought. '' = no end date yet. */
  endsOn: string
  /** Seats at this price. The tier closes when they are gone OR on endsOn, whichever is first. */
  seats?: number
}

export const TIERS: Tier[] = [
  {
    id: 'early',
    name: 'Early bird',
    price: 150,
    blurb: 'The first 30 seats, at the lowest price they will be.',
    // ⚠️ SET THIS once the event date is fixed. Until then early bird stays open.
    endsOn: '2026-10-16',
    seats: 30,
  },
  {
    id: 'late',
    name: 'Late bird',
    price: 200,
    blurb: 'Your seat once early bird has closed.',
    endsOn: '',
  },
]

// Short list, printed on each ticket card.
export const INCLUDED = [
  'Live hypnosis session with Luke',
  'Two professional speakers, a full day',
  'Breakout groups and networking session',
  'Top-level catering by Amavi',
  'Your workbook, pen and every material',
]

// The full breakdown, printed above the tickets. ⚠️ Only list what is really
// in the ticket. Food is confirmed (3 Oct). Drinks and recordings are NOT
// listed until they are confirmed too.
export const INCLUDED_DETAIL = [
  { icon: 'sparkles', title: 'Live hypnosis session', text: 'Luke takes the whole room under, live.' },
  { icon: 'mic', title: 'Two pro speakers', text: 'Luke Anning and Nevin Henriquez, all day.' },
  { icon: 'eye', title: 'Vision and goals', text: 'Set from within, on paper, before you leave.' },
  { icon: 'users', title: 'Breakout groups', text: 'Small groups, real work, real feedback.' },
  { icon: 'utensils', title: 'Catering by Amavi', text: 'A top-level catered break, included.' },
  { icon: 'book', title: 'Workbook and pen', text: 'Every material you need, in your hands.' },
  { icon: 'flame', title: 'On your feet', text: 'You speak. In front of people. With feedback.' },
  { icon: 'crown', title: 'Networking session', text: 'We close the day connecting the room.' },
]

// THE GOALS OF THE DAY: what a guest should walk out with. This is the promise
// the page makes, so keep it to things the day actually delivers.
export const OUTCOMES = [
  { n: '01', icon: 'eye', title: 'Total clarity', text: 'You see the life you are building, in detail.' },
  { n: '02', icon: 'target', title: 'Goals that pull you', text: 'Bold, visual, and truly yours.' },
  { n: '03', icon: 'mic', title: 'A voice that moves people', text: 'Proven on your feet, in front of a room.' },
  { n: '04', icon: 'users', title: 'Your people', text: 'Real connections with builders like you.' },
]

// THE BREAKTHROUGH: who walks in, and who walks out. ⚠️ The right-hand column
// is the promise of the page, so it must stay something the day delivers.
export const SHIFT = [
  { before: 'A vague sense you are meant for more', after: 'A vision so clear you can see it and feel it' },
  { before: 'Goals that feel like homework', after: 'Goals that pull you out of bed' },
  { before: 'Freezing, rambling or playing small', after: 'Speaking with presence, in front of a room' },
  { before: 'Building alone', after: 'A room of people who are building too' },
]

// Why the two of you are doing this. ⚠️ A draft in your joint voice: Luke and
// Nevin should rewrite it in their own words, it is the most personal line on
// the page.
export const MISSION = {
  quote: 'Most people work on the inside or the outside. The vision in their head never makes it out loud, or they speak well about a life they have not really chosen. We built this day to do both in one room: see it clearly, then say it so it becomes real.',
  by: 'Luke & Nevin',
}

export const TRUST = [
  { k: '550+', v: 'live rooms Nevin has spoken in' },
  { k: '200+', v: 'businesses Nevin has worked with' },
  { k: '60', v: 'seats, and no more' },
  { k: '1', v: 'day that changes how you show up' },
]

/**
 * Is this tier still on sale? Checked on the page AND on the server.
 * `tierLeft` is the per-tier seat count from seats.ts; without it only the
 * date is checked.
 */
export function tierOpen(t: Tier, now = new Date(), tierLeft?: Record<string, number>): boolean {
  if (t.seats && tierLeft && (tierLeft[t.id] ?? t.seats) <= 0) return false
  if (!t.endsOn) return true
  return now.getTime() <= new Date(`${t.endsOn}T23:59:59+08:00`).getTime()
}

/**
 * The tier for sale right now. Early bird while it is open, late bird after,
 * so the two are never on sale at once and nobody pays $200 on a day $150 was
 * still available.
 */
export function currentTier(now = new Date(), tierLeft?: Record<string, number>): Tier {
  return TIERS.find(t => tierOpen(t, now, tierLeft)) ?? TIERS[TIERS.length - 1]
}

/** Most tickets one order can buy. Read by the page AND the checkout. */
export const MAX_PER_ORDER = 6

export function getTier(id: string): Tier | null {
  return TIERS.find(t => t.id === id) ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKERS. Luke's bio is written from his own Instagram (@iamlukeanning,
// "The Anti Sabotage Coach"); worth Luke reading it once and adjusting.
// ─────────────────────────────────────────────────────────────────────────────
export interface Speaker {
  name: string
  role: string
  half: string
  bio: string
  /** Static import in the page; null shows initials. */
  photo: 'nevin' | 'luke' | null
  initials: string
}

export const SPEAKERS: Speaker[] = [
  {
    name: 'Luke Anning',
    role: 'The Anti-Sabotage Coach · Hypnotherapist',
    half: 'The inner world',
    bio: 'Hypnotherapist and coach who helps founders stop getting in their own way. He leads the live hypnosis and the vision work.',
    photo: 'luke',
    initials: 'LA',
  },
  {
    name: 'Nevin Henriquez',
    role: 'Speaker and coach',
    half: 'The outer expression',
    bio: 'Speaker in 550+ live rooms across the Caribbean, Latin America and Europe. He gets you on your feet and holding a room.',
    photo: 'nevin',
    initials: 'NH',
  },
]

// The shape of the day. Times are left out until the schedule is fixed.
export const FLOW = [
  { icon: 'coffee', label: 'Arrive', title: 'Welcome', text: 'Your workbook, your pen, your first new faces.' },
  { icon: 'sparkles', label: 'Inner', title: 'Live hypnosis', text: 'Luke takes the room into your future, live.' },
  { icon: 'target', label: 'Inner', title: 'Vision and goals', text: 'Turn what you saw into goals that pull you.' },
  { icon: 'utensils', label: 'Break', title: 'Catered by Amavi', text: 'A top-level catered break, by our partner.' },
  { icon: 'users', label: 'Outer', title: 'Breakout groups', text: 'Small groups, real work, then share it.' },
  { icon: 'mic', label: 'Outer', title: 'Speak with power', text: 'Nevin on voice, presence and story. Then you speak.' },
  { icon: 'crown', label: 'Close', title: 'Networking session', text: 'We round off the day connecting the whole room.' },
]

export const FOR_YOU = [
  'You know you are meant for more and you are ready to see exactly what that is',
  'You set goals every year and they still feel small',
  'You freeze, ramble or play small when you have to speak',
  'You are building something and want to meet people who are too',
]

export const FAQ = [
  { q: 'What is included in the ticket?', a: 'The full day with two professional speakers, a live hypnosis session, the vision and goal work, breakout groups, public speaking practice, a top-level catered break by Amavi, a closing networking session, and your workbook, pen and every material.' },
  { q: 'Is hypnotherapy safe? Will I lose control?', a: 'Guided visualisation is a relaxed, focused state, and you stay aware and in charge the whole time. You can open your eyes whenever you like. Nothing is done to you without you.' },
  { q: 'I am nervous about speaking. Is this for me?', a: 'Yes, especially. Everything is done in small, guided steps. Nobody is pushed on a stage before they are ready.' },
  { q: 'Is this a networking event?', a: 'Yes, at its core. Guided networking circles run through the whole day, between every session and over food, so you meet everyone in the room properly, not just the person next to you.' },
  { q: 'Can I come on my own?', a: 'Most people do. The networking circles are designed so you meet everyone, starting from the first coffee.' },
  { q: 'Can I buy tickets for friends?', a: 'Yes. Choose up to 6 tickets in one order. Early bird is limited to the first 30 seats, so a group booking early saves the most.' },
  { q: 'How do I pay?', a: 'By card, Apple Pay or Google Pay, on a secure Stripe checkout. Your receipt arrives by email straight away.' },
  { q: 'What language is the event in?', a: 'English.' },
  { q: 'Where exactly is it?', a: 'At Amavi in Canggu, Bali. It is on Google Maps (the link is in the venue section), and arrival details are sent with your ticket.' },
]

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/**
 * A date, written by hand rather than by toLocaleDateString. The server (Node)
 * and the browser format the same locale differently ("Friday, 23 October"
 * vs "Friday 23 October"), and that difference is a React hydration error on
 * every page view. One fixed format, identical everywhere.
 */
export function formatDate(iso: string, opts: { weekday?: boolean; year?: boolean } = {}): string {
  const d = new Date(`${iso}T12:00:00Z`)
  const day = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
  return `${opts.weekday ? `${WEEKDAYS[d.getUTCDay()]} ` : ''}${day}${opts.year ? ` ${d.getUTCFullYear()}` : ''}`
}

/** "Friday 23 October 2026", or the honest fallback. */
export function dateLabel(): string {
  if (!EVENT.dateISO) return 'Date to be announced'
  return formatDate(EVENT.dateISO, { weekday: true, year: true })
}

export function timeLabel(): string {
  if (!EVENT.startTime) return 'Full day, times to follow'
  return `${EVENT.startTime}${EVENT.endTime ? `–${EVENT.endTime}` : ''} ${EVENT.timeZoneLabel}`
}

export function money(n: number): string {
  return `$${n}`
}
