import type { Metadata } from 'next'
import { EVENT, sellerLabel } from '../config'
import { LegalPage } from '../../components/LegalPage'

export const metadata: Metadata = { title: `Privacy · ${EVENT.name}`, alternates: { canonical: '/privacy' } }

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy"
      intro={`What we collect when you book ${EVENT.name}, why, and who else sees it. The organiser responsible for your data is ${sellerLabel()}.`}
      sections={[
        { h: 'What we collect', p: [
          'When you book or join the waiting list: your name, email and phone number, and the answers you choose to give about your business, your website, what you want from the day and any friend code you used.',
          'When you pay: Stripe handles your card. We never see or store your card number; we only see that the payment went through.',
          'On the day: when your ticket is scanned at the door, we record that it was used and when.',
        ] },
        { h: 'Why we use it', p: [
          'To give you your ticket, send your confirmation and reminders, let you in at the door, and run the day: knowing who is coming helps us plan the groups and the food.',
          'After the event we may email you about future events and programmes from the hosts. Every one of those emails has a way to stop them, or just reply and ask.',
        ] },
        { h: 'Who else sees it', p: [
          'We do not sell your data. A few services handle it for us so the site can work:',
          'Stripe (payments), Vercel (hosting the site and storing booking records) and Resend (sending emails). Each only uses your data to provide that service.',
          'The two hosts, Luke Anning and Nevin Henriquez, see the guest list. Our venue partner Amavi sees only what it needs to run the day, such as the number of guests.',
        ] },
        { h: 'How long we keep it', p: [
          'Payment records are kept as long as tax and accounting law requires. Your booking details are kept so we can invite you to future events, until you ask us to delete them.',
        ] },
        { h: 'Your rights', p: [
          `You can ask to see the data we hold about you, correct it, or have it deleted, and you can stop marketing emails at any time. Email ${EVENT.contactEmail} and we will sort it out.`,
        ] },
        { h: 'Cookies', p: [
          'This site uses no advertising or tracking cookies. The checkout and the ticket pages use the small amount of storage they need to work, such as remembering your ticket on your phone.',
        ] },
      ]}
    />
  )
}
