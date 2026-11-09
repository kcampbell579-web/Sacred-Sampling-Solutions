import { sql } from "@/lib/db";
import { insertLead } from "@/lib/leads";
import { ensureAffiliateTables, cleanCode, notifyOwnerApplication, sendApplicationReceived } from "@/lib/affiliates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sacred Partners application from the marketing site's /affiliate page.
// Creates (or refreshes) a pending application for the owner to approve.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req) {
  let b = {};
  try { b = JSON.parse((await req.text()) || "{}"); } catch { b = {}; }
  const clean = (s, n) => (s == null ? "" : String(s)).trim().slice(0, n);

  if (clean(b._honey, 200)) return json({ ok: true }); // bot trap
  const name = clean(b.name, 120);
  const email = clean(b.email, 200).toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Please enter your name and a valid email." }, 400);
  }
  if (!b.agree) return json({ ok: false, error: "Please agree to the program terms." }, 400);

  const app = {
    name, email,
    website: clean(b.website, 300),
    audience: clean(b.audience, 80),
    channel: clean(b.channel, 80),
    preferred_code: cleanCode(b.preferred_code),
    about: clean(b.about, 2000),
  };

  try {
    await ensureAffiliateTables();
    const existing = await sql`select id, status from affiliates where email=${email}`;
    if (existing.length && existing[0].status === "approved") {
      return json({ ok: true, already: true });
    }
    await sql`
      insert into affiliates (email, name, website, audience, channel, preferred_code, about, agreed_terms_at, status)
      values (${email}, ${name}, ${app.website}, ${app.audience}, ${app.channel}, ${app.preferred_code || null}, ${app.about}, now(), 'pending')
      on conflict (email) do update set
        name=excluded.name, website=excluded.website, audience=excluded.audience, channel=excluded.channel,
        preferred_code=excluded.preferred_code, about=excluded.about, agreed_terms_at=now(),
        status=case when affiliates.status='paused' then affiliates.status else 'pending' end`;
  } catch {
    return json({ ok: false, error: "We couldn't save your application. Please try again." }, 500);
  }

  // Also show it in the Leads tab, and let both sides know. Best-effort.
  try {
    await insertLead({
      type: "affiliate", name, email, phone: "",
      message: [app.channel && `Platform: ${app.channel}`, app.audience && `Audience: ${app.audience}`, app.website, app.about].filter(Boolean).join(" · "),
      ref: app.preferred_code, source: "affiliate-apply", meta: null,
    });
  } catch {}
  await notifyOwnerApplication(app);
  await sendApplicationReceived(app);

  return json({ ok: true });
}
