// When UPS reports a kit delivered: mark the order delivered (shipped → fulfilled),
// move the customer's sample to "With Customer for Collection", and send the
// "your kit was delivered" email — exactly once per order.
//
// Triggered three ways, all safe to overlap:
//   1. Shippo webhook (instant)            → app/api/shippo-webhook
//   2. Daily Vercel cron (backup)          → app/api/cron/deliveries
//   3. Opening Fulfillment → Orders        → app/fulfillment/page.js
import { sql } from "./db";
import { getTrackingMany, forgetTracking, cleanTracking, carrierFor } from "./tracking";
import { sendDeliveredEmail } from "./deliveredEmail";
import { statusIndex } from "./status";

let ready = false;
export async function ensureDeliveryColumns() {
  if (ready) return;
  await sql`alter table orders add column if not exists delivered_at timestamptz`;
  await sql`alter table orders add column if not exists delivered_email_at timestamptz`;
  ready = true;
}

// Ask Shippo to watch a tracking number so its webhook fires on delivery.
// (Labels bought through Shippo are watched automatically; this covers numbers
// pasted in by hand.) Best-effort.
export async function registerTracking(number) {
  const token = process.env.SHIPPO_API_TOKEN;
  const n = cleanTracking(number);
  const carrier = carrierFor(n);
  if (!token || !carrier) return;
  try {
    await fetch("https://api.goshippo.com/tracks/", {
      method: "POST",
      headers: { Authorization: "ShippoToken " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ carrier, tracking_number: n }),
      cache: "no-store",
    });
  } catch {}
}

// Handle one order whose package UPS says is delivered. Returns true if the
// email went out on this call.
export async function markDelivered(order, track) {
  await ensureDeliveryColumns();
  // Claim the order first so overlapping triggers can't double-send.
  const claimed = await sql`
    update orders set
      delivered_at = coalesce(delivered_at, ${track?.status_date || null}::timestamptz, now()),
      delivered_email_at = now(),
      status = case when status = 'shipped' then 'fulfilled' else status end
    where id = ${order.id} and delivered_email_at is null
    returning id, email, customer_name`;
  if (!claimed.length) return false;
  const o = claimed[0];

  // Customer dashboard: kit is now with them for collection.
  try {
    if (o.email) {
      const regs = await sql`select sample_id, status from sample_registrations where lower(email) = lower(${o.email})`;
      for (const r of regs) {
        if (statusIndex(r.status) <= 1) {
          await sql`update sample_registrations set status = 'With Customer for Collection' where sample_id = ${r.sample_id}`;
        }
      }
    }
  } catch {}

  const sent = o.email ? await sendDeliveredEmail({ email: o.email, name: o.customer_name }) : false;
  if (!sent) {
    // Release the claim so the next check retries the email.
    await sql`update orders set delivered_email_at = null where id = ${o.id}`;
  }
  return sent;
}

// Check shipped orders that haven't had their delivered email yet.
// numbers: optional list of tracking numbers to look up fresh (from a webhook).
export async function processDeliveries({ numbers } = {}) {
  const result = { checked: 0, delivered: 0, emailed: 0 };
  try {
    await ensureDeliveryColumns();
    if (numbers && numbers.length) for (const n of numbers) await forgetTracking(n);
    const orders = await sql`
      select id, email, customer_name, tracking_number from orders
      where tracking_number is not null and tracking_number <> ''
        and delivered_email_at is null
        and created_at > now() - interval '120 days'
      order by created_at desc limit 80`;
    const wanted = numbers && numbers.length
      ? orders.filter((o) => numbers.map(cleanTracking).includes(cleanTracking(o.tracking_number)))
      : orders;
    result.checked = wanted.length;
    if (!wanted.length) return result;
    const live = await getTrackingMany(wanted.map((o) => o.tracking_number));
    for (const o of wanted) {
      const t = live.get(cleanTracking(o.tracking_number));
      if (!t || t.status !== "DELIVERED") continue;
      result.delivered++;
      if (await markDelivered(o, t)) result.emailed++;
    }
  } catch {
    // best-effort; the next trigger tries again
  }
  return result;
}
