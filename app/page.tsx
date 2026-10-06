import type { Metadata } from 'next'
import EventClient from './EventClient'
import { EVENT, VENUE } from './config'
import { stock } from './seats'

// Re-read the seat count from Stripe at most once a minute.
export const revalidate = 60

const TITLE = `${EVENT.name} · ${EVENT.subtitle} One day in ${EVENT.city}`
const DESC = `See it. Say it. Become it. With Luke and Nevin Henriquez at ${VENUE.name}, ${VENUE.area}. Vision, guided visualisation and goal setting from within, then public speaking, networking circles and food included. ${EVENT.seats} seats.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/' },
  openGraph: { title: TITLE, description: DESC, siteName: EVENT.name, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
}

export default async function EventPage() {
  return <EventClient stock={await stock()} />
}
