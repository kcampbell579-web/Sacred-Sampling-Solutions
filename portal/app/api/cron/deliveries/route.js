import { processDeliveries } from "@/lib/deliveries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily backup check (vercel.json cron). Catches deliveries if the Shippo
// webhook isn't set up or a message was missed. Vercel sends
// "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set in the project.
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("forbidden", { status: 403 });
  }
  const r = await processDeliveries();
  return Response.json({ ok: true, ...r });
}
