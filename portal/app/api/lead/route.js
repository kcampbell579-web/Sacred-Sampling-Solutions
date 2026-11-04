import { insertLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Capture a lead from the marketing site (cross-origin). Accepts a JSON body or
// a navigator.sendBeacon text/plain body. Fire-and-forget: the site also emails
// via FormSubmit, so this never blocks the visitor.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req) {
  let b = {};
  try {
    const t = await req.text();
    b = t ? JSON.parse(t) : {};
  } catch {
    b = {};
  }
  const clean = (s, n = 2000) => (s == null ? "" : String(s)).trim().slice(0, n);

  const name = clean(b.name, 200);
  const email = clean(b.email, 200);
  const phone = clean(b.phone, 60);
  if (!name && !email && !phone) {
    return new Response(JSON.stringify({ ok: false, error: "empty" }), { status: 400, headers: CORS });
  }

  try {
    await insertLead({
      type: clean(b.type, 20),
      name,
      email: email.toLowerCase(),
      phone,
      message: clean(b.message, 4000),
      ref: clean(b.ref, 60).toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
      source: clean(b.source, 300),
      meta: b.meta ? clean(typeof b.meta === "string" ? b.meta : JSON.stringify(b.meta), 4000) : null,
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers: CORS });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS });
}
