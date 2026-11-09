// Minimal Stripe helpers — no SDK. Webhook signature verification via crypto,
// and a small authenticated GET for expanding checkout sessions.
import { createHmac, timingSafeEqual } from "crypto";

// Verify the `stripe-signature` header against the raw request body.
// Header format: t=<timestamp>,v1=<hex signature>
export function verifyStripeSignature(rawBody, sigHeader, secret, toleranceSec = 300) {
  if (!sigHeader || !secret) return false;
  const parts = {};
  for (const kv of sigHeader.split(",")) {
    const i = kv.indexOf("=");
    if (i > 0) parts[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  }
  const t = parts.t, v1 = parts.v1;
  if (!t || !v1) return false;
  // Reject stale timestamps (replay protection). Skip if clock unavailable.
  const now = Math.floor(Date.now() / 1000);
  if (Number.isFinite(now) && Math.abs(now - Number(t)) > toleranceSec) return false;

  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(v1, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// GET https://api.stripe.com/v1/<path> with the secret key (returns parsed JSON).
export async function stripeGet(path) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Stripe API ${res.status}`);
  return res.json();
}

// Stripe-style form encoding for nested params: {a:{b:1}, c:[x]} -> a[b]=1&c[0]=x
function encodeForm(obj, prefix, out) {
  out = out || new URLSearchParams();
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") encodeForm(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

// Authenticated request that changes data. Never throws: returns
// { ok, status, data } so callers can show Stripe's own error message.
export async function stripeRequest(method, path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { ok: false, status: 0, data: { error: { message: "STRIPE_SECRET_KEY is not set in Vercel." } } };
  try {
    const res = await fetch(`https://api.stripe.com/v1/${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: method === "GET" ? undefined : encodeForm(params).toString(),
      cache: "no-store",
    });
    let data = {};
    try { data = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: { message: "Could not reach Stripe." } } };
  }
}

// Which kind of key is configured — for the admin Stripe check. Never the key itself.
export function stripeKeyKind() {
  const k = process.env.STRIPE_SECRET_KEY || "";
  if (!k) return "missing";
  if (k.startsWith("sk_live_")) return "full secret key (live)";
  if (k.startsWith("sk_test_")) return "full secret key (TEST mode)";
  if (k.startsWith("rk_live_")) return "restricted key (live)";
  if (k.startsWith("rk_test_")) return "restricted key (TEST mode)";
  return "unrecognized key format";
}

// Human-facing order number from the DB id.
export function orderNumber(id) {
  return `SSO-${1000 + Number(id)}`;
}
