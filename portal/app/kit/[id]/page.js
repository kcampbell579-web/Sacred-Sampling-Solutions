import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { productOf } from "@/lib/products";
import { saveSample } from "@/app/actions/kit";
import { generateLabel } from "@/app/actions/shipping";
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

  const shipments = await sql`
    select carrier, service, tracking, label_url, rate, created_at
    from shipments where kit_id=${kitId} order by created_at desc limit 1`;
  const shipment = shipments[0] || null;
  const shipError = searchParams?.error;
  const labelJustMade = searchParams?.label === "1";

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

          {/* Return shipping */}
          {kit.status !== "ready" && (
            <div className="card">
              <span className="eyebrow">Return shipping</span>
              {shipment ? (
                <>
                  {labelJustMade && (
                    <div className="alert alert-ok mt">Your prepaid UPS label is ready — print it below.</div>
                  )}
                  <h2 className="mt" style={{ marginBottom: 6 }}>Your prepaid UPS return label</h2>
                  <p className="muted" style={{ marginBottom: 16 }}>
                    Print it, tape it to your box, and drop it at any UPS location (or hand it to your driver).
                    <b> Ship the same day you collect</b> so the sample stays valid.
                  </p>
                  <a className="btn btn-primary" href={shipment.label_url} target="_blank" rel="noopener">
                    Print my UPS label (PDF)
                  </a>
                  <div className="kv" style={{ marginTop: 18 }}>
                    <span className="k">Carrier</span>
                    <span>{[shipment.carrier, shipment.service].filter(Boolean).join(" · ") || "UPS"}</span>
                  </div>
                  <div className="kv">
                    <span className="k">Tracking</span>
                    <span className="mono">{shipment.tracking || "—"}</span>
                  </div>
                </>
              ) : kit.status === "activated" ? (
                <>
                  <h2 className="mt" style={{ marginBottom: 6 }}>Get your prepaid UPS return label</h2>
                  <p className="muted" style={{ marginBottom: 16 }}>
                    Return shipping is already paid. Enter the address you&rsquo;re shipping from and we&rsquo;ll
                    generate your UPS label to print.
                  </p>
                  {shipError && <div className="alert alert-error">{shipError}</div>}
                  <form action={generateLabel}>
                    <input type="hidden" name="kit_id" value={kit.kit_id} />
                    <div className="field">
                      <label>Full name</label>
                      <input name="name" defaultValue={user.name || ""} required />
                    </div>
                    <div className="field">
                      <label>Street address</label>
                      <input name="street1" placeholder="123 Main St" required />
                    </div>
                    <div className="field">
                      <label>Apt / unit <span className="hint">(optional)</span></label>
                      <input name="street2" />
                    </div>
                    <div className="row3">
                      <div className="field">
                        <label>City</label>
                        <input name="city" required />
                      </div>
                      <div className="field">
                        <label>State</label>
                        <input name="state" maxLength={2} placeholder="NY" required />
                      </div>
                      <div className="field">
                        <label>ZIP</label>
                        <input name="zip" placeholder="11713" required />
                      </div>
                    </div>
                    <div className="field">
                      <label>Phone <span className="hint">(for the carrier)</span></label>
                      <input name="phone" defaultValue={user.phone || ""} />
                    </div>
                    <button className="btn btn-primary btn-block" type="submit">Generate my prepaid UPS label</button>
                  </form>
                </>
              ) : (
                <p className="muted mt">Your sample is on its way to the lab.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
