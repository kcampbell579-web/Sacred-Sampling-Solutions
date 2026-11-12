// Coupon codes for social posts: the 6-week plan (one per post) plus one-off
// posts (TAPWATER, PFAINTEL).
// Created in Stripe from Fulfillment → Campaigns with the portal's own key.
import { stripeRequest } from "./stripe";

export const SOCIAL_COUPON_ID = "SOCIAL15";
export const SOCIAL_DISCOUNT_CENTS = 1500;
export const SOCIAL_CODES = [
  "WELCOME01", "KELLY02", "EDUCATE03", "BLOOPER04", "TESTALL05", "UNBOX06", "SHOP07", "OWNER08",
  "FAMILY09", "PURPOSE10", "RELIABLE11", "EVERYONE12", "ITSTIME13", "ANSWERS14", "DONTWAIT15", "DMME16",
  "COMMUNITY17", "ONTHEGO18", "REMINDER19", "KNOWLEDGE20", "PROTECT21", "CHANGE22", "NOWTIME23", "FALL24",
  "TAPWATER", "PFAINTEL",
];

const msg = (r) => (r && r.data && r.data.error && r.data.error.message) || `Stripe error ${r ? r.status : ""}`;

// Creates the shared $15-off coupon and every missing code (first order only,
// so each customer gets one coupon). Safe to run again: existing codes are skipped.
export async function createSocialCodes() {
  const got = await stripeRequest("GET", `coupons/${SOCIAL_COUPON_ID}`);
  if (!got.ok) {
    if (got.status !== 404) return { ok: false, error: msg(got) };
    const made = await stripeRequest("POST", "coupons", {
      id: SOCIAL_COUPON_ID, name: "Social post $15 off", amount_off: SOCIAL_DISCOUNT_CENTS, currency: "usd", duration: "once",
    });
    if (!made.ok) return { ok: false, error: msg(made) };
  }

  const created = [], existing = [], failed = [];
  for (const code of SOCIAL_CODES) {
    const look = await stripeRequest("GET", `promotion_codes?code=${encodeURIComponent(code)}&limit=1`);
    if (look.ok && look.data && look.data.data && look.data.data.length) { existing.push(code); continue; }
    const base = { code, restrictions: { first_time_transaction: "true" }, metadata: { program: "social_posts" } };
    let r = await stripeRequest("POST", "promotion_codes", { ...base, promotion: { type: "coupon", coupon: SOCIAL_COUPON_ID } });
    if (!r.ok && /promotion|parameter/i.test(msg(r))) {
      r = await stripeRequest("POST", "promotion_codes", { ...base, coupon: SOCIAL_COUPON_ID });
    }
    if (r.ok) created.push(code); else failed.push(`${code} (${msg(r)})`);
  }
  return { ok: failed.length === 0, created, existing, failed };
}
