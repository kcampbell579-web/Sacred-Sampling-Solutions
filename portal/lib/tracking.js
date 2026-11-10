// Live UPS delivery status via Shippo's tracking API, cached in the database so
// the fulfillment page stays fast. Delivered packages are never re-checked;
// everything else refreshes at most every few hours (or on "Check now").
import { sql } from "./db";

const REFRESH_HOURS = 3;
const MAX_LOOKUPS_PER_PAGE = 25;
const LOOKUP_TIMEOUT_MS = 4500;

let ready = false;
async function ensureTable() {
  if (ready) return;
  await sql`create table if not exists tracking_cache (
    tracking_number text primary key,
    carrier         text,
    status          text,          -- PRE_TRANSIT | TRANSIT | DELIVERED | RETURNED | FAILURE | UNKNOWN
    detail          text,
    status_date     timestamptz,
    eta             timestamptz,
    location        text,
    checked_at      timestamptz not null default now()
  )`;
  ready = true;
}

export function cleanTracking(n) {
  return String(n || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Only UPS numbers (1Z…) are looked up; other carriers just show "Shipped".
export function carrierFor(n) {
  return /^1Z[0-9A-Z]{16}$/.test(cleanTracking(n)) ? "ups" : null;
}

async function lookup(number, carrier) {
  const token = process.env.SHIPPO_API_TOKEN;
  if (!token) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.goshippo.com/tracks/${carrier}/${encodeURIComponent(number)}`, {
      headers: { Authorization: "ShippoToken " + token },
      cache: "no-store",
      signal: ctl.signal,
    });
    if (!res.ok) return null;
    const d = await res.json();
    const ts = d.tracking_status || {};
    const loc = ts.location || {};
    return {
      status: String(ts.status || "UNKNOWN").toUpperCase(),
      detail: ts.status_details || "",
      status_date: ts.status_date || null,
      eta: d.eta || null,
      location: [loc.city, loc.state].filter(Boolean).join(", "),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// numbers: array of tracking numbers. Returns Map(cleanNumber → status row).
// Never throws; missing token or network trouble just means no live status.
export async function getTrackingMany(numbers) {
  const out = new Map();
  const wanted = [...new Set((numbers || []).map(cleanTracking).filter((n) => carrierFor(n)))];
  if (!wanted.length) return out;
  try {
    await ensureTable();
    const cached = await sql`select * from tracking_cache where tracking_number = any(${wanted})`;
    for (const c of cached) out.set(c.tracking_number, c);

    const staleBefore = Date.now() - REFRESH_HOURS * 3600000;
    const stale = wanted.filter((n) => {
      const c = out.get(n);
      if (!c) return true;
      if (c.status === "DELIVERED") return false;
      return new Date(c.checked_at).getTime() < staleBefore;
    }).slice(0, MAX_LOOKUPS_PER_PAGE);

    const fresh = await Promise.all(stale.map(async (n) => [n, await lookup(n, carrierFor(n))]));
    for (const [n, t] of fresh) {
      if (!t) continue;
      const rows = await sql`
        insert into tracking_cache (tracking_number, carrier, status, detail, status_date, eta, location, checked_at)
        values (${n}, ${carrierFor(n)}, ${t.status}, ${t.detail}, ${t.status_date}, ${t.eta}, ${t.location}, now())
        on conflict (tracking_number) do update set
          status=excluded.status, detail=excluded.detail, status_date=excluded.status_date,
          eta=excluded.eta, location=excluded.location, checked_at=now()
        returning *`;
      out.set(n, rows[0]);
    }
  } catch {
    // live status is a nice-to-have; the page still renders without it
  }
  return out;
}

export async function forgetTracking(number) {
  try {
    await ensureTable();
    await sql`delete from tracking_cache where tracking_number = ${cleanTracking(number)}`;
  } catch {}
}
