import { sql } from "@/lib/db";
import { verifyUnsubToken } from "@/lib/unsub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function page(title, message) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="robots" content="noindex">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;background:#eef4fc;font-family:Manrope,Helvetica,Arial,sans-serif;color:#0e1520;display:grid;place-items:center;min-height:100vh;padding:24px">
<div style="max-width:460px;background:#fff;border:1px solid #dde5f0;border-radius:18px;padding:32px;text-align:center">
<h1 style="font-size:1.4rem;margin:0 0 10px">${title}</h1>
<p style="margin:0;color:#455267;line-height:1.6">${message}</p>
</div></body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

async function unsubscribe(email) {
  await sql`
    insert into mail_suppressions (email, reason)
    values (${email}, 'unsubscribed')
    on conflict (email) do nothing`;
  await sql`update mail_contacts set unsubscribed = true where lower(email) = ${email}`;
  // Pull them out of anything still waiting to go out.
  await sql`
    update mail_queue set status = 'skipped', error = 'unsubscribed'
     where status = 'queued' and lower(email) = ${email}`;
}

export async function GET(request) {
  const p = new URL(request.url).searchParams;
  const email = (p.get("e") || "").trim().toLowerCase();
  const token = p.get("t") || "";
  if (!email || !verifyUnsubToken(email, token)) {
    return page("Link not recognised", "That unsubscribe link is invalid or has expired. Reply to any of our emails and we&rsquo;ll remove you by hand.");
  }
  await unsubscribe(email);
  return page("You&rsquo;re unsubscribed", `<b>${email}</b> has been removed. You won&rsquo;t receive any further emails from this list.`);
}

// RFC 8058 one-click: mailbox providers POST here from their own Unsubscribe
// button, with no browser session and no confirmation step.
export async function POST(request) {
  const p = new URL(request.url).searchParams;
  const email = (p.get("e") || "").trim().toLowerCase();
  const token = p.get("t") || "";
  if (!email || !verifyUnsubToken(email, token)) return new Response("Bad token", { status: 400 });
  await unsubscribe(email);
  return new Response("OK", { status: 200 });
}
