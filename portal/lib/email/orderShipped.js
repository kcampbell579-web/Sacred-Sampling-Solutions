// Renders + sends the "Order Shipped" email via Resend. Best-effort: never
// throws, so it can't break the fulfillment action. No-ops if RESEND_API_KEY
// is unset or the order has no customer email.
import { ORDER_SHIPPED_HTML } from "./orderShippedTemplate";
import { kvGet } from "@/lib/kv";
import { orderNumber } from "@/lib/stripe";

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

async function resolveOrderNumber(o) {
  try {
    const kv = await kvGet(`order:sid:${o.stripe_session_id}`);
    if (kv) return kv;
  } catch {}
  return orderNumber(o.id);
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
    const productName = String(o.kit_name || "Your Sacred Sampling kit").replace(/^\s*\d+\s*[×x]\s*/, "");

    const data = {
      FIRST_NAME: esc(firstName(o.customer_name)),
      ORDER_NUMBER: esc(number),
      TRACKING_NUMBER: esc(tracking || "Provided with your tracking link"),
      TRACKING_URL: tracking ? upsUrl(tracking) : "https://www.ups.com/track",
      PRODUCT_NAME: esc(productName),
      PRODUCT_SUBTITLE: "",
      PRODUCT_PRICE: esc(money(o.amount_total, o.currency)),
      QUANTITY: esc(String(o.quantity || 1)),
      ORDER_DATE: esc(fmtShort(o.created_at)),
      SHIPPED_DATE: esc(fmtShort(o.shipped_at) || fmtShort(new Date())),
      CARRIER: "UPS",
      DELIVERY_DATE: esc(est ? fmtLong(est) : "See tracking"),
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
