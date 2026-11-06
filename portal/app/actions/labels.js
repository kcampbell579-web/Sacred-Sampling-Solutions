"use server";

import { sql } from "@/lib/db";
import { fulfillAuthed } from "@/lib/fulfillauth";
import { KIT_TYPES } from "@/lib/catalog";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

// Mint a batch of Sample IDs and log them, then show the printable QR sheet.
// IDs come from the sample_id_seq sequence, which starts at 13000 so they can't
// collide with IDs already in use. Each becomes SS-<CODE>-<n> (e.g. SS-NO2-13000)
// and the printed QR encodes /sampleregistration?id=<SampleID>.
export async function mintLabels(formData) {
  if (!fulfillAuthed()) redirect("/fulfillment");

  const code = (formData.get("kit_code") || "").toString().trim().toUpperCase();
  if (!KIT_TYPES[code]) {
    redirect("/fulfillment/labels?error=" + encodeURIComponent("Pick a kit type to generate labels for."));
  }

  let qty = parseInt((formData.get("qty") || "1").toString(), 10);
  if (!(qty > 0)) qty = 1;
  qty = Math.min(qty, 40); // one printable sheet at a time

  // Self-healing setup so the tool works even before the migration is run.
  await sql`create sequence if not exists sample_id_seq start with 13000 increment by 1`;
  await sql`create table if not exists issued_sample_ids (
    sample_id  text primary key,
    kit_code   text not null,
    batch      text,
    created_at timestamptz not null default now()
  )`;

  const rows = await sql`select nextval('sample_id_seq')::int as n from generate_series(1, ${qty}::int)`;
  const batch = randomUUID();

  for (const r of rows) {
    const sid = `SS-${code}-${r.n}`;
    await sql`insert into issued_sample_ids (sample_id, kit_code, batch)
              values (${sid}, ${code}, ${batch})
              on conflict (sample_id) do nothing`;
  }

  redirect(`/fulfillment/labels?batch=${encodeURIComponent(batch)}`);
}
