// Renders + sends the "Order Shipped" email via Resend. Best-effort: never
// throws, so it can't break the fulfillment action. No-ops if RESEND_API_KEY
// is unset or the order has no customer email.
import { ORDER_SHIPPED_HTML } from "./orderShippedTemplate";
import { kvGet } from "@/lib/kv";
import { orderNumber } from "@/lib/stripe";

const PORTAL_BASE = process.env.PORTAL_BASE_URL || "https://app.sacredsamplingsolutions.com";

function money(cents, cur) {
  if (cents == null) return "";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: (cur || "usd").toUpperCase() }).format(cents / 100);
  } catch {
    return "$" + (Number(cents) / 100).toFixed(2);
  }
}
function fmtShort(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" });
}
function fmtLong(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" });
}
function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "there";
}
function upsUrl(t) {
  return `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(String(t || "").trim())}`;
}
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Wrap a date string in an authored <a> so iOS Mail's data detectors don't
// turn it into a blue, underlined calendar link. Text inside an existing
// anchor is left alone; color:inherit keeps whatever the surrounding cell set.
function dateSafe(text) {
  const s = esc(text);
  return s ? `<a style="color:inherit;text-decoration:none;" href="#">${s}</a>` : "";
}

// Turn the raw Stripe line-item description into a clean product name:
// drop a leading "1× ", the "by Sacred Sampling Solutions" vendor phrase, and a
// trailing SKU number — e.g.
//   "Asbestos Core Laboratory Analysis Collection Kit by Sacred Sampling Solutions 48010"
//   -> "Asbestos Core Laboratory Analysis Collection Kit"
function cleanProductName(raw) {
  let s = String(raw || "")
    .replace(/^\s*\d+\s*[×x]\s*/i, "")
    .replace(/\s*by sacred sampling solutions\b/gi, " ")
    .replace(/\s+\b\d{4,}\b\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return s || "Your Sacred Sampling kit";
}

async function resolveOrderNumber(o) {
  // The customer-facing number (SS-<ABBR>-#####) is assigned at checkout and
  // stored in KV; that's what the buyer saw on the order page, so prefer it.
  try {
    const kv = await kvGet(`order:sid:${o.stripe_session_id}`);
    if (kv) return kv;
  } catch {}
  // KV miss: use a stable, brand-consistent reference from the session id
  // rather than the orphan SSO-#### scheme.
  const tail = String(o.stripe_session_id || "")
    .replace(/^cs_(live|test)_/, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(-6);
  return tail ? `SS-ORD-${tail}` : orderNumber(o.id);
}

// o: an orders row (id, stripe_session_id, email, customer_name, amount_total,
// currency, kit_name, quantity, ship_address, created_at, shipped_at, tracking_number)
export async function sendOrderShippedEmail(o) {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) return { ok: false, reason: "no_resend_key" };
    if (!o || !o.email) return { ok: false, reason: "no_customer_email" };

    const number = await resolveOrderNumber(o);
    const tracking = String(o.tracking_number || "").trim();
    const est = o.shipped_at ? new Date(new Date(o.shipped_at).getTime() + 5 * 86400000) : null;
    const deliveryDate = est ? fmtLong(est) : "";

    // Tracking is optional at ship time. When we have it, show the real UPS
    // button + number. When we don't, don't ship a dead "track" link or a
    // confusing placeholder — point to the portal and promise the number.
    let TRACK_CTA, TRACKING_LINE, TRACKING_ROW;
    if (tracking) {
      TRACK_CTA = `<a href="${upsUrl(tracking)}" class="btn" style="display:inline-block;background:#1071ef;color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;line-height:1;padding:16px 26px;border-radius:9px;">Track Your Package &rarr;</a>`;
      TRACKING_LINE = `<div style="margin-top:14px;font-size:14px;color:#586a82;">Tracking Number: <strong style="color:#10264a;">${esc(tracking)}</strong></div>`;
      TRACKING_ROW = `<tr><td style="color:#687b94;">Tracking</td><td align="right" style="color:#10264a;font-weight:700;">${esc(tracking)}</td></tr>`;
    } else {
      TRACK_CTA = `<a href="${PORTAL_BASE}/dashboard" class="btn" style="display:inline-block;background:#1071ef;color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;line-height:1;padding:16px 26px;border-radius:9px;">View Order Status &rarr;</a>`;
      TRACKING_LINE = `<div style="margin-top:14px;font-size:14px;color:#586a82;">Your UPS tracking number will be emailed as soon as it&rsquo;s available.</div>`;
      TRACKING_ROW = "";
    }

    const data = {
      FIRST_NAME: esc(firstName(o.customer_name)),
      ORDER_NUMBER: esc(number),
      TRACK_CTA,
      TRACKING_LINE,
      TRACKING_ROW,
      PRODUCT_NAME: esc(cleanProductName(o.kit_name)),
      PRODUCT_SUBTITLE: "",
      PRODUCT_PRICE: esc(money(o.amount_total, o.currency)),
      QUANTITY: esc(String(o.quantity || 1)),
      ORDER_DATE: dateSafe(fmtShort(o.created_at)),
      SHIPPED_DATE: dateSafe(fmtShort(o.shipped_at) || fmtShort(new Date())),
      CARRIER: "UPS",
      DELIVERY_LINE: deliveryDate ? `Est. ${dateSafe(deliveryDate)}` : "",
      DELIVERY_DATE: dateSafe(deliveryDate || "See tracking"),
      SHIPPING_ADDRESS: esc(o.ship_address || "").replace(/,\s*/g, "<br>"),
      YEAR: String(new Date().getFullYear()),
    };

    let html = ORDER_SHIPPED_HTML;
    for (const [k, v] of Object.entries(data)) html = html.split(`{{${k}}}`).join(v);

    const from = process.env.RESEND_FROM || "Sacred Sampling Solutions <orders@sacredsamplingsolutions.com>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [o.email],
        subject: `Your Sacred Sampling kit has shipped — ${number}`,
        html,
      }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false, reason: "exception" };
  }
}
