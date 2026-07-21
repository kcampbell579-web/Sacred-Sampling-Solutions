# Highland Valley Medical Care — Patient Portal (Mockup)

A clickable **mockup** of a patient portal + appointment scheduling for
[Highland Valley Medical Care](https://www.highlandvalleyclinic.com) (Coram, NY).

Built with **Next.js 14 (App Router) + React 18** — the same stack the existing
Sacred Sampling portal uses — so it drops straight onto **Vercel** and wires to
**Neon** when you're ready to go live.

> ⚠️ This is a design/UX mockup. There is **no real authentication, database, or
> PHI**. All data lives in the browser (`localStorage`) and resets when cleared.
> Do **not** use with real patient data until the Neon + auth wiring below is done.

## What's in the mockup

| Page | What it shows |
| --- | --- |
| `/login` | Patient sign-in (any credentials — it's a demo). |
| `/dashboard` | Welcome, upcoming visits, quick actions, care team. |
| `/schedule` | 4-step booking wizard: visit type → provider → date/time → confirm. Booking actually saves and shows up everywhere. |
| `/appointments` | Upcoming and past visits, with cancel. |
| `/records` | Recent lab results (sample data). |
| `/profile` | Patient info, insurance, and clinic details. |

Providers, visit types, and clinic info are in [`lib/clinic.js`](lib/clinic.js).

## Run it locally

```bash
cd medical-portal
npm install
npm run dev
# open http://localhost:3000  → you'll land on the sign-in page
```

## Deploy the mockup (Vercel)

Point Vercel at this `medical-portal/` directory (set it as the project root).
No environment variables are needed for the mockup.

## Going live: wiring Neon

1. Create a Neon Postgres project and run [`db/schema.sql`](db/schema.sql).
2. Add `DATABASE_URL` (see [`.env.example`](.env.example)) to Vercel env vars.
3. Add `@neondatabase/serverless` and replace the functions in
   [`lib/store.js`](lib/store.js) with server actions that query Neon. The
   function names/shapes already match the schema, so the UI doesn't change.
4. Add real patient authentication (e.g. Auth.js / Clerk) in place of the demo
   `signIn()` / `isSignedIn()` helpers, and enforce that patients only see their
   own records.

## Before this touches real patients

This is a mockup, not a HIPAA-ready system. A production build needs, at minimum:
real authentication + session security, per-patient authorization on every query,
a signed BAA with your hosting/DB vendors, audit logging, and encryption of PHI.
