import { sql } from "@/lib/db";
import { labConfigured, labAuthed } from "@/lib/labauth";
import { labLogin, labLogout, labSetStatus, labAttachReport } from "@/app/actions/lab";
import { STAGES, statusIndex } from "@/lib/status";
import { cocPublicUrl } from "@/lib/coc";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lab Portal — Sacred Sampling Solutions", robots: { index: false } };

const LAB_STAGES = ["Received by Lab", "In Analysis", "Results Ready"];

export default async function LabPortal({ searchParams }) {
  const id = (searchParams?.id || "").toString().trim().toUpperCase();
  const ok = (searchParams?.ok || "").toString();
  const error = (searchParams?.error || "").toString();

  return (
    <main className="page">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <span className="eyebrow">Sacred Sampling · Lab Portal</span>
            <h1>Laboratory access</h1>
          </div>
          {labAuthed() && (
            <form action={labLogout}><button className="linkbtn" type="submit">Lock</button></form>
          )}
        </div>

        {!labConfigured() ? (
          <div className="card">
            <h2>Lab portal not configured</h2>
            <p className="muted mt">Set the <span className="mono">LAB_PORTAL_PIN</span> environment variable in Vercel, then redeploy.</p>
          </div>
        ) : !labAuthed() ? (
          <div className="card" style={{ maxWidth: 420 }}>
            <h2 style={{ marginBottom: 6 }}>Enter lab PIN</h2>
            <p className="muted" style={{ marginBottom: 16 }}>Access is restricted to laboratory staff.</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form action={labLogin}>
              <div className="field">
                <label>PIN</label>
                <input name="pin" type="password" inputMode="numeric" autoComplete="off" required />
              </div>
              <button className="btn btn-primary btn-block" type="submit">Unlock</button>
            </form>
          </div>
        ) : (
          <>
            {ok && <div className="alert alert-ok">{ok}</div>}
            <div className="card">
              <span className="eyebrow">Look up a sample</span>
              <form method="get" style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                <input className="mono" name="id" defaultValue={id} placeholder="SSS-COM-00001" style={{ flex: 1, minWidth: 200, padding: ".72em .9em", border: "1px solid var(--line-strong)", borderRadius: 10 }} />
                <button className="btn btn-primary" type="submit">Open</button>
              </form>
            </div>
            {id && <LabSample id={id} />}
          </>
        )}
      </div>
    </main>
  );
}

async function LabSample({ id }) {
  const rows = await sql`
    select sample_id, kit_panel, customer_name, status, coc_url, tracking_number, lab_report_pdf
    from sample_registrations where sample_id=${id}`;
  if (!rows.length) {
    return <div className="card"><p className="muted">No sample found for <b>{id}</b>.</p></div>;
  }
  const s = rows[0];
  const idx = statusIndex(s.status);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="mono" style={{ fontSize: ".8rem", color: "var(--brand-ink)" }}>{s.sample_id}</div>
          <h2 style={{ margin: "2px 0" }}>{s.kit_panel || "Kit"}</h2>
          <div className="muted" style={{ fontSize: ".9rem" }}>{s.customer_name}</div>
        </div>
        <span className="pill p-blue" style={{ height: "fit-content" }}>{STAGES[idx].label}</span>
      </div>

      <div className="kv mt"><span className="k">Return tracking</span><span className="mono">{s.tracking_number || "—"}</span></div>
      <div className="kv"><span className="k">Chain of custody</span>
        <span>{s.coc_url ? <a href={cocPublicUrl(s.sample_id)} target="_blank" rel="noopener">Open COC →</a> : "Not generated"}</span>
      </div>
      {s.lab_report_pdf && <div className="kv"><span className="k">Report</span><span><a href={s.lab_report_pdf} target="_blank" rel="noopener">View report →</a></span></div>}

      <div style={{ marginTop: 18 }}>
        <span className="eyebrow">Advance status</span>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {LAB_STAGES.map((label) => (
            <form action={labSetStatus} key={label}>
              <input type="hidden" name="sample_id" value={s.sample_id} />
              <input type="hidden" name="status" value={label} />
              <button className="btn btn-ghost btn-sm" type="submit" disabled={s.status === label}>{label}</button>
            </form>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <span className="eyebrow">Attach report &amp; release</span>
        <form action={labAttachReport} style={{ marginTop: 10 }}>
          <input type="hidden" name="sample_id" value={s.sample_id} />
          <div className="field"><label>Report PDF URL</label><input name="report_url" placeholder="https://…/report.pdf" defaultValue={s.lab_report_pdf || ""} /></div>
          <div className="field"><label>Plain-English summary <span className="hint">(optional)</span></label><textarea name="summary" rows={2} placeholder="No detections above reporting limits…" /></div>
          <button className="btn btn-primary" type="submit">Attach &amp; set Results Ready</button>
        </form>
      </div>
    </div>
  );
}
