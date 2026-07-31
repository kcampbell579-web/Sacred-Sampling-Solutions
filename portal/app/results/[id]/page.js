import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import { statusIndex } from "@/lib/status";
import Header from "@/components/Header";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

// analytes JSON: [{panel, name, result, units, flag, detected, limit}]
function groupByPanel(analytes) {
  const groups = {};
  (Array.isArray(analytes) ? analytes : []).forEach((a) => {
    const p = a.panel || "Results";
    (groups[p] = groups[p] || []).push(a);
  });
  return groups;
}

export default async function ResultsPage({ params }) {
  const user = await requireUser();
  const id = decodeURIComponent(params.id).toUpperCase();

  const regRows = await sql`select sample_id, kit_panel, sample_source, status from sample_registrations where sample_id=${id} and user_id=${user.id}`;
  if (!regRows.length) redirect("/dashboard");
  const reg = regRows[0];
  const ready = statusIndex(reg.status) >= 6;

  const resRows = ready
    ? await sql`select report_pdf, analytes, summary, released_at from results where sample_id=${id} order by released_at desc limit 1`
    : [];
  const res = resRows[0] || null;
  const analytes = res?.analytes || null;
  const groups = groupByPanel(analytes);
  const anyDetected = Array.isArray(analytes) && analytes.some((a) => a.detected);

  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <a className="backlink" href="/dashboard">← Back to dashboard</a>

          {!ready ? (
            <div className="card center">
              <span className="eyebrow">Results pending</span>
              <h1 className="mt">Your results aren&rsquo;t ready yet</h1>
              <p className="muted mt">We&rsquo;ll email you the moment your report is released. Current status: <b>{reg.status}</b>.</p>
            </div>
          ) : (
            <>
              <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <span className="eyebrow">Step 6 · Your results</span>
                  <h1>{reg.kit_panel || "Your results"}</h1>
                  <div className="mono" style={{ fontSize: ".8rem", color: "var(--brand-ink)" }}>{reg.sample_id}</div>
                </div>
                <PrintButton />
              </div>

              <div className={`verdictcard ${anyDetected ? "warn" : "ok"}`}>
                <div className="v-ic">{anyDetected ? "!" : "✓"}</div>
                <div>
                  <h2>{anyDetected ? "Some analytes were detected" : "No contaminants detected"}</h2>
                  <p>{res?.summary || (anyDetected
                    ? "One or more analytes were found — see the detail below and your full report."
                    : "Every analyte tested came back below the laboratory reporting limit.")}</p>
                </div>
              </div>

              {Array.isArray(analytes) && analytes.length > 0 && (
                <div className="card">
                  <span className="eyebrow">What we found</span>
                  {Object.entries(groups).map(([panel, rows]) => (
                    <div key={panel} style={{ marginTop: 14 }}>
                      <h3 style={{ marginBottom: 6 }}>{panel}</h3>
                      <div className="antable">
                        {rows.map((a, i) => (
                          <div className="anrow" key={i}>
                            <span className="an-name">{a.name}</span>
                            <span className="an-val mono">{a.result}{a.units ? ` ${a.units}` : ""}</span>
                            <span className={`bd ${a.detected ? (a.limit && a.exceeds ? "warn" : "ok") : "dim"}`}>
                              {a.detected ? (a.exceeds ? "Above limit" : "Detected") : "Not detected"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="card center">
                <span className="eyebrow">Full lab report</span>
                <h2 className="mt">Every page, as issued by the lab</h2>
                {res?.report_pdf ? (
                  <a className="btn btn-primary mt" href={res.report_pdf} target="_blank" rel="noopener">Download full report (PDF)</a>
                ) : (
                  <p className="muted mt">Your detailed report will appear here shortly.</p>
                )}
                <p className="disc mt">For informational &amp; screening purposes. Not a medical diagnosis. Results reflect the sample as collected and received. NY ELAP #11693.</p>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
