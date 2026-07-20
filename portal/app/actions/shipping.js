"use server";

import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createReturnLabel } from "@/lib/shipping";
import { redirect } from "next/navigation";

export async function generateLabel(formData) {
  const user = await requireUser();
  const kitId = (formData.get("kit_id") || "").toString().trim().toUpperCase();
  const back = (q) => `/kit/${encodeURIComponent(kitId)}?${q}`;

  const owned = await sql`select kit_id from kits where kit_id=${kitId} and activated_by=${user.id}`;
  if (!owned.length) redirect("/dashboard");

  // Never buy a second label if one already exists for this kit.
  const existing = await sql`select id from shipments where kit_id=${kitId} order by created_at desc limit 1`;
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
      (kit_id, carrier, service, tracking, label_url, rate,
       from_name, from_street1, from_street2, from_city, from_state, from_zip, from_phone)
    values
      (${kitId}, ${label.carrier}, ${label.service}, ${label.tracking}, ${label.labelUrl}, ${label.rate},
       ${customer.name}, ${customer.street1}, ${customer.street2 || null}, ${customer.city},
       ${customer.state}, ${customer.zip}, ${customer.phone || null})`;

  // Mirror the tracking number onto the latest sample row so it shows in the timeline card.
  if (label.tracking) {
    await sql`update samples set tracking=${label.tracking} where kit_id=${kitId}`;
  }

  redirect(back("label=1"));
}
