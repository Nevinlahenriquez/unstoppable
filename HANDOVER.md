# Handover: I Am Unstoppable site (unstoppable.events)

Written 8 October 2026 for Luke Anning and his Claude, when the site moved
from Nevin Henriquez to Luke. Read this whole file first. README.md has the
file map and the full list of settings.

## What this is

The website and ticketing for **I Am Unstoppable** ("Rewire Your Beliefs.
Release Your Voice."), a one-day live event with Luke Anning and Nevin
Henriquez at Amavi, Canggu, Bali, on **Friday 23 October 2026, 10:00 to
17:00 WITA**. 60 seats. Early bird $150 (30 seats, or until 16 Oct), late bird
$200, group deal 3 seats for $400, up to 6 tickets per order.

- Next.js 16, React 19, TypeScript. Hosted on Vercel, domain unstoppable.events.
- **No database.** Stripe is the ledger of who paid. Guest details, check-ins,
  admins, invites, referrals and waitlist sign-ups live in a Vercel Blob store
  (`lib/store.ts`).
- Every event fact (date, venue, prices, hosts, FAQ) is in `app/config.ts`.
  Change it there and every page follows.

## Rules that must not be broken

1. **Ticket sales stay closed until the hosts say "open sales".** The switch is
   the Vercel variable `TICKET_SALES_OPEN` (`true` = selling). While closed, the
   booking form saves people to a waitlist instead of taking money.
2. **Never publish, email guests, or post anything without the hosts' OK on
   that exact message.** Test emails go to a host's own address only.
3. **Prices are set on the server** (`app/config.ts` via `app/checkout/route.ts`).
   Never let the browser send an amount.
4. **`EVENT_KEY` in `app/seats.ts` stays `vision-voice-bali`.** Every paid
   ticket in Stripe carries it and the seat counter reads it. Changing it hides
   every ticket already sold.
5. **Changing `ADMIN_SECRET` voids every ticket QR code** already sent. Do not
   rotate it after sales open.
6. Never print, paste or commit secret values. They live only in Vercel.
7. Copy style: plain words, no em dashes, never describe anyone's home island
   or background as poor.

## Pages

| Path | What it is |
| --- | --- |
| `/` | Landing page (`app/EventClient.tsx`), with a sticky buy bar on phones |
| `/tickets` | Booking page: details form, then Stripe's embedded payment form |
| `/thank-you` | Checks with Stripe that the buyer really paid, sends the confirmation |
| `/t/[code]` | A guest's ticket (QR code, one per seat, each scans once) |
| `/admin` | Hosts' dashboard: Overview, Guests (search, check-in, resend, CSV), Emails, Referrals, Team. Sign-in is an emailed link |
| `/admin/scan` | Hosts' QR scanner |
| `/door` | Door-staff scanner for Amavi staff, one shared password (`DOOR_PASSWORD`), shows name and seats only |
| `/api/cron/emails` | Hourly (vercel.json): reminder emails one week before, the day before and the morning of |
| `/api/health` | Private health check |

## Environment variables (names only; values are in Vercel)

| Name | Purpose |
| --- | --- |
| `TICKET_SALES_OPEN` | `true` to sell. Currently `false`. |
| `STRIPE_SECRET_KEY` | Secret key of the Stripe account that sells tickets (`sk_live_...` or a restricted `rk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key of the **same** Stripe account |
| `SEATS_SOLD_ELSEWHERE` | Seats sold outside this Stripe account, so the counter stays true |
| `NEXT_PUBLIC_SITE_URL` | Defaults to https://unstoppable.events |
| `ADMIN_EMAILS` | Comma-separated owner emails for /admin (owners can invite and remove admins) |
| `ADMIN_SECRET` | Signs admin links, cookies and ticket codes (see rule 5) |
| `DOOR_PASSWORD` | Door scanner password |
| `RESEND_API_KEY` | Send-only Resend key for updates.unstoppable.events |
| `EMAIL_FROM` | `I Am Unstoppable <hello@updates.unstoppable.events>` |
| `CRON_SECRET` | Lets Vercel run the hourly email job |
| `BLOB_READ_WRITE_TOKEN` | The Blob store (set automatically when the store is connected) |

## State on 8 October 2026

- **Sales are CLOSED.** The waitlist is collecting sign-ups.
- **Blocker before sales can open:** `STRIPE_SECRET_KEY` in Vercel holds a key
  *ID* (starts `mk_`), not a key, so Stripe rejects it and checkout fails. Put
  the real secret key of the selling Stripe account there (and its matching
  publishable key), redeploy, then set `TICKET_SALES_OPEN=true` and redeploy.
  Verify: /tickets shows "Continue to payment" and a seats-left counter, and the
  runtime logs show no "could not count seats" error.
- If the selling Stripe account changes to Luke's own, set both Stripe keys to
  that account and set `SEATS_SOLD_ELSEWHERE` to tickets already sold on the
  old one. In the new Stripe account: switch on Apple Pay and Google Pay, switch
  on receipt emails, and set the public business name buyers should see.
- **Open PR #4** (branch `claude/unstoppable-site-wmlbze`): draft Terms, Refund
  policy and Privacy pages, plus share card, icon and 404 page. Waiting on
  answers before merge: the refund rule (draft says full refund up to 14 days
  before the event), the legal seller name (`LEGAL.seller` in `app/config.ts`),
  the venue street address, and whether the event is 18+.
- Security to-dos in Vercel: use a restricted Stripe key, mark
  `BLOB_READ_WRITE_TOKEN` as sensitive, set a strong `DOOR_PASSWORD`, delete the
  leftover `SELFTEST_KEY` variable.

## After the move to Luke's Vercel team, check

1. The Blob store moved too (Vercel moves it separately from the project) and
   `BLOB_READ_WRITE_TOKEN` is still set. /admin shows a red banner if not.
2. The domain unstoppable.events and www point at the project (Settings → Domains).
3. The Git connection works: a push to `main` creates a production deployment.
4. The hourly cron appears under Settings → Cron Jobs.
5. `ADMIN_EMAILS` includes Luke's email.
6. Email still sends: /admin → Emails → send a test to your own address. The
   Resend account and the DNS records for updates.unstoppable.events stay
   wherever they were set up; moving Vercel does not move them.

## Working on it

    npm install
    cp .env.example .env.local   # fill in test values, never live ones
    npm run dev
    npm run typecheck && npm run build   # before every push

Push to a branch and open a pull request; merging to `main` deploys to
production automatically.
