import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import Header from "@/components/Header";
import CollectForm from "./CollectForm";
import { cocPublicUrl } from "@/lib/coc";

export const dynamic = "force-dynamic";

export default async function CollectPage({ searchParams }) {
  const user = await requireUser();
  const id = (searchParams?.id || "").toString().trim().toUpperCase();
  if (!id) redirect("/dashboard");

  const regRows = await sql`
    select sample_id, kit_code, kit_panel, kit_slug, customer_name, sample_source, city, state
    from sample_registrations where sample_id=${id} and user_id=${user.id}`;
  if (!regRows.length) redirect("/dashboard");
  const reg = regRows[0];

  const kitRows = await sql`select title, panels, matrix from kit_types where code=${reg.kit_code}`;
  const kit = kitRows[0] || { panels: "", matrix: "water" };

  const cocRows = await sql`select coc_ref, coc_url, sampler_name, collected_at, location, matrix, observations, signature_png from chain_of_custody where sample_id=${id} order by created_at desc limit 1`;
  const coc = cocRows[0] || null;
  const error = (searchParams?.error || "").toString();

  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="wrap">
          <a className="backlink" href="/dashboard">← Back to dashboard</a>

          {coc ? (
            <CocDone reg={reg} />
          ) : (
            <CollectForm
              sampleId={reg.sample_id}
              defaultLocation={reg.sample_source}
              defaultMatrix={kit.matrix === "air" ? "A" : "DW"}
              error={error}
            />
          )}
        </div>
      </main>
    </>
  );
}

async function CocDone({ reg }) {
  const url = cocPublicUrl(reg.sample_id);
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 168 });

  return (
    <>
      <div className="alert alert-ok">Chain of custody generated. Include it in your kit — the lab opens it by scanning the code below.</div>

      <div className="card">
        <div className="labscan">
          <img src={qr} alt="Lab scan QR" width={132} height={132} />
          <div>
            <span className="eyebrow">Lab access · scan on arrival</span>
            <h2 className="mt" style={{ marginBottom: 4 }}>Your COC is on record</h2>
            <p className="muted" style={{ marginBottom: 8 }}>
              When the lab scans this code, your chain of custody opens automatically — no login needed.
            </p>
            <a className="mono coc-link" href={url} target="_blank" rel="noopener">{url}</a>
          </div>
        </div>
      </div>

      <div className="coc-embed">
        <iframe src={`/coc-pdf?id=${encodeURIComponent(reg.sample_id)}`} title={`Chain of custody ${reg.sample_id}`} />
      </div>

      <div className="coc-actions">
        <a className="btn btn-ghost" href={`/coc-pdf?id=${encodeURIComponent(reg.sample_id)}&dl=1`}>Download COC PDF ↓</a>
        <a className="btn btn-primary" href={`/dashboard?coc=${encodeURIComponent(reg.sample_id)}`}>Done — back to dashboard</a>
      </div>
    </>
  );
}
