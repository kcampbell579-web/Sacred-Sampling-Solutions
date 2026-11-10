"use server";

import { sql } from "@/lib/db";
import { verifyPin, setFulfillCookie, clearFulfillCookie, fulfillAuthed } from "@/lib/fulfillauth";
import { sendOrderShippedEmail } from "@/lib/email/orderShipped";
import { createOutboundLabel } from "@/lib/shipping";
import { forgetTracking } from "@/lib/tracking";
import { registerTracking } from "@/lib/deliveries";
import { redirect } from "next/navigation";

const STATUSES = ["new", "shipped", "fulfilled"];

export async function fulfillLogin(formData) {
  const pin = (formData.get("pin") || "").toString();
  if (!verifyPin(pin)) redirect(`/fulfillment?tab=orders&error=${encodeURIComponent("Incorrect PIN.")}`);
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
        await registerTracking(tracking);
      } catch {
        redirect(`/fulfillment?tab=orders&error=${encodeURIComponent("Order marked shipped, but tracking could not be saved — run migrate-orders-tracking.sql in Neon first.")}`);
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
  redirect(`/fulfillment?tab=orders&ok=${encodeURIComponent("Order updated")}`);
}

// Add or update the outbound (warehouse -> customer) UPS tracking number.
export async function saveOutboundTracking(formData) {
  if (!fulfillAuthed()) redirect("/fulfillment");
  const id = Number(formData.get("id"));
  const tracking = (formData.get("tracking") || "").toString().trim();
  if (!id) redirect("/fulfillment");
  try {
    await sql`update orders set tracking_number=${tracking || null} where id=${id}`;
    if (tracking) await registerTracking(tracking);
  } catch {
    redirect(`/fulfillment?tab=orders&error=${encodeURIComponent("Could not save tracking — run migrate-orders-tracking.sql in Neon first.")}`);
  }
  redirect(`/fulfillment?tab=orders&ok=${encodeURIComponent(tracking ? "Tracking saved" : "Tracking cleared")}`);
}

// Force a fresh UPS status lookup for one order's packages (outbound + return).
export async function refreshTracking(formData) {
  if (!fulfillAuthed()) redirect("/fulfillment");
  for (const n of formData.getAll("number")) await forgetTracking(String(n));
  redirect(`/fulfillment?tab=orders&ok=${encodeURIComponent("Checked UPS for the latest status.")}`);
}

// Buy a prepaid outbound (warehouse -> customer) UPS label via Shippo, straight
// from the fulfillment card. Ship-to fields come from the form (pre-filled from
// the order, operator-confirmed). Saves the tracking # + label PDF URL.
export async function buyOutboundLabel(formData) {
  if (!fulfillAuthed()) redirect("/fulfillment");
  const id = Number(formData.get("id"));
  if (!id) redirect("/fulfillment");

  const to = {
    name: (formData.get("name") || "").toString().trim(),
    street1: (formData.get("street1") || "").toString().trim(),
    street2: (formData.get("street2") || "").toString().trim(),
    city: (formData.get("city") || "").toString().trim(),
    state: (formData.get("state") || "").toString().trim().toUpperCase(),
    zip: (formData.get("zip") || "").toString().trim(),
    phone: (formData.get("phone") || "").toString().trim(),
  };
  if (!to.name || !to.street1 || !to.city || !to.state || !to.zip) {
    redirect(`/fulfillment?tab=orders&error=${encodeURIComponent("Fill in the full ship-to address (name, street, city, state, ZIP) before buying a label.")}`);
  }

  let label;
  try {
    label = await createOutboundLabel(to);
  } catch (e) {
    redirect(`/fulfillment?tab=orders&error=${encodeURIComponent(e?.message || "Could not buy the UPS label. Please try again.")}`);
  }

  try {
    await sql`alter table orders add column if not exists tracking_number text`;
    await sql`alter table orders add column if not exists outbound_label_url text`;
  } catch {}
  await sql`update orders set tracking_number=${label.tracking || null}, outbound_label_url=${label.labelUrl || null} where id=${id}`;

  redirect(`/fulfillment?tab=orders&ok=${encodeURIComponent("UPS label purchased" + (label.tracking ? " — " + label.tracking : ""))}`);
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
    redirect(`/fulfillment?tab=orders&error=${encodeURIComponent("Could not save return tracking.")}`);
  }
  redirect(`/fulfillment?tab=orders&ok=${encodeURIComponent(tracking ? "Return tracking saved" : "Return tracking cleared")}`);
}

// Advance the sample to "Received by Lab" straight from the fulfillment card —
// for when you confirm arrival at the lab without entering a return tracking #.
export async function markReceivedByLab(formData) {
  if (!fulfillAuthed()) redirect("/fulfillment");
  const sampleId = (formData.get("sample_id") || "").toString().trim().toUpperCase();
  if (!sampleId) redirect("/fulfillment");
  try {
    await sql`update sample_registrations set status='Received by Lab' where sample_id=${sampleId}`;
  } catch {
    redirect(`/fulfillment?tab=orders&error=${encodeURIComponent("Could not update status.")}`);
  }
  redirect(`/fulfillment?tab=orders&ok=${encodeURIComponent("Marked received by lab — " + sampleId)}`);
}

// Upload a lab-result PDF (or paste a hosted URL) and release results to the
// customer. The PDF is stored in-database (base64) and served through
// /results-pdf/<SampleID>; setting status to "Results Ready" surfaces it on the
// customer's results page.
export async function fulfillAttachResult(formData) {
  if (!fulfillAuthed()) redirect("/fulfillment");
  const sampleId = (formData.get("sample_id") || "").toString().trim().toUpperCase();
  const summary = (formData.get("summary") || "").toString().trim();
  const url = (formData.get("report_url") || "").toString().trim();
  const file = formData.get("file");
  if (!sampleId) redirect("/fulfillment");

  const exists = await sql`select 1 from sample_registrations where sample_id=${sampleId} limit 1`;
  if (!exists.length) redirect(`/fulfillment?tab=orders&error=${encodeURIComponent("No registered sample " + sampleId)}`);

  let reportLink = url || null;

  const hasFile = file && typeof file === "object" && typeof file.arrayBuffer === "function" && file.size > 0;
  if (hasFile) {
    const type = file.type || "application/pdf";
    const name = file.name || "report.pdf";
    if (!/pdf/i.test(type) && !/\.pdf$/i.test(name)) {
      redirect(`/fulfillment?tab=orders&error=${encodeURIComponent("Please upload a PDF file (or paste a hosted URL).")}`);
    }
    if (file.size > 4.5 * 1024 * 1024) {
      redirect(`/fulfillment?tab=orders&error=${encodeURIComponent("That PDF is larger than 4.5 MB. Compress it, or paste a hosted report URL instead.")}`);
    }
    const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    await sql`create table if not exists result_files (
      sample_id    text primary key references sample_registrations(sample_id) on delete cascade,
      pdf_b64      text not null,
      filename     text,
      content_type text,
      created_at   timestamptz not null default now())`;
    await sql`insert into result_files (sample_id, pdf_b64, filename, content_type)
              values (${sampleId}, ${b64}, ${name}, ${type})
              on conflict (sample_id) do update
                set pdf_b64=excluded.pdf_b64, filename=excluded.filename,
                    content_type=excluded.content_type, created_at=now()`;
    reportLink = `/results-pdf/${encodeURIComponent(sampleId)}`;
  }

  if (!reportLink && !summary) {
    redirect(`/fulfillment?tab=orders&error=${encodeURIComponent("Attach a PDF, paste a report URL, or add a summary before releasing.")}`);
  }

  await sql`update sample_registrations set lab_report_pdf=${reportLink}, status='Results Ready' where sample_id=${sampleId}`;
  await sql`delete from results where sample_id=${sampleId}`;
  await sql`insert into results (sample_id, report_pdf, summary) values (${sampleId}, ${reportLink}, ${summary || null})`;

  redirect(`/fulfillment?tab=orders&ok=${encodeURIComponent("Results released to the customer — " + sampleId)}`);
}
