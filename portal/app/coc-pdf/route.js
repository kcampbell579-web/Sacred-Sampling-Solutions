import { sql } from "@/lib/db";
import { fillLialCoc } from "@/lib/coc-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Public: serves the filled LIAL chain-of-custody PDF for a sample by ?id=.
// The lab scans the kit QR (which lands on /chain-of-custody?id=…) and can
// open/print the exact LIAL form from there.
export async function GET(request) {
  const url = new URL(request.url);
  const id = (url.searchParams.get("id") || "").trim().toUpperCase();
  const download = url.searchParams.get("dl") === "1";
  if (!id) return new Response("Missing sample id", { status: 400 });

  const cocRows = await sql`
    select sampler_name, collected_at, location, matrix, observations, signature_png
    from chain_of_custody where sample_id=${id} order by created_at desc limit 1`;
  if (!cocRows.length) return new Response("No chain of custody for this sample yet.", { status: 404 });

  const regRows = await sql`
    select sample_id, kit_code, kit_panel, customer_name, sample_source, city, state
    from sample_registrations where sample_id=${id} limit 1`;
  const reg = regRows[0] || { sample_id: id, kit_code: "", customer_name: cocRows[0].sampler_name };

  const pdf = await fillLialCoc({ coc: cocRows[0], reg });
  const filename = `COC-${id}.pdf`;

  return new Response(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
