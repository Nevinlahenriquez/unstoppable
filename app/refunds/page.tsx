import type { Metadata } from 'next'
import { EVENT, LEGAL, dateLabel, refundCutoffLabel, sellerLabel } from '../config'
import { LegalPage } from '../../components/LegalPage'

export const metadata: Metadata = { title: `Refund policy · ${EVENT.name}`, alternates: { canonical: '/refunds' } }

export default function Refunds() {
  return (
    <LegalPage
      title="Refund policy"
      intro={`Plain and simple: if you cannot make it, tell us early and you get your money back. This policy covers every ticket for ${EVENT.name} on ${dateLabel()}, sold by ${sellerLabel()}.`}
      sections={[
        { h: 'Full refund until two weeks before', p: [
          `You can cancel for a full refund up to and including ${refundCutoffLabel()}, which is ${LEGAL.refundDays} days before the event. Email us from the address you booked with and we refund the full amount to the card you paid with.`,
          'Stripe usually shows the refund on your statement within 5 to 10 working days.',
        ] },
        { h: 'After that, pass your seat on', p: [
          `From ${LEGAL.refundDays - 1} days before the event, tickets are not refundable. You can still give your seat to someone else at no cost: email us their name and email before the day and we send the ticket in their name.`,
        ] },
        { h: 'If we cancel or move the event', p: [
          'If the event is cancelled, you get a full refund automatically.',
          'If it moves to another date or venue, your ticket stays valid for the new date. If the new date does not work for you, you can ask for a full refund instead.',
        ] },
        { h: 'Group and discounted tickets', p: [
          'Group deals and friend discounts are refunded at what you actually paid. If one person in a group order cancels, we refund their share of the order.',
        ] },
        { h: 'What a refund does to the ticket', p: [
          'A refunded ticket is cancelled straight away. Its QR code no longer opens the door, so please do not pass on a ticket you have been refunded for.',
        ] },
        { h: 'How to ask', p: [
          `Email ${EVENT.contactEmail} with your name and the email you booked with.`,
        ] },
      ]}
    />
  )
}
