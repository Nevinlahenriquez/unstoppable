# I Am Unstoppable · unstoppable.events

The site for **I Am Unstoppable**, *Rewire Your Beliefs. Release Your Voice.*
A one-day live event with Luke Anning and Nevin Henriquez at Amavi, Canggu,
Bali, on 23 October 2026. 60 seats, early bird $150, late bird $200.

Moved here on 6 October 2026 from `app/unstoppable` in the Optimize Your Vibe
site, so the event has its own home, its own domain and its own Stripe account.

## Where things are

| File | What it is |
| --- | --- |
| `app/config.ts` | **Every fact**: name, date, times, venue, seats, prices, hosts, what is included, FAQ. Change it here and every page follows. |
| `app/EventClient.tsx` | The landing page (layout and styling). |
| `app/tickets/` | The branded booking page. Stripe's payment form sits inside it. |
| `app/checkout/route.ts` | Starts a Stripe payment. The price comes from `config.ts` on the server, never from the browser. |
| `app/thank-you/page.tsx` | Asks Stripe whether the buyer really paid before saying "you are in". |
| `app/seats.ts` | Counts tickets sold in Stripe, so the page can say how many seats are left and refuse an order past 60 (or past the 30 early-bird seats). |
| `app/sales.ts` | The on/off switch and the Stripe account, all from environment variables. |

## Settings (Vercel → Project → Settings → Environment Variables)

| Name | What it does |
| --- | --- |
| `TICKET_SALES_OPEN` | Must be `true` before anyone can pay. Anything else: the booking page says "Ticket sales open very soon." |
| `STRIPE_SECRET_KEY` | Secret key of the account that sells the tickets. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key of the **same** account. |
| `SEATS_SOLD_ELSEWHERE` | Optional. Tickets sold outside this Stripe account (an earlier account, cash, guests), so the seat counter stays true. |
| `NEXT_PUBLIC_SITE_URL` | Optional. Defaults to `https://unstoppable.events`. |

**Changing who sells the tickets** (for example a local Bali company): replace
the two Stripe keys in Vercel, set `SEATS_SOLD_ELSEWHERE` to the number already
sold on the old account, and redeploy. No code change.

⚠️ `EVENT_KEY` in `app/seats.ts` stays `vision-voice-bali`. Every paid ticket in
Stripe carries it, and the seat counter reads it. Changing it hides every
ticket already sold from the counter.

## In Stripe, once per account

- Settings → Payment methods: switch on Apple Pay and Google Pay.
- Settings → Emails: switch on receipts for successful payments.
- The account's **public business name** shows in the payment form's small print
  and on receipts. Set it to what buyers should see.

## Local

    npm install
    cp .env.example .env.local
    npm run dev

## Admin, guest details and emails (added 6 Oct 2026)

- **/admin** is the hosts' dashboard: Overview, Guests (search, check-in, resend, CSV) and Emails (preview, send a test, what was sent to whom). Sign-in is a link emailed to an address in `ADMIN_EMAILS`.
- **No database.** Stripe is the ledger. Checkout asks for name, email and phone (required) plus business name, website or Instagram, biggest challenge and the result wanted (optional); `lib/guests.ts` copies them onto the PaymentIntent's metadata.
- **/door** is the scanner for the door team (Amavi staff, volunteers): one shared password (`DOOR_PASSWORD`), and it can only check tickets. A scan shows the name and seats, never an email, phone or payment. Hosts can also scan from /admin/scan.
- **Guest emails** (`lib/emails.ts`): confirmation on payment (sent from the thank-you page), then one week before, the day before and the morning of. `/api/cron/emails` runs hourly and catches anything missed.

| Variable | What it does |
| --- | --- |
| `ADMIN_EMAILS` | Comma-separated emails that can open /admin |
| `ADMIN_SECRET` | Signs admin links, cookies and ticket codes (changing it voids every ticket) |
| `DOOR_PASSWORD` | One shared password for the door team at /door. Opens the scanner only. Changing it signs every door phone out |
| `RESEND_API_KEY` | Send-only key for updates.unstoppable.events |
| `EMAIL_FROM` | `I Am Unstoppable <hello@updates.unstoppable.events>` |
| `CRON_SECRET` | Lets Vercel run the hourly email job |
