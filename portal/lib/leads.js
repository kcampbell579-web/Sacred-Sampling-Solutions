import { sql } from "@/lib/db";

// Lead types and their display labels (order = tab order in the Leads menu).
export const LEAD_TYPES = [
  ["welcome", "Welcome sign-ups"],
  ["affiliate", "Affiliates"],
  ["inquiry", "Inquiries"],
  ["callback", "Call-backs"],
  ["notify", "Notify-me"],
  ["other", "Other"],
];
export const LEAD_TYPE_KEYS = LEAD_TYPES.map(([k]) => k);
export const leadTypeLabel = (t) => (LEAD_TYPES.find(([k]) => k === t) || [t, t])[1];

export async function ensureLeadsTable() {
  try {
    await sql`create table if not exists leads (
      id         bigint generated always as identity primary key,
      type       text not null default 'inquiry',
      name       text,
      email      text,
      phone      text,
      message    text,
      ref        text,
      source     text,
      meta       text,
      created_at timestamptz not null default now())`;
  } catch {}
}

export async function insertLead(l) {
  await ensureLeadsTable();
  const type = LEAD_TYPE_KEYS.includes(l.type) ? l.type : "inquiry";
  await sql`
    insert into leads (type, name, email, phone, message, ref, source, meta)
    values (${type}, ${l.name || null}, ${l.email || null}, ${l.phone || null},
            ${l.message || null}, ${l.ref || null}, ${l.source || null}, ${l.meta || null})`;
}

export async function listLeads(type) {
  await ensureLeadsTable();
  try {
    return type
      ? await sql`select * from leads where type=${type} order by created_at desc limit 500`
      : await sql`select * from leads order by created_at desc limit 500`;
  } catch {
    return [];
  }
}

export async function leadCountsByType() {
  await ensureLeadsTable();
  try {
    const rows = await sql`select type, count(*)::int as n from leads group by type`;
    const m = {};
    for (const r of rows) m[r.type] = r.n;
    return m;
  } catch {
    return {};
  }
}
