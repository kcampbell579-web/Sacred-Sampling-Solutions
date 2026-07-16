"use server";

import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function activateKit(formData) {
  const user = await requireUser();
  const kitId = (formData.get("kit_id") || "").toString().trim().toUpperCase();
  const err = (msg, keep) =>
    `/activate?error=${encodeURIComponent(msg)}${keep ? `&kit=${encodeURIComponent(kitId)}` : ""}`;

  if (!kitId) redirect(err("Enter the Kit ID printed on your kit insert."));

  const rows = await sql`select kit_id, activated_by from kits where kit_id=${kitId}`;
  if (!rows.length) redirect(err("That Kit ID wasn't found. Double-check the code on your insert.", true));

  const kit = rows[0];
  if (kit.activated_by && String(kit.activated_by) !== String(user.id)) {
    redirect(err("That kit is already registered to another account."));
  }
  if (!kit.activated_by) {
    await sql`update kits set activated_by=${user.id}, status='activated', activated_at=now() where kit_id=${kitId}`;
  }
  redirect(`/kit/${encodeURIComponent(kitId)}`);
}

export async function saveSample(formData) {
  const user = await requireUser();
  const kitId = (formData.get("kit_id") || "").toString().trim().toUpperCase();
  const location = (formData.get("location") || "").toString().trim();
  const collected = (formData.get("collected_on") || "").toString();
  const notes = (formData.get("notes") || "").toString().trim();
  const tracking = (formData.get("tracking") || "").toString().trim();

  const owned = await sql`select kit_id from kits where kit_id=${kitId} and activated_by=${user.id}`;
  if (!owned.length) redirect("/dashboard");

  await sql`
    insert into samples (kit_id, location, collected_on, notes, tracking)
    values (${kitId}, ${location || null}, ${collected || null}, ${notes || null}, ${tracking || null})`;
  redirect(`/kit/${encodeURIComponent(kitId)}?saved=1`);
}
