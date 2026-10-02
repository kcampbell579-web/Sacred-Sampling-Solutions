"use server";

import { sql } from "@/lib/db";
import { verifyPin, setFulfillCookie, clearFulfillCookie, fulfillAuthed } from "@/lib/fulfillauth";
import { sendOrderShippedEmail } from "@/lib/email/orderShipped";
import { redirect } from "next/navigation";

const STATUSES = ["new", "shipped", "fulfilled"];

export async function fulfillLogin(formData) {
  const pin = (formData.get("pin") || "").toString();
  if (!verifyPin(pin)) redirect(`/fulfillment?error=${encodeURIComponent("Incorrect PIN.")}`);
  setFulfillCookie();
  redirect("/fulfillment");
}

export async function fulfillLogout() {
  clearFulfillCookie();
  redirect("/fulfillment");
}

export async function setOrderStatus(formData) {
  if (!fulfillAuthed()) redirect("/fulfillment");
  const id = Number(formData.get("id"));
  const status = (formData.get("status") || "").toString();
  if (!id || !STATUSES.includes(status)) redirect("/fulfillment");

  // Optional outbound (to-customer) UPS tracking entered alongside "Mark shipped".
  const tracking = (formData.get("tracking") || "").toString().trim();

  if (status === "shipped") {
    // Only email the customer on the FIRST transition into "shipped".
    let wasShipped = false;
    try {
      const before = await sql`select status from orders where id=${id}`;
      wasShipped = before.length > 0 && before[0].status === "shipped";
    } catch {}

    await sql`update orders set status='shipped', shipped_at=coalesce(shipped_at, now()) where id=${id}`;
    if (tracking) {
      try {
        await sql`update orders set tracking_number=${tracking} where id=${id}`;
      } catch {
        redirect(`/fulfillment?error=${encodeURIComponent("Order marked shipped, but tracking could not be saved — run migrate-orders-tracking.sql in Neon first.")}`);
      }
    }

    if (!wasShipped) {
      // Best-effort: send the "Order Shipped" email (never blocks fulfillment).
      try {
        const rows = await sql`
          select id, stripe_session_id, email, customer_name, amount_total, currency,
                 kit_name, quantity, ship_address, created_at, shipped_at, tracking_number
          from orders where id=${id}`;
        if (rows.length) await sendOrderShippedEmail(rows[0]);
      } catch {}
    }
  } else if (status === "new") {
    await sql`update orders set status='new', shipped_at=null where id=${id}`;
  } else {
    await sql`update orders set status=${status} where id=${id}`;
  }
  redirect(`/fulfillment?ok=${encodeURIComponent("Order updated")}`);
}

// Add or update the outbound (warehouse -> customer) UPS tracking number.
export async function saveOutboundTracking(formData) {
  if (!fulfillAuthed()) redirect("/fulfillment");
  const id = Number(formData.get("id"));
  const tracking = (formData.get("tracking") || "").toString().trim();
  if (!id) redirect("/fulfillment");
  try {
    await sql`update orders set tracking_number=${tracking || null} where id=${id}`;
  } catch {
    redirect(`/fulfillment?error=${encodeURIComponent("Could not save tracking — run migrate-orders-tracking.sql in Neon first.")}`);
  }
  redirect(`/fulfillment?ok=${encodeURIComponent(tracking ? "Tracking saved" : "Tracking cleared")}`);
}

// Add or update the return (customer -> lab) UPS tracking on the sample
// registration — for when you send the return label yourself instead of the
// customer buying it.
export async function saveReturnTracking(formData) {
  if (!fulfillAuthed()) redirect("/fulfillment");
  const sampleId = (formData.get("sample_id") || "").toString().trim().toUpperCase();
  const tracking = (formData.get("tracking") || "").toString().trim();
  if (!sampleId) redirect("/fulfillment");
  try {
    await sql`update sample_registrations set tracking_number=${tracking || null} where sample_id=${sampleId}`;
  } catch {
    redirect(`/fulfillment?error=${encodeURIComponent("Could not save return tracking.")}`);
  }
  redirect(`/fulfillment?ok=${encodeURIComponent(tracking ? "Return tracking saved" : "Return tracking cleared")}`);
}
