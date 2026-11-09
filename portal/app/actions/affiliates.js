"use server";

import { sql } from "@/lib/db";
import { fulfillAuthed } from "@/lib/fulfillauth";
import { requireUser } from "@/lib/auth";
import { ensureAccountForEmail } from "@/lib/accounts";
import {
  ensureAffiliateTables, ensurePartnerCoupon, createPartnerPromo, findPromoByCode, setPromoActive,
  suggestCode, cleanCode, sendApproved, HOLD_DAYS, PAYOUT_METHODS,
} from "@/lib/affiliates";
import { redirect } from "next/navigation";

const back = (kind, msg) => `/fulfillment?tab=affiliates&${kind}=${encodeURIComponent(msg)}`;
function guard() {
  if (!fulfillAuthed()) redirect("/fulfillment");
}

export async function affiliateStripeCheck() {
  guard();
  const r = await ensurePartnerCoupon();
  if (r.ok) redirect(back("ok", r.created
    ? "Stripe check passed ✓ — created the shared $20-off partner coupon. Approvals will create codes automatically."
    : "Stripe check passed ✓ — the key can create partner codes."));
  redirect(back("error", `Stripe check failed: ${r.error}`));
}

export async function approveAffiliate(formData) {
  guard();
  await ensureAffiliateTables();
  const id = Number(formData.get("id"));
  const manual = formData.get("manual") === "on";
  const rows = await sql`select * from affiliates where id=${id}`;
  if (!rows.length) redirect(back("error", "Application not found."));
  const aff = rows[0];

  const code = cleanCode(formData.get("code")) || (await suggestCode(aff));
  if (code.length < 4) redirect(back("error", "Codes need at least 4 letters or numbers."));
  const taken = await sql`select 1 from affiliates where code=${code} and id<>${id}`;
  if (taken.length) redirect(back("error", `${code} already belongs to another partner. Pick a different code.`));

  let promoId = null;
  if (manual) {
    const found = await findPromoByCode(code);
    if (!found) redirect(back("error", `Couldn't find a promotion code "${code}" in Stripe. Create it there first (on the $20-off coupon), or untick the box to let the portal create it.`));
    promoId = found.id;
  } else {
    const coupon = await ensurePartnerCoupon();
    if (!coupon.ok) redirect(back("error", `Stripe couldn't set up the $20 coupon: ${coupon.error}`));
    const promo = await createPartnerPromo(code, id);
    if (!promo.ok) redirect(back("error", `Stripe couldn't create code ${code}: ${promo.error}`));
    promoId = promo.id;
  }

  // Give the partner a portal login (new accounts get a set-password link).
  let token = null, userId = aff.user_id;
  try {
    const acct = await ensureAccountForEmail({ email: aff.email, name: aff.name });
    if (acct) { userId = acct.userId; token = acct.isNew ? acct.token : null; }
  } catch {}

  await sql`update affiliates set status='approved', code=${code}, stripe_promo_id=${promoId},
            user_id=${userId}, approved_at=coalesce(approved_at, now()) where id=${id}`;
  await sendApproved({ aff, code, setPasswordToken: token });
  redirect(back("ok", `${aff.name} approved with code ${code}. Welcome email sent.`));
}

export async function rejectAffiliate(formData) {
  guard();
  const id = Number(formData.get("id"));
  await sql`update affiliates set status='rejected' where id=${id} and status='pending'`;
  redirect(back("ok", "Application declined."));
}

export async function setAffiliatePaused(formData) {
  guard();
  const id = Number(formData.get("id"));
  const pause = formData.get("pause") === "1";
  const rows = await sql`select stripe_promo_id, code from affiliates where id=${id}`;
  if (!rows.length) redirect(back("error", "Partner not found."));
  const r = await setPromoActive(rows[0].stripe_promo_id, !pause);
  if (!r.ok) redirect(back("error", `Stripe couldn't ${pause ? "turn off" : "turn on"} ${rows[0].code}: ${r.error}`));
  await sql`update affiliates set status=${pause ? "paused" : "approved"} where id=${id}`;
  redirect(back("ok", pause ? `${rows[0].code} paused — the code no longer works at checkout.` : `${rows[0].code} is active again.`));
}

export async function toggleAffiliateW9(formData) {
  guard();
  const id = Number(formData.get("id"));
  await sql`update affiliates set w9_received = not w9_received where id=${id}`;
  redirect(back("ok", "W-9 status updated."));
}

export async function markAffiliatePaid(formData) {
  guard();
  const id = Number(formData.get("id"));
  const ref = (formData.get("ref") || "").toString().trim().slice(0, 120) || null;
  const rows = await sql`
    update affiliate_commissions set status='paid', paid_at=now(), payout_ref=${ref}
    where affiliate_id=${id} and status='pending' and created_at <= now() - make_interval(days => ${HOLD_DAYS})
    returning commission_cents`;
  const total = rows.reduce((n, r) => n + Number(r.commission_cents || 0), 0);
  if (!rows.length) redirect(back("error", "Nothing payable for that partner yet."));
  redirect(back("ok", `Marked ${rows.length} commission${rows.length === 1 ? "" : "s"} paid ($${(total / 100).toFixed(2)}).`));
}

export async function voidCommission(formData) {
  guard();
  const id = Number(formData.get("id"));
  await sql`update affiliate_commissions set status='void' where id=${id} and status='pending'`;
  redirect(back("ok", "Commission voided (e.g. refunded order)."));
}

// Partner-side: payout details from the /affiliate dashboard.
export async function saveAffiliatePayout(formData) {
  const user = await requireUser();
  await ensureAffiliateTables();
  const method = (formData.get("method") || "").toString();
  const handle = (formData.get("handle") || "").toString().trim().slice(0, 200);
  if (!PAYOUT_METHODS.some(([k]) => k === method) || !handle) {
    redirect(`/affiliate?error=${encodeURIComponent("Choose a payout method and enter where to send payments.")}`);
  }
  await sql`update affiliates set payout_method=${method}, payout_handle=${handle}
            where user_id=${user.id} or email=${user.email.toLowerCase()}`;
  redirect(`/affiliate?ok=${encodeURIComponent("Payout details saved.")}`);
}
