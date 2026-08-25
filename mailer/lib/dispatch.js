import { sql } from "@/lib/db";
import { renderEmail, mergeTokens } from "@/lib/render";
import { sendEmail, fromHeader } from "@/lib/send";

// The dispatcher. Called on a schedule (Vercel Cron → /api/cron) and by the
// "Send next batch now" button. It is safe to call as often as you like: a
// campaign only releases mail once its own clock (`next_send_at`) comes due,
// and claiming is done in single atomic UPDATEs so two overlapping runs can
// never send the same row twice.

// Claim every campaign whose interval has elapsed, pushing its clock forward in
// the same statement. Whoever wins the UPDATE owns this tick.
async function claimDueCampaigns(limit) {
  return sql`
    update mail_campaigns c
       set next_send_at = now() + make_interval(secs => greatest(c.interval_seconds, 1))
     where c.id in (
       select id from mail_campaigns
        where status = 'running'
          and (next_send_at is null or next_send_at <= now())
        order by next_send_at nulls first
        limit ${limit}
        for update skip locked
     )
    returning c.id, c.name, c.from_name, c.from_email, c.reply_to, c.subject,
              c.body, c.body_is_html, c.batch_size, c.interval_seconds`;
}

// Claim this tick's slice of the queue the same way.
async function claimQueueRows(campaignId, batchSize) {
  return sql`
    update mail_queue q
       set status = 'sending', attempts = q.attempts + 1
     where q.id in (
       select id from mail_queue
        where campaign_id = ${campaignId} and status = 'queued'
        order by id
        limit ${batchSize}
        for update skip locked
     )
    returning q.id, q.contact_id, q.email`;
}

async function loadContacts(ids) {
  if (!ids.length) return new Map();
  const rows = await sql`
    select id, email, name, fields, unsubscribed
      from mail_contacts
     where id = any(${ids}::bigint[])`;
  return new Map(rows.map((r) => [String(r.id), r]));
}

async function suppressedSet(emails) {
  if (!emails.length) return new Set();
  const rows = await sql`select email from mail_suppressions where email = any(${emails}::text[])`;
  return new Set(rows.map((r) => r.email));
}

async function finishIfDrained(campaignId) {
  const [{ n }] = await sql`
    select count(*)::int as n from mail_queue
     where campaign_id = ${campaignId} and status in ('queued', 'sending')`;
  if (n === 0) {
    await sql`
      update mail_campaigns
         set status = 'done', finished_at = now(), next_send_at = null
       where id = ${campaignId} and status = 'running'`;
    return true;
  }
  return false;
}

// Send one campaign's batch. Exported so "Send next batch now" can reuse it.
export async function runCampaignBatch(campaign) {
  const rows = await claimQueueRows(campaign.id, Math.max(1, campaign.batch_size || 1));
  if (!rows.length) {
    const done = await finishIfDrained(campaign.id);
    return { campaignId: campaign.id, sent: 0, failed: 0, skipped: 0, done };
  }

  const contacts = await loadContacts(rows.map((r) => Number(r.contact_id)));
  const suppressed = await suppressedSet(rows.map((r) => r.email));
  const from = fromHeader(campaign.from_name, campaign.from_email);
  let sent = 0, failed = 0, skipped = 0;

  for (const row of rows) {
    const contact = contacts.get(String(row.contact_id)) || { email: row.email, name: "", fields: {} };

    // Opt-outs are checked at send time, not at queue time, so someone who
    // unsubscribes mid-campaign is dropped from the rest of it.
    if (contact.unsubscribed || suppressed.has(row.email)) {
      await sql`update mail_queue set status='skipped', error='unsubscribed' where id=${row.id}`;
      skipped++;
      continue;
    }

    const { html, text, unsubscribeUrl } = renderEmail({
      body: campaign.body,
      bodyIsHtml: campaign.body_is_html,
      contact,
    });
    const subject = mergeTokens(campaign.subject, contact);

    const res = await sendEmail({
      from,
      replyTo: campaign.reply_to || null,
      to: row.email,
      subject,
      html,
      text,
      unsubscribeUrl,
    });

    if (res.ok) {
      await sql`update mail_queue set status='sent', sent_at=now(), error=null where id=${row.id}`;
      sent++;
    } else {
      await sql`update mail_queue set status='failed', error=${String(res.error).slice(0, 400)} where id=${row.id}`;
      failed++;
    }
  }

  const done = await finishIfDrained(campaign.id);
  return { campaignId: campaign.id, sent, failed, skipped, done };
}

export async function runDue({ maxCampaigns = 10 } = {}) {
  const due = await claimDueCampaigns(maxCampaigns);
  const results = [];
  for (const c of due) results.push(await runCampaignBatch(c));
  return {
    campaigns: due.length,
    sent: results.reduce((n, r) => n + r.sent, 0),
    failed: results.reduce((n, r) => n + r.failed, 0),
    skipped: results.reduce((n, r) => n + r.skipped, 0),
    results,
  };
}
