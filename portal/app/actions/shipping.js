"use server";

import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createReturnLabel } from "@/lib/shipping";
import { redirect } from "next/navigation";

export async function generateLabel(formData) {
  const user = await requireUser();
  const sampleId = (formData.get("sample_id") || "").toString().trim().toUpperCase();
  const back = (q) => `/shipping?id=${encodeURIComponent(sampleId)}&${q}`;

  const owned = await sql`select sample_id from sample_registrations where sample_id=${sampleId} and user_id=${user.id}`;
  if (!owned.length) redirect("/dashboard");

  // Never buy a second label if one already exists for this sample.
  const existing = await sql`select id from shipments where sample_id=${sampleId} order by created_at desc limit 1`;
  if (existing.length) redirect(back("label=exists"));

  const customer = {
    name: (formData.get("name") || user.name || "").toString().trim(),
    street1: (formData.get("street1") || "").toString().trim(),
    street2: (formData.get("street2") || "").toString().trim(),
    city: (formData.get("city") || "").toString().trim(),
    state: (formData.get("state") || "").toString().trim().toUpperCase(),
    zip: (formData.get("zip") || "").toString().trim(),
    phone: (formData.get("phone") || user.phone || "").toString().trim(),
    email: user.email || "",
  };

  if (!customer.street1 || !customer.city || !customer.state || !customer.zip) {
    redirect(back("error=" + encodeURIComponent("Please fill in your full return address (street, city, state, ZIP).")));
  }

  let label;
  try {
    label = await createReturnLabel(customer);
  } catch (e) {
    redirect(back("error=" + encodeURIComponent(e?.message || "Could not create the label. Please try again.")));
  }

  await sql`
    insert into shipments
      (sample_id, carrier, service, tracking, label_url, rate,
       from_name, from_street1, from_street2, from_city, from_state, from_zip, from_phone)
    values
      (${sampleId}, ${label.carrier}, ${label.service}, ${label.tracking}, ${label.labelUrl}, ${label.rate},
       ${customer.name}, ${customer.street1}, ${customer.street2 || null}, ${customer.city},
       ${customer.state}, ${customer.zip}, ${customer.phone || null})`;

  if (label.tracking) {
    await sql`update sample_registrations set tracking_number=${label.tracking} where sample_id=${sampleId}`;
  }

  redirect(back("label=1"));
}

// Advance the sample to "In Route to Lab" once the customer has handed it off.
export async function markShipped(formData) {
  const user = await requireUser();
  const sampleId = (formData.get("sample_id") || "").toString().trim().toUpperCase();

  const owned = await sql`select sample_id from sample_registrations where sample_id=${sampleId} and user_id=${user.id}`;
  if (!owned.length) redirect("/dashboard");

  await sql`update sample_registrations set status='In Route to Lab', ship_date=now() where sample_id=${sampleId}`;
  redirect(`/dashboard?shipped=${encodeURIComponent(sampleId)}`);
}
