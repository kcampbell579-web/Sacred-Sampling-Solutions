# Sacred Sampling Solutions — Customer Portal

A Next.js (App Router) + Neon Postgres app for the customer journey:
**sign up → activate a Kit ID → add sample details → track status → view results.**

Deploy as its own Vercel project (separate from the marketing site).

## Stack
- **Next.js 14** (App Router, server components + server actions)
- **Neon** serverless Postgres (`@neondatabase/serverless`)
- **Auth:** email + password (scrypt-hashed) with DB-backed httpOnly sessions
- Plain CSS in the brand palette (black `#0E0E0E` + blue `#2C94FC`, Manrope) — no build-time CSS deps

Only **one environment variable** is required: `DATABASE_URL`.

## 1. Set up the database (Neon)
1. In your Neon project, open the **SQL Editor**.
2. Paste and run [`db/schema.sql`](db/schema.sql).
3. (Optional, for testing) run [`db/seed.sql`](db/seed.sql) to insert sample Kit IDs
   (`SSS-ESS-0001`, `SSS-PRO-0001`, …).
4. Copy your **pooled** connection string from Neon → *Connection Details*.

## 2. Deploy to Vercel
1. Vercel → **Add New → Project → Import** this repo.
2. Set **Root Directory = `portal`**. Framework auto-detects as **Next.js**.
3. Add an environment variable: **`DATABASE_URL`** = your Neon pooled connection string.
4. **Deploy.**
5. Add a domain — recommended **`app.sacredsamplingsolutions.com`** (Settings → Domains).

### Make the kit QR code work
Your kit inserts point to `www.sacredsamplingsolutions.com/sampleregistration`. On the
**marketing** Vercel project, add a redirect so that path forwards to the portal. Create
`site/vercel.json`:
```json
{ "redirects": [
  { "source": "/sampleregistration", "destination": "https://app.sacredsamplingsolutions.com/sampleregistration", "permanent": false },
  { "source": "/sampleregistration/:path*", "destination": "https://app.sacredsamplingsolutions.com/sampleregistration/:path*", "permanent": false }
] }
```
(QR codes can also encode the Kit ID: `…/sampleregistration?kit=SSS-ESS-0001` — the portal pre-fills it.)

## 3. Local development
```bash
cd portal
npm install
echo 'DATABASE_URL="<your Neon pooled URL>"' > .env
npm run dev        # http://localhost:3000
```

## How the lab moves a kit through the pipeline
Statuses: `inactive → activated → received → analyzing → ready`. Until an admin UI
exists, update via SQL (see the cheat-sheet at the bottom of `db/seed.sql`):
```sql
update kits set status='received'  where kit_id='SSS-ESS-0001';
update kits set status='analyzing' where kit_id='SSS-ESS-0001';
update kits set status='ready'     where kit_id='SSS-ESS-0001';
insert into results (kit_id, summary, report_url)
values ('SSS-ESS-0001','All analytes within EPA limits.','https://…/report.pdf');
```

## Before real launch — security & product checklist
This is a solid, secure **foundation**, but add these before taking real customer data at scale:
- [ ] **Email verification** and **password reset** flows
- [ ] **Rate limiting** on login/signup (e.g., Vercel/Upstash) + basic bot protection
- [ ] Consider a **managed auth provider** (Neon Auth / Clerk) for MFA, social login, and account recovery
- [ ] An **admin view** to register manufactured Kit IDs and release results (replaces the SQL cheat-sheet)
- [ ] Email/SMS **notifications** on status changes
- [ ] A privacy/retention review — this stores names, emails, and sample context

## File map
```
db/schema.sql, db/seed.sql     SQL to run in Neon
lib/db.js                      Neon client
lib/auth.js                    password hashing + sessions
lib/products.js                kit display names/prices + status steps
app/actions/*                  server actions (auth, activate, save sample)
app/sampleregistration         QR landing (→ signup/login, then activate)
app/login, app/signup          auth screens
app/dashboard                  list of the user's kits
app/activate                   enter a Kit ID
app/kit/[id]                   status timeline, sample form, results
components/Header, Timeline    shared UI
```
