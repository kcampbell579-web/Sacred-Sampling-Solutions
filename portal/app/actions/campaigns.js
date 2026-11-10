"use server";

import { fulfillAuthed } from "@/lib/fulfillauth";
import { createSocialCodes } from "@/lib/socialCodes";
import { redirect } from "next/navigation";

export async function createSocialCodesAction() {
  if (!fulfillAuthed()) redirect("/fulfillment");
  const r = await createSocialCodes();
  const base = "/fulfillment?tab=campaigns&";
  if (r.error) redirect(base + "error=" + encodeURIComponent(`Stripe refused: ${r.error}`));
  const parts = [];
  if (r.created.length) parts.push(`Created ${r.created.length} code${r.created.length === 1 ? "" : "s"}`);
  if (r.existing.length) parts.push(`${r.existing.length} already existed`);
  if (r.failed.length) redirect(base + "error=" + encodeURIComponent(`${parts.join(", ")}. Failed: ${r.failed.join("; ")}`));
  redirect(base + "ok=" + encodeURIComponent(`${parts.join(", ")}. All 25 social codes are live ($15 off, first order only).`));
}
