// Sacred Partners affiliate program: applications, approval, Stripe promo codes,
// commission tracking and payouts.
//
// Program rules live here so every page and email agrees:
//   - Customers save $20 with a partner's code (one Stripe coupon shared by all
//     partner codes; each partner gets their own promotion code on it).
//   - Partners earn 10% of what the customer paid for products (after the
//     discount, before shipping and tax).
//   - A commission becomes payable 30 days after the order (refund window) and is
//     paid monthly once the partner has at least $25 payable.
import { sql } from "./db";
import { stripeRequest } from "./stripe";

export const CUSTOMER_DISCOUNT_CENTS = 2000;
export const COMMISSION_RATE = 0.10;
export const HOLD_DAYS = 30;
export const MIN_PAYOUT_CENTS = 2500;
export const COUPON_ID = "SACRED_PARTNER_20";
export const SITE = "https://www.sacredsamplingsolutions.com";
export const PORTAL = process.env.PORTAL_BASE_URL || "https://app.sacredsamplingsolutions.com";

export const PAYOUT_METHODS = [["paypal", "PayPal"], ["venmo", "Venmo"], ["zelle", "Zelle"], ["check", "Mailed check"]];

let tablesReady = false;
export async function ensureAffiliateTables() {
  if (tablesReady) return;
  await sql`create table if not exists affiliates (
    id              bigint generated always as identity primary key,
    email           text unique not null,
    name            text not null,
    user_id         bigint references users(id) on delete set null,
    status          text not null default 'pending',
    code            text unique,
    stripe_promo_id text,
    website         text,
    audience        text,
    channel         text,
    preferred_code  text,
    about           text,
    payout_method   text,
    payout_handle   text,
    w9_received     boolean not null default false,
    agreed_terms_at timestamptz,
    created_at      timestamptz not null default now(),
    approved_at     timestamptz
  )`;
  await sql`create table if not exists affiliate_commissions (
    id                bigint generated always as identity primary key,
    affiliate_id      bigint not null references affiliates(id) on delete cascade,
    order_id          bigint,
    stripe_session_id text unique not null,
    source            text not null,
    product_cents     integer not null,
    commission_cents  integer not null,
    status            text not null default 'pending',
    created_at        timestamptz not null default now(),
    paid_at           timestamptz,
    payout_ref        text
  )`;
  await sql`create index if not exists affiliate_commissions_aff on affiliate_commissions (affiliate_id, status)`;
  tablesReady = true;
}

export function commissionFor(productCents) {
  return Math.max(0, Math.round(Number(productCents || 0) * COMMISSION_RATE));
}

export function cleanCode(v) {
  return String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
}

export function referralLink(code) {
  return `${SITE}/?ref=${encodeURIComponent(code)}`;
}

// ── Stripe ──────────────────────────────────────────────────────────────────

// Make sure the shared $20-off coupon exists. Doubles as the admin "Stripe check":
// it needs the same permission as creating partner codes.
export async function ensurePartnerCoupon() {
  const got = await stripeRequest("GET", `coupons/${COUPON_ID}`);
  if (got.ok) return { ok: true, created: false };
  if (got.status === 404) {
    const made = await stripeRequest("POST", "coupons", {
      id: COUPON_ID,
      name: "Sacred Partner $20 off",
      amount_off: CUSTOMER_DISCOUNT_CENTS,
      currency: "usd",
      duration: "once",
    });
    if (made.ok) return { ok: true, created: true };
    return { ok: false, error: stripeError(made) };
  }
  return { ok: false, error: stripeError(got) };
}

function stripeError(r) {
  const m = r && r.data && r.data.error && r.data.error.message;
  if (r && (r.status === 401 || r.status === 403)) {
    return `Stripe refused (${r.status}): ${m || "permission denied"}. If STRIPE_SECRET_KEY is a restricted key (rk_…), give it Write access to Coupons and Promotion codes.`;
  }
  return m || `Stripe error ${r ? r.status : ""}`.trim();
}

// Create the partner's promotion code on the shared coupon. Newer Stripe API
// versions take promotion[coupon]; older ones take coupon — try both.
export async function createPartnerPromo(code, affiliateId) {
  const base = { code, metadata: { affiliate_id: String(affiliateId), program: "sacred_partners" } };
  let r = await stripeRequest("POST", "promotion_codes", { ...base, promotion: { type: "coupon", coupon: COUPON_ID } });
  if (!r.ok && /promotion|parameter/i.test(stripeError(r))) {
    const legacy = await stripeRequest("POST", "promotion_codes", { ...base, coupon: COUPON_ID });
    if (legacy.ok || !/promotion|parameter/i.test(stripeError(legacy))) r = legacy;
  }
  if (r.ok) return { ok: true, id: r.data.id };
  return { ok: false, error: stripeError(r) };
}

// Find an existing Stripe promotion code by its text (for codes made by hand).
export async function findPromoByCode(code) {
  const r = await stripeRequest("GET", `promotion_codes?code=${encodeURIComponent(code)}&limit=1`);
  const p = r.ok && r.data && r.data.data && r.data.data[0];
  return p ? { id: p.id, active: !!p.active } : null;
}

export async function setPromoActive(promoId, active) {
  if (!promoId) return { ok: true };
  const r = await stripeRequest("POST", `promotion_codes/${promoId}`, { active: active ? "true" : "false" });
  return r.ok ? { ok: true } : { ok: false, error: stripeError(r) };
}

// Pick an unused code: preferred → FIRSTNAME20 → FIRSTNAME20B, C…
export async function suggestCode(aff) {
  await ensureAffiliateTables();
  const first = cleanCode(String(aff.name || aff.email).split(/[\s@.]+/)[0]).slice(0, 12) || "PARTNER";
  const bases = [cleanCode(aff.preferred_code), `${first}20`].filter((c) => c && c.length >= 4);
  for (const b of bases) {
    for (const suffix of ["", "B", "C", "D", "E", "F"]) {
      const c = (b + suffix).slice(0, 20);
      const taken = await sql`select 1 from affiliates where code=${c} and id<>${aff.id}`;
      if (!taken.length) return c;
    }
  }
  return `${first}${aff.id}`;
}

// ── Commissions ─────────────────────────────────────────────────────────────

// Called from the Stripe webhook for each new paid order. The partner's code wins;
// otherwise a referral link (?ref=CODE) earns the commission. Self-referrals and
// partners that aren't approved earn nothing. Never throws.
export async function recordCommission({ sessionId, orderId, promoCode, ref, productCents, buyerEmail }) {
  try {
    await ensureAffiliateTables();
    const tries = [[cleanCode(promoCode), "code"], [cleanCode(ref), "link"]].filter(([c]) => c);
    for (const [code, source] of tries) {
      const rows = await sql`select id, email from affiliates where code=${code} and status='approved'`;
      if (!rows.length) continue;
      const aff = rows[0];
      if (buyerEmail && aff.email && String(buyerEmail).trim().toLowerCase() === aff.email) return null;
      const product = Math.max(0, Number(productCents || 0));
      const commission = commissionFor(product);
      if (!commission) return null;
      await sql`
        insert into affiliate_commissions (affiliate_id, order_id, stripe_session_id, source, product_cents, commission_cents)
        values (${aff.id}, ${orderId || null}, ${sessionId}, ${source}, ${product}, ${commission})
        on conflict (stripe_session_id) do nothing`;
      return { affiliateId: aff.id, commission };
    }
  } catch {
    // best-effort: never fail an order over commission bookkeeping
  }
  return null;
}

// Earnings split the way partners see them. "Pending" is still inside the refund
// window; "payable" has cleared it and is waiting for the monthly payout.
export async function affiliateTotals(affiliateId) {
  await ensureAffiliateTables();
  const r = await sql`
    select
      count(*) filter (where status <> 'void')::int as orders,
      coalesce(sum(product_cents) filter (where status <> 'void'), 0)::bigint as sales,
      coalesce(sum(commission_cents) filter (where status = 'pending' and created_at >  now() - make_interval(days => ${HOLD_DAYS})), 0)::bigint as pending,
      coalesce(sum(commission_cents) filter (where status = 'pending' and created_at <= now() - make_interval(days => ${HOLD_DAYS})), 0)::bigint as payable,
      coalesce(sum(commission_cents) filter (where status = 'paid'), 0)::bigint as paid
    from affiliate_commissions where affiliate_id = ${affiliateId}`;
  const t = r[0] || {};
  return { orders: t.orders || 0, sales: Number(t.sales || 0), pending: Number(t.pending || 0), payable: Number(t.payable || 0), paid: Number(t.paid || 0) };
}

export function commissionState(c) {
  if (c.status === "paid") return "Paid";
  if (c.status === "void") return "Void";
  const cleared = new Date(c.created_at).getTime() <= Date.now() - HOLD_DAYS * 86400000;
  return cleared ? "Payable" : "Pending";
}

// ── Email ───────────────────────────────────────────────────────────────────

async function send({ to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Sacred Sampling Solutions <orders@sacredsamplingsolutions.com>",
        to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
  } catch {}
}

export async function notifyOwnerApplication(a) {
  const to = process.env.OWNER_EMAIL || "info@sacredsamplingsolutions.com";
  await send({
    to, replyTo: a.email,
    subject: `New Sacred Partner application — ${a.name}`,
    text: [
      `${a.name} <${a.email}> applied to the affiliate program.`,
      `Platform: ${a.channel || "-"}  ·  Audience: ${a.audience || "-"}`,
      `Website: ${a.website || "-"}`,
      `Preferred code: ${a.preferred_code || "-"}`,
      `About: ${a.about || "-"}`,
      "",
      `Review and approve: ${PORTAL}/fulfillment?tab=affiliates`,
    ].join("\n"),
  });
}

export async function sendApplicationReceived(a) {
  const first = String(a.name || "there").trim().split(/\s+/)[0];
  await send({
    to: a.email,
    subject: "We got your Sacred Partners application",
    html: shell(`<h1 style="margin:0 0 14px;font-size:22px">Thanks for applying, ${esc(first)}!</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#304663">We review every application personally and will email you within a few business days. Once you're approved you'll get your own discount code &mdash; <b>$20 off</b> for your audience &mdash; and your partner dashboard, where you earn <b>10%</b> on every sale.</p>`),
  });
}

export async function sendApproved({ aff, code, setPasswordToken }) {
  const first = String(aff.name || "there").trim().split(/\s+/)[0];
  const dash = setPasswordToken
    ? `${PORTAL}/set-password?token=${encodeURIComponent(setPasswordToken)}&next=${encodeURIComponent("/affiliate")}`
    : `${PORTAL}/login?next=${encodeURIComponent("/affiliate")}`;
  await send({
    to: aff.email,
    subject: `You're a Sacred Partner! Your code is ${code}`,
    html: shell(`<h1 style="margin:0 0 14px;font-size:22px">Welcome aboard, ${esc(first)}!</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#304663">Your application is approved. Share your code or link &mdash; your audience saves <b>$20</b>, and you earn <b>10%</b> of every sale.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;width:100%"><tr><td style="background:#eef4fb;border-radius:10px;padding:16px 18px">
        <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#5d7391">Your code</div>
        <div style="font-size:26px;font-weight:800;letter-spacing:.04em;color:#1071ef">${esc(code)}</div>
        <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#5d7391;margin-top:10px">Your link</div>
        <div style="font-size:14px;word-break:break-all"><a href="${referralLink(code)}" style="color:#1071ef">${referralLink(code)}</a></div>
      </td></tr></table>
      <a href="${dash}" style="display:inline-block;background:#1071ef;color:#fff;text-decoration:none;font-weight:800;font-size:16px;padding:14px 24px;border-radius:9px">${setPasswordToken ? "Set your password &amp; open your dashboard" : "Open your partner dashboard"} &rarr;</a>
      <p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:#5d7391">Please disclose the partnership whenever you share (for example &ldquo;#ad&rdquo; or &ldquo;I earn a commission from this link&rdquo;) &mdash; it's required by the FTC.</p>`),
  });
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function shell(inner) {
  return `<!doctype html><html><body style="margin:0;background:#eef4fb;font-family:Arial,Helvetica,sans-serif;color:#10264a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
      <tr><td style="padding:24px 32px;border-bottom:1px solid #e8eef6"><img src="${SITE}/assets/logo-color.png" width="180" alt="Sacred Sampling Solutions" style="display:block;width:180px;height:auto;border:0"></td></tr>
      <tr><td style="padding:28px 32px">${inner}</td></tr>
      <tr><td style="padding:18px 32px;background:#0e2a4d;color:#a9bdd3;font-size:11px">Sacred Partners Affiliate Program &middot; Sacred Sampling Solutions</td></tr>
    </table>
  </td></tr></table></body></html>`;
}
