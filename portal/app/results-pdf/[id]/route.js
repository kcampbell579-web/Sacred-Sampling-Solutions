import { getUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { fulfillAuthed } from "@/lib/fulfillauth";
import { labAuthed } from "@/lib/labauth";

export const dynamic = "force-dynamic";

// Streams an uploaded result PDF stored in result_files (base64 in Postgres).
// Access: the customer who owns the sample, or signed-in staff (fulfillment/lab).
export async function GET(_req, { params }) {
  const id = decodeURIComponent(params?.id || "").toUpperCase();
  if (!id) return new Response("Not found", { status: 404 });

  let allowed = fulfillAuthed() || labAuthed();
  if (!allowed) {
    const user = await getUser();
    if (!user) return new Response("Please sign in to view this report.", { status: 401 });
    const owned = await sql`select 1 from sample_registrations where sample_id=${id} and user_id=${user.id} limit 1`;
    allowed = owned.length > 0;
  }
  if (!allowed) return new Response("Not found", { status: 404 });

  const rows = await sql`select pdf_b64, filename, content_type from result_files where sample_id=${id}`;
  if (!rows.length) return new Response("Not found", { status: 404 });

  const { pdf_b64, filename, content_type } = rows[0];
  const buf = Buffer.from(pdf_b64, "base64");
  const safeName = (filename || `${id}.pdf`).replace(/[^\w.\-]/g, "_");
  return new Response(buf, {
    headers: {
      "Content-Type": content_type || "application/pdf",
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
