# Sacred Sampling Solutions — Mailer

Upload a list, write one email, and let it go out **on a set interval** — e.g.
*20 emails every 30 minutes* — instead of blasting the whole list at once.

Deploy as its **own** Vercel project, alongside `site/` (marketing) and
`portal/` (customer portal).

## How it works

1. **Upload a list** — a CSV or TSV. One column holds the addresses; every
   other column becomes a merge field.
2. **Create a campaign** — pick the list, set the From address, write the
   subject and body, and choose the pace: *N emails every X minutes/hours/days*.
3. **Press Start.** A queue row is created per recipient. From then on a cron
   job hits `/api/cron` every minute; each time a campaign's own clock comes
   due it releases exactly one batch and pushes its clock forward.

Nothing sends until you press Start, and pausing stops it mid-list.

### Why paced sending

A cold blast to a whole list is the fastest way to get a domain filtered.
Releasing a steady trickle looks like normal mail, keeps you inside your
provider's rate limits, and means a bad subject line burns 20 addresses instead
of 2,000 — you can pause after the first batch.

## Setup

### 1. Database

Run [`db/schema.sql`](db/schema.sql) in the Neon SQL Editor. The portal's Neon
project is fine — every table is prefixed `mail_`, so nothing collides.

### 2. Vercel project

Import this repo as a **new** project with **Root Directory = `mailer`**.
Framework auto-detects as Next.js.

### 3. Environment variables

| Variable | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | **yes** | Neon **pooled** connection string. |
| `MAILER_PIN` | **yes** | Unlocks the app. Nothing is reachable without it. |
| `RESEND_API_KEY` | to send | Resend API key. Without it you can draft but not send. |
| `CRON_SECRET` | to automate | Shared secret for `/api/cron`. **Without it the dispatcher is off** and campaigns only advance when you press *Send next batch now*. |
| `MAILER_BASE_URL` | recommended | Public URL of this app, e.g. `https://mail.sacredsamplingsolutions.com`. Unsubscribe links are built from it; it falls back to the Vercel-assigned URL. |
| `MAILER_POSTAL_ADDRESS` | recommended | Your physical mailing address, printed in every footer. **CAN-SPAM requires this.** |
| `MAILER_DEFAULT_FROM` | optional | Pre-fills the From field on the new-campaign form. |
| `UNSUBSCRIBE_SECRET` | optional | Signs unsubscribe links. Defaults to `MAILER_PIN` — set it separately if you ever rotate the PIN, or old links stop working. |

### 4. Verify your sending domain

Resend will only send from a domain you own and have verified. In Resend →
*Domains*, add `sacredsamplingsolutions.com` and publish the DKIM/SPF records it
gives you. Until that is done, every send fails with *domain not verified* —
which shows up per-address in the campaign's Activity table.

Set up **DMARC** at the same time. Gmail and Yahoo require SPF, DKIM and DMARC
for anyone sending in volume, and a missing DMARC record alone is enough to get
bulk mail rejected.

### 5. The dispatcher schedule

[`vercel.json`](vercel.json) registers `/api/cron` to run every minute. **Cron
frequency on Vercel depends on your plan** — Hobby projects are limited to
roughly one run per day, which is far too slow for minute- or hour-level
intervals. Two options:

- **Vercel Pro**, which allows the every-minute schedule already configured; or
- **any external scheduler** hitting
  `https://<your-app>/api/cron?key=<CRON_SECRET>` on whatever schedule you like
  (cron-job.org, EasyCron, a GitHub Action, an always-on box with `curl`).

The endpoint is safe to call as often as you want: it only acts when a
campaign's own interval has elapsed, so the schedule just needs to be *at least*
as frequent as your shortest interval. Calling it every minute while a campaign
sends hourly does nothing 59 times an hour.

## Writing the message

The body is plain text. These tokens are filled per recipient:

- `{{first_name}}` — first word of the name column, or the part of the address
  before the `@` if there is no name
- `{{name}}`, `{{email}}`
- **any other column from your CSV**, lowercased with spaces as underscores —
  a `City` column becomes `{{city}}`, `Last Order` becomes `{{last_order}}`

An unknown token renders as nothing rather than leaking `{{typo}}` into the
email. Tick *My message is already HTML* to paste your own markup instead.

Use **Send a test** before starting. It goes to one address, is not recorded
against the list, and arrives with a `[TEST]` subject prefix.

## Unsubscribes

Every email carries a signed unsubscribe link and the RFC 8058 one-click
headers, so Gmail and Outlook show their own native Unsubscribe button.

Opting out is **global and permanent**: the address goes into
`mail_suppressions`, is flagged on the contact, and is pulled from anything
still queued. Re-uploading a CSV that contains it will not resurrect it, and
future campaigns skip it automatically.

## Before you send to a real list

- **Only send to people who agreed to hear from you.** A purchased or scraped
  list will get the domain blocklisted, and that damage reaches the order
  receipts and result notifications the portal sends from the same domain.
  Consider sending from a subdomain (`mail.` or `news.`) to isolate the
  reputation of marketing mail from transactional mail.
- Set `MAILER_POSTAL_ADDRESS` — a real physical address is legally required.
- Start slow on a new domain. A few dozen a day for the first week, building up,
  beats a thousand on day one.
- Send yourself a test and read it on a phone before pressing Start.

## Operating notes

- **Failures are per-address.** One bad recipient is recorded with the
  provider's own error message and the rest of the batch still goes out. Fix the
  cause, then press *Retry N failed*.
- **Double sends are structurally impossible.** One queue row per contact per
  campaign, enforced by a unique constraint, and batches are claimed in a single
  atomic `UPDATE` — overlapping cron runs cannot pick up the same row.
- **Pausing is immediate.** A paused campaign is invisible to the dispatcher.
- A campaign marks itself `done` the moment its queue drains.

## Local development

```bash
cd mailer
npm install
cat > .env <<'ENV'
DATABASE_URL="<your Neon pooled URL>"
MAILER_PIN="1234"
CRON_SECRET="local-secret"
MAILER_BASE_URL="http://localhost:3000"
ENV
npm run dev            # http://localhost:3000
```

Trigger a batch by hand:

```bash
curl -H "Authorization: Bearer local-secret" http://localhost:3000/api/cron
```

## File map

```
db/schema.sql            SQL to run once in Neon
lib/db.js                Neon client
lib/auth.js              PIN gate
lib/csv.js               dependency-free CSV/TSV parser + column detection
lib/render.js            merge tokens, text→HTML, mandatory unsubscribe footer
lib/unsub.js             signed unsubscribe links
lib/send.js              Resend transport
lib/dispatch.js          the scheduler — claims due campaigns and releases batches
lib/format.js            interval / ETA formatting
app/page.js              dashboard: lists, campaigns, upload, new campaign
app/campaign/[id]        one campaign: progress, pace, preview, test, controls
app/actions/mailer.js    server actions
app/api/cron/route.js    the heartbeat
app/unsubscribe/route.js opt-out landing page + RFC 8058 one-click POST
```
