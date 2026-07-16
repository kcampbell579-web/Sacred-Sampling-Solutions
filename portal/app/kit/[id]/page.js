import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { productOf } from "@/lib/products";
import { saveSample } from "@/app/actions/kit";
import Header from "@/components/Header";
import Timeline, { StatusPill } from "@/components/Timeline";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KitPage({ params, searchParams }) {
  const user = await requireUser();
  const kitId = decodeURIComponent(params.id).toUpperCase();

  const rows = await sql`select kit_id, product, status from kits where kit_id=${kitId} and activated_by=${user.id}`;
  if (!rows.length) redirect("/dashboard");
  const kit = rows[0];
  const p = productOf(kit.product);

  const samples = await sql`
    select location, collected_on, notes, tracking, created_at
    from samples where kit_id=${kitId} order by created_at desc limit 1`;
  const sample = samples[0] || null;

  const results =
    kit.status === "ready"
      ? await sql`select summary, report_url, released_at from results where kit_id=${kitId} order by released_at desc limit 1`
      : [];
  const result = results[0] || null;
  const justSaved = searchParams?.saved;

  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="wrap">
          <a className="backlink" href="/dashboard">← Back to dashboard</a>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div className="mono" style={{ fontSize: ".76rem", color: "var(--ink-3)" }}>{kit.kit_id}</div>
                <h1 style={{ margin: "4px 0" }}>{p.name}</h1>
                <div className="muted">{p.tests}</div>
              </div>
              <StatusPill status={kit.status} />
            </div>
            <div style={{ marginTop: 26 }}>
              <Timeline status={kit.status} />
            </div>
          </div>

          {justSaved && <div className="alert alert-ok" style={{ marginTop: 18 }}>Sample details saved. You&rsquo;re all set — mail it back the same day you collect.</div>}

          {/* Results */}
          {kit.status === "ready" && (
            <div className="card">
              <span className="eyebrow">Your results</span>
              <h2 className="mt">Report ready</h2>
              {result?.summary && <p className="muted mt">{result.summary}</p>}
              {result?.report_url ? (
                <a className="btn btn-primary mt" href={result.report_url} target="_blank" rel="noopener">Download your report (PDF)</a>
              ) : (
                <p className="muted mt">Your full report will appear here shortly.</p>
              )}
            </div>
          )}

          {/* Sample details */}
          {sample ? (
            <div className="card">
              <span className="eyebrow">Sample details</span>
              <h2 className="mt" style={{ marginBottom: 10 }}>What you told us</h2>
              <div className="kv"><span className="k">Location</span><span>{sample.location || "—"}</span></div>
              <div className="kv"><span className="k">Collected on</span><span>{sample.collected_on || "—"}</span></div>
              <div className="kv"><span className="k">Return tracking</span><span>{sample.tracking || "—"}</span></div>
              {sample.notes && <div className="kv"><span className="k">Notes</span><span style={{ maxWidth: 360, textAlign: "right" }}>{sample.notes}</span></div>}
            </div>
          ) : (
            <div className="card">
              <span className="eyebrow">Step 3 · Sample details</span>
              <h2 className="mt" style={{ marginBottom: 6 }}>Tell us about your sample</h2>
              <p className="muted" style={{ marginBottom: 18 }}>
                This makes your report personal — and reminds you to <b>collect → chill → ship the same day</b> so the sample stays valid.
              </p>
              <form action={saveSample}>
                <input type="hidden" name="kit_id" value={kit.kit_id} />
                <div className="row2">
                  <div className="field">
                    <label>Where did you collect it?</label>
                    <input name="location" placeholder="Kitchen tap, well, nursery…" required />
                  </div>
                  <div className="field">
                    <label>Collection date</label>
                    <input name="collected_on" type="date" required />
                  </div>
                </div>
                <div className="field">
                  <label>Anything we should know? <span className="hint">(optional)</span></label>
                  <textarea name="notes" rows={3} placeholder="Musty smell after a leak; old home testing for lead…" />
                </div>
                <div className="field">
                  <label>Return tracking number <span className="hint">(optional — from your prepaid label)</span></label>
                  <input name="tracking" placeholder="1Z…" />
                </div>
                <button className="btn btn-primary btn-block" type="submit">Save sample details</button>
              </form>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
