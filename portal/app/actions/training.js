"use server";

import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function saveAcknowledgment(formData) {
  const user = await requireUser();
  const slug = (formData.get("slug") || "").toString();
  const sampleId = (formData.get("sample_id") || "").toString().trim().toUpperCase();
  const signedName = (formData.get("signed_name") || "").toString().trim();
  const ackWatched = !!formData.get("ack_watched");
  const ackDeviations = !!formData.get("ack_deviations");
  const ackResponsibility = !!formData.get("ack_responsibility");

  const back = (msg) =>
    `/training/${encodeURIComponent(slug)}?id=${encodeURIComponent(sampleId)}&error=${encodeURIComponent(msg)}`;

  if (!ackWatched || !ackDeviations || !ackResponsibility || signedName.length < 2) {
    redirect(back("Please watch the full video, check all three boxes, and sign with your name."));
  }

  if (sampleId) {
    const owned = await sql`select sample_id from sample_registrations where sample_id=${sampleId} and user_id=${user.id}`;
    if (!owned.length) redirect("/dashboard");
    await sql`
      insert into training_acknowledgments
        (sample_id, user_id, ack_watched, ack_deviations, ack_responsibility, signed_name)
      values (${sampleId}, ${user.id}, true, true, true, ${signedName})`;
  }

  // Next step in the flow: Chain of Custody / collection.
  redirect(sampleId ? `/collect?id=${encodeURIComponent(sampleId)}` : "/dashboard");
}
