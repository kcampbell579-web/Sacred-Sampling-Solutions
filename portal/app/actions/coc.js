"use server";

import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { cocPublicUrl } from "@/lib/coc";
import { redirect } from "next/navigation";

export async function generateCOC(formData) {
  const user = await requireUser();
  const sampleId = (formData.get("sample_id") || "").toString().trim().toUpperCase();
  const collectedDate = (formData.get("collected_date") || "").toString();
  const collectedTime = (formData.get("collected_time") || "").toString();
  const location = (formData.get("location") || "").toString().trim();
  const matrix = (formData.get("matrix") || "").toString().trim();
  const observations = (formData.get("observations") || "").toString().trim();
  const signature = (formData.get("signature") || "").toString().trim();
  const certify = !!formData.get("certify");

  const back = (msg) => `/collect?id=${encodeURIComponent(sampleId)}&error=${encodeURIComponent(msg)}`;

  const rows = await sql`select sample_id, customer_name from sample_registrations where sample_id=${sampleId} and user_id=${user.id}`;
  if (!rows.length) redirect("/dashboard");
  if (!collectedDate || signature.length < 2) redirect(back("Add the collection date and sign with your full name."));
  if (!certify) redirect(back("Please certify the information to generate your chain of custody."));

  const collectedAt = collectedTime ? `${collectedDate}T${collectedTime}` : collectedDate;
  const d = new Date();
  const ref = `COC-${sampleId.replace(/[^A-Z0-9]/gi, "")}-${d.toISOString().slice(2, 10).replace(/-/g, "")}`;
  const url = cocPublicUrl(sampleId);
  const samplerName = rows[0].customer_name || signature;

  // One COC per sample — replace on regeneration.
  await sql`delete from chain_of_custody where sample_id=${sampleId}`;
  await sql`
    insert into chain_of_custody
      (sample_id, coc_ref, coc_url, sampler_name, collected_at, location, matrix, observations, signature_png)
    values
      (${sampleId}, ${ref}, ${url}, ${samplerName}, ${collectedAt}, ${location || null}, ${matrix || null}, ${observations || null}, ${signature})`;
  await sql`update sample_registrations set coc_url=${url}, coc_created=now() where sample_id=${sampleId}`;

  redirect(`/collect?id=${encodeURIComponent(sampleId)}&done=1`);
}
