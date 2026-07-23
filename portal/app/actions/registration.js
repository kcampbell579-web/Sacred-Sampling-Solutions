"use server";

import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseSampleId } from "@/lib/catalog";
import { redirect } from "next/navigation";

export async function registerSample(formData) {
  const user = await requireUser();
  const rawId = (formData.get("sample_id") || "").toString();
  const parsed = parseSampleId(rawId);

  const back = (msg, keepId) =>
    `/sampleregistration?error=${encodeURIComponent(msg)}${keepId ? `&id=${encodeURIComponent(rawId)}` : ""}`;

  if (!parsed) {
    redirect(back("Enter a valid Sample ID from your kit label, like SSS-COM-00001.", true));
  }
  const { sampleId, kit } = parsed;

  const firstName = (formData.get("first_name") || "").toString().trim();
  const lastName = (formData.get("last_name") || "").toString().trim();
  const email = (formData.get("email") || "").toString().trim().toLowerCase();
  const phone = (formData.get("phone") || "").toString().trim();
  const street = (formData.get("street") || "").toString().trim();
  const city = (formData.get("city") || "").toString().trim();
  const state = (formData.get("state") || "").toString().trim().toUpperCase();
  const zip = (formData.get("zip") || "").toString().trim();
  const waterSource = (formData.get("water_source") || "").toString().trim();
  const sampleSource = (formData.get("sample_source") || "").toString().trim();
  const roomLocation = (formData.get("room_location") || "").toString().trim();
  const consent = !!formData.get("consent");
  const marketing = !!formData.get("marketing");

  if (!firstName || !email) redirect(back("Add your name and email.", true));
  if (!consent) redirect(back("Please confirm you'll ship the same day you collect.", true));

  const existing = await sql`select sample_id, user_id from sample_registrations where sample_id=${sampleId}`;
  if (existing.length && existing[0].user_id && String(existing[0].user_id) !== String(user.id)) {
    redirect(back("That Sample ID is already registered to another account."));
  }

  const customerName = `${firstName} ${lastName}`.trim();

  if (existing.length) {
    await sql`
      update sample_registrations set
        kit_code=${kit.code}, kit_panel=${kit.title}, kit_slug=${kit.slug}, user_id=${user.id},
        customer_name=${customerName}, email=${email}, phone=${phone || null},
        street=${street || null}, city=${city || null}, state=${state || null}, zip=${zip || null},
        water_source=${waterSource || null}, sample_source=${sampleSource || null},
        room_location=${roomLocation || null},
        consent_same_day_ship=${consent}, marketing_opt_in=${marketing}
      where sample_id=${sampleId}`;
  } else {
    await sql`
      insert into sample_registrations
        (sample_id, kit_code, kit_panel, kit_slug, user_id, customer_name, email, phone,
         street, city, state, zip, water_source, sample_source, room_location,
         consent_same_day_ship, marketing_opt_in, status)
      values
        (${sampleId}, ${kit.code}, ${kit.title}, ${kit.slug}, ${user.id}, ${customerName}, ${email}, ${phone || null},
         ${street || null}, ${city || null}, ${state || null}, ${zip || null},
         ${waterSource || null}, ${sampleSource || null}, ${roomLocation || null},
         ${consent}, ${marketing}, 'With Customer for Collection')`;
  }

  redirect(`/training/${kit.slug}?id=${encodeURIComponent(sampleId)}`);
}
