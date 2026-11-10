import { processDeliveries } from "@/lib/deliveries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Shippo "track_updated" webhook. Set it up in Shippo → Settings → Webhooks:
//   URL:   https://app.sacredsamplingsolutions.com/api/shippo-webhook
//   Event: track_updated
// The payload is only a hint: before acting we look the number up with Shippo's
// API ourselves, so a forged request can't trigger anything. If
// SHIPPO_WEBHOOK_TOKEN is set in Vercel, the URL must also end in ?token=<it>.
export async function POST(req) {
  const want = process.env.SHIPPO_WEBHOOK_TOKEN;
  if (want && new URL(req.url).searchParams.get("token") !== want) {
    return new Response("forbidden", { status: 403 });
  }
  let body = {};
  try { body = await req.json(); } catch {}
  const d = body && body.data ? body.data : body;
  const number = d && d.tracking_number;
  const status = String((d && d.tracking_status && d.tracking_status.status) || "").toUpperCase();

  // Only deliveries need action; other updates are picked up by the page/cron.
  if (number && (status === "DELIVERED" || !status)) {
    const r = await processDeliveries({ numbers: [number] });
    return Response.json({ ok: true, ...r });
  }
  return Response.json({ ok: true, ignored: status || "no tracking number" });
}

export function GET() {
  return new Response("Shippo webhook endpoint (POST only).", { status: 200 });
}
