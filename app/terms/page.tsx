import type { Metadata } from 'next'
import Link from 'next/link'
import { EVENT, VENUE, MAX_PER_ORDER, dateLabel, sellerLabel } from '../config'
import { LegalPage } from '../../components/LegalPage'

export const metadata: Metadata = { title: `Terms · ${EVENT.name}`, alternates: { canonical: '/terms' } }

export default function Terms() {
  return (
    <LegalPage
      title="Terms"
      intro={`These terms apply when you buy a ticket for ${EVENT.name}, a one-day live event at ${VENUE.name}, ${VENUE.area}, on ${dateLabel()}. Tickets are sold by ${sellerLabel()} ("we", "us"). By paying you agree to them.`}
      sections={[
        { h: 'Your ticket', p: [
          `Each ticket is one seat for one person for the full day. You can buy up to ${MAX_PER_ORDER} tickets in one order. Every seat gets its own QR code, sent by email, and each code opens the door once.`,
          'Keep your codes to yourself. Whoever shows a code first gets in, so we cannot let a second person in on a code that has already been scanned.',
          'Prices are in US dollars and include everything listed on the event page. Payment is taken by Stripe at the moment you book.',
        ] },
        { h: 'Refunds and transfers', p: [
          <>Our <Link href="/refunds">refund policy</Link> explains when you can get your money back and how to pass your seat to someone else.</>,
        ] },
        { h: 'On the day', p: [
          'Doors, times and arrival details are sent by email before the event. If you arrive late we will let you in at a natural break.',
          'Please treat the other guests, the hosts and the Amavi team with respect. We can ask anyone who disrupts the day or makes others unsafe to leave, without a refund.',
        ] },
        { h: 'The hypnosis and visualisation sessions', p: [
          'The day includes guided hypnosis and visualisation led by Luke Anning. You stay aware and in control the whole time and you can stop or sit out at any moment.',
          `These sessions are for personal growth. They are not medical or psychological treatment and do not replace it. If you have epilepsy, a serious mental health condition, or you are pregnant, please email ${EVENT.contactEmail} before booking so we can talk it through.`,
        ] },
        { h: 'Photos and filming', p: [
          'Parts of the day are photographed and filmed, and we may use that material to share and promote the event and future events. If you would rather not appear, tell us at the door and we will keep you out of it.',
        ] },
        { h: 'Changes to the programme', p: [
          'We may adjust the order or content of the day, or replace a session, if something outside our control requires it. If a change is big enough that the event is cancelled or moved, the refund policy applies.',
        ] },
        { h: 'Your responsibility', p: [
          'You take part at your own risk and you are responsible for your own belongings, travel and accommodation. Nothing in these terms limits any right you have under the consumer law that applies to you.',
          'Our liability to you is limited to the price you paid for your ticket, except where the law does not allow that limit.',
        ] },
        { h: 'Questions or complaints', p: [
          `Email ${EVENT.contactEmail}. We would always rather hear about a problem and fix it.`,
        ] },
      ]}
    />
  )
}
