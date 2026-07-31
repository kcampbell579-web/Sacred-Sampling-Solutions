import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chain of Custody — Sacred Sampling Solutions",
  robots: { index: false },
};

// Public, no-login view: the lab scans a kit's QR (which points here via the
// marketing domain) and the EXACT LIAL chain-of-custody form opens by Sample
// ID — served as the real filled LIAL PDF from /coc-pdf.
export default async function PublicCoc({ searchParams }) {
  const id = (searchParams?.id || "").toString().trim().toUpperCase();

  let coc = null,
    reg = null;
  if (id) {
    const cocRows = await sql`select coc_ref, sampler_name, collected_at from chain_of_custody where sample_id=${id} order by created_at desc limit 1`;
    coc = cocRows[0] || null;
    if (coc) {
      const regRows = await sql`select sample_id, kit_code, kit_panel, customer_name from sample_registrations where sample_id=${id} limit 1`;
      reg = regRows[0] || { sample_id: id, kit_code: "", kit_panel: "", customer_name: "" };
    }
  }

  const pdfUrl = `/coc-pdf?id=${encodeURIComponent(id)}`;

  return (
    <main className="page">
      <div className="wrap">
        {coc ? (
          <>
            <div className="coc-head">
              <div>
                <span className="eyebrow">Chain of Custody</span>
                <h1 style={{ margin: "4px 0 2px" }}>{reg.sample_id}</h1>
                <p className="muted">
                  {reg.kit_panel || reg.kit_code} · Ref {coc.coc_ref}
                </p>
              </div>
              <div className="coc-actions">
                <a className="btn btn-ghost btn-sm" href={pdfUrl} target="_blank" rel="noreferrer">
                  Open PDF ↗
                </a>
                <a className="btn btn-primary btn-sm" href={`${pdfUrl}&dl=1`}>
                  Download PDF ↓
                </a>
              </div>
            </div>

            <div className="coc-embed">
              <iframe src={pdfUrl} title={`Chain of custody ${reg.sample_id}`} />
            </div>
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
