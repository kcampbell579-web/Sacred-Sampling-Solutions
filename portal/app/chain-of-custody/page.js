import { sql } from "@/lib/db";
import CocDocument from "@/components/CocDocument";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chain of Custody — Sacred Sampling Solutions",
  robots: { index: false },
};

// Public, no-login view: the lab scans a kit's QR (which points here via the
// marketing domain) and the chain of custody opens by Sample ID.
export default async function PublicCoc({ searchParams }) {
  const id = (searchParams?.id || "").toString().trim().toUpperCase();

  let coc = null, reg = null, kit = null;
  if (id) {
    const cocRows = await sql`select coc_ref, coc_url, sampler_name, collected_at, location, matrix, observations, signature_png from chain_of_custody where sample_id=${id} order by created_at desc limit 1`;
    coc = cocRows[0] || null;
    if (coc) {
      const regRows = await sql`select sample_id, kit_code, kit_panel, customer_name, sample_source, city, state from sample_registrations where sample_id=${id} limit 1`;
      reg = regRows[0] || { sample_id: id, kit_code: "", kit_panel: "", customer_name: "", sample_source: "", city: "", state: "" };
      const kitRows = await sql`select title, panels, matrix from kit_types where code=${reg.kit_code}`;
      kit = kitRows[0] || { panels: "", matrix: "water" };
    }
  }

  return (
    <main className="page">
      <div className="wrap">
        {coc ? (
          <>
            <div className="coc-actions" style={{ marginBottom: 16, justifyContent: "flex-end" }}>
              <PrintButton />
            </div>
            <CocDocument coc={coc} reg={reg} kit={kit} />
          </>
        ) : (
          <div className="card center">
            <h2>Chain of custody not found</h2>
            <p className="muted mt">
              {id
                ? `No chain of custody has been generated for ${id} yet.`
                : "Add a Sample ID to this link to view its chain of custody."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
