import { runDue } from "@/lib/dispatch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// The heartbeat. Vercel Cron calls this every minute (see vercel.json) with
// `Authorization: Bearer $CRON_SECRET`; any other scheduler can call it with
// ?key=$CRON_SECRET. Each call releases at most one batch per running
// campaign, so the schedule only needs to be *at least* as frequent as the
// shortest interval you set — never exactly equal to it.
function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  if (header === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("key") === secret;
}

async function handle(request) {
  if (!process.env.CRON_SECRET) {
    return Response.json(
      { error: "CRON_SECRET is not set — the dispatcher is disabled until it is." },
      { status: 503 }
    );
  }
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });

  try {
    const result = await runDue();
    return Response.json({ ok: true, ...result });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || "dispatch failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
