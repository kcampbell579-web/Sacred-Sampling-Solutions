"use server";

import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { verifyPin, setMailerCookie, clearMailerCookie, mailerAuthed } from "@/lib/auth";
import { parseContacts, isEmail } from "@/lib/csv";
import { renderEmail, mergeTokens } from "@/lib/render";
import { sendEmail, fromHeader } from "@/lib/send";
import { runCampaignBatch } from "@/lib/dispatch";

const UNIT_SECONDS = { seconds: 1, minutes: 60, hours: 3600, days: 86400 };

function guard() {
  if (!mailerAuthed()) redirect("/");
}
function back(path, ok, error) {
  const q = error ? `error=${encodeURIComponent(error)}` : `ok=${encodeURIComponent(ok)}`;
  redirect(`${path}?${q}`);
}
function str(fd, key) {
  return (fd.get(key) || "").toString().trim();
}

// ── auth ───────────────────────────────────────────────────────────────────
export async function login(formData) {
  if (!verifyPin(str(formData, "pin"))) back("/", null, "Incorrect PIN.");
  setMailerCookie();
  redirect("/");
}

export async function logout() {
  clearMailerCookie();
  redirect("/");
}

// ── lists ──────────────────────────────────────────────────────────────────
export async function uploadList(formData) {
  guard();
  const file = formData.get("file");
  const name = str(formData, "name") || (file?.name || "List").replace(/\.[a-z]+$/i, "");
  if (!file || typeof file.text !== "function" || !file.size) {
    back("/", null, "Choose a CSV file to upload.");
  }

  let text;
  try {
    text = await file.text();
  } catch {
    back("/", null, "That file could not be read. Export it as CSV and try again.");
  }

  const { contacts, total } = parseContacts(text);
  if (!contacts.length) {
    back("/", null, `No valid email addresses found in ${file.name}. Make sure one column holds the addresses.`);
  }

  const [list] = await sql`insert into mail_lists (name) values (${name}) returning id`;

  // Insert in chunks so a large upload stays inside one statement's limits.
  const CHUNK = 500;
  let added = 0;
  for (let i = 0; i < contacts.length; i += CHUNK) {
    const slice = contacts.slice(i, i + CHUNK);
    const rows = await sql`
      insert into mail_contacts (list_id, email, name, fields)
      select ${list.id}, x.email, nullif(x.name, ''), x.fields
        from jsonb_to_recordset(${JSON.stringify(slice)}::jsonb)
             as x(email text, name text, fields jsonb)
      on conflict (list_id, email) do nothing
      returning id`;
    added += rows.length;
  }

  const dropped = total - added;
  revalidatePath("/");
  back("/", `Uploaded “${name}” — ${added} contact${added === 1 ? "" : "s"}${dropped > 0 ? `, ${dropped} row(s) skipped as invalid or duplicate` : ""}.`);
}

export async function deleteList(formData) {
  guard();
  const id = Number(formData.get("id"));
  if (!id) back("/", null, "Unknown list.");
  const [{ n }] = await sql`select count(*)::int as n from mail_campaigns where list_id = ${id}`;
  if (n > 0) back("/", null, "Delete that list's campaigns first.");
  await sql`delete from mail_lists where id = ${id}`;
  revalidatePath("/");
  back("/", "List deleted.");
}

// ── campaigns ──────────────────────────────────────────────────────────────
export async function createCampaign(formData) {
  guard();
  const listId = Number(formData.get("list_id"));
  const name = str(formData, "name");
  const fromEmail = str(formData, "from_email").toLowerCase();
  const replyTo = str(formData, "reply_to").toLowerCase();
  const subject = str(formData, "subject");
  const body = (formData.get("body") || "").toString();

  const every = Math.max(1, Number(formData.get("interval_value") || 1));
  const unit = str(formData, "interval_unit");
  const intervalSeconds = every * (UNIT_SECONDS[unit] || 3600);
  const batchSize = Math.min(500, Math.max(1, Number(formData.get("batch_size") || 1)));

  if (!listId) back("/", null, "Pick a list to send to.");
  if (!name) back("/", null, "Give the campaign a name.");
  if (!isEmail(fromEmail)) back("/", null, "Enter a valid From address.");
  if (replyTo && !isEmail(replyTo)) back("/", null, "Enter a valid Reply-To address, or leave it blank.");
  if (!subject) back("/", null, "Enter a subject line.");
  if (!body.trim()) back("/", null, "Write the message body.");

  const [c] = await sql`
    insert into mail_campaigns
      (name, list_id, from_name, from_email, reply_to, subject, body, body_is_html, interval_seconds, batch_size)
    values
      (${name}, ${listId}, ${str(formData, "from_name") || null}, ${fromEmail}, ${replyTo || null},
       ${subject}, ${body}, ${formData.get("body_is_html") === "on"}, ${intervalSeconds}, ${batchSize})
    returning id`;

  // Snapshot the list into the queue now, minus anyone already opted out. One
  // row per contact, and the unique constraint keeps it that way.
  await sql`
    insert into mail_queue (campaign_id, contact_id, email)
    select ${c.id}, ct.id, ct.email
      from mail_contacts ct
     where ct.list_id = ${listId}
       and ct.unsubscribed = false
       and not exists (select 1 from mail_suppressions s where s.email = ct.email)
    on conflict (campaign_id, contact_id) do nothing`;

  redirect(`/campaign/${c.id}?ok=${encodeURIComponent("Campaign created. Review it, send yourself a test, then start it.")}`);
}

export async function setCampaignStatus(formData) {
  guard();
  const id = Number(formData.get("id"));
  const status = str(formData, "status");
  const path = `/campaign/${id}`;
  if (!id || !["running", "paused"].includes(status)) back(path, null, "Unknown action.");

  if (status === "running") {
    const [c] = await sql`select from_email, subject from mail_campaigns where id = ${id}`;
    if (!c) back("/", null, "Campaign not found.");
    if (!process.env.RESEND_API_KEY) back(path, null, "RESEND_API_KEY is not set — nothing can be sent yet.");
    const [{ n }] = await sql`select count(*)::int as n from mail_queue where campaign_id = ${id} and status = 'queued'`;
    if (n === 0) back(path, null, "Nothing left in the queue for this campaign.");

    // next_send_at = now() means the very next dispatcher tick sends batch one.
    await sql`
      update mail_campaigns
         set status = 'running', next_send_at = now(),
             started_at = coalesce(started_at, now()), finished_at = null
       where id = ${id}`;
    revalidatePath(path);
    back(path, "Campaign started — the first batch goes out on the next dispatcher tick.");
  }

  await sql`update mail_campaigns set status = 'paused', next_send_at = null where id = ${id}`;
  revalidatePath(path);
  back(path, "Campaign paused. Nothing further will be sent until you resume it.");
}

export async function sendTest(formData) {
  guard();
  const id = Number(formData.get("id"));
  const to = str(formData, "test_email").toLowerCase();
  const path = `/campaign/${id}`;
  if (!isEmail(to)) back(path, null, "Enter a valid address to send the test to.");

  const [c] = await sql`
    select name, from_name, from_email, reply_to, subject, body, body_is_html
      from mail_campaigns where id = ${id}`;
  if (!c) back("/", null, "Campaign not found.");

  const contact = { email: to, name: "", fields: {} };
  const { html, text, unsubscribeUrl } = renderEmail({ body: c.body, bodyIsHtml: c.body_is_html, contact });
  const res = await sendEmail({
    from: fromHeader(c.from_name, c.from_email),
    replyTo: c.reply_to || null,
    to,
    subject: `[TEST] ${mergeTokens(c.subject, contact)}`,
    html,
    text,
    unsubscribeUrl,
  });

  if (!res.ok) back(path, null, `Test failed: ${res.error}`);
  back(path, `Test sent to ${to}.`);
}

// Release one batch immediately instead of waiting for the clock. Also resets
// the clock, so "now + interval" is measured from this send.
export async function sendNextBatch(formData) {
  guard();
  const id = Number(formData.get("id"));
  const path = `/campaign/${id}`;
  const [c] = await sql`
    select id, name, from_name, from_email, reply_to, subject, body, body_is_html, batch_size, interval_seconds, status
      from mail_campaigns where id = ${id}`;
  if (!c) back("/", null, "Campaign not found.");
  if (c.status !== "running") back(path, null, "Start the campaign first.");

  await sql`
    update mail_campaigns
       set next_send_at = now() + make_interval(secs => greatest(interval_seconds, 1))
     where id = ${id}`;

  const r = await runCampaignBatch(c);
  revalidatePath(path);
  back(path, `Batch sent — ${r.sent} delivered, ${r.failed} failed, ${r.skipped} skipped.`);
}

export async function retryFailed(formData) {
  guard();
  const id = Number(formData.get("id"));
  const path = `/campaign/${id}`;
  const rows = await sql`
    update mail_queue set status = 'queued', error = null
     where campaign_id = ${id} and status in ('failed', 'sending')
    returning id`;
  if (rows.length) {
    await sql`
      update mail_campaigns set status = 'running', finished_at = null,
             next_send_at = coalesce(next_send_at, now())
       where id = ${id} and status = 'done'`;
  }
  revalidatePath(path);
  back(path, `${rows.length} message(s) put back in the queue.`);
}

export async function deleteCampaign(formData) {
  guard();
  const id = Number(formData.get("id"));
  await sql`delete from mail_campaigns where id = ${id}`;
  revalidatePath("/");
  back("/", "Campaign deleted.");
}
