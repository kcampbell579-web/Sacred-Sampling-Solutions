import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import { statusIndex } from "@/lib/status";
import { generateLabel, markShipped } from "@/app/actions/shipping";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function ShippingPage({ searchParams }) {
  const user = await requireUser();
  const id = (searchParams?.id || "").toString().trim().toUpperCase();
  if (!id) redirect("/dashboard");

  const regRows = await sql`
    select sample_id, kit_panel, customer_name, street, city, state, zip, phone, status, coc_url
    from sample_registrations where sample_id=${id} and user_id=${user.id}`;
  if (!regRows.length) redirect("/dashboard");
  const reg = regRows[0];

  const shipRows = await sql`select carrier, service, tracking, label_url from shipments where sample_id=${id} order by created_at desc limit 1`;
  const ship = shipRows[0] || null;
  const shipped = statusIndex(reg.status) >= 3;

  const error = (searchParams?.error || "").toString();
  const labelJustMade = searchParams?.label === "1";
  const labelExists = searchParams?.label === "exists";

  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <a className="backlink" href="/dashboard">← Back to dashboard</a>

          <div className="freeze-note">
            <span className="freeze-ic">📦</span>
            <div>
              <b>Ship the same day you collect.</b> Put your sealed bottles and the frozen ice pack in the pouch,
              include your chain of custody, and drop it at a staffed UPS location. Don&rsquo;t leave it in an outdoor box.
            </div>
          </div>

          {!reg.coc_url && (
            <div className="alert alert-error">
              Generate your <a href={`/collect?id=${encodeURIComponent(id)}`}>chain of custody</a> before you ship.
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
          {labelExists && <div className="alert">A label was already created for this kit.</div>}

          {shipped ? (
            <div className="card">
              <span className="eyebrow">On its way</span>
              <h2 className="mt" style={{ marginBottom: 6 }}>Your sample is in route to the lab</h2>
              <div className="kv"><span className="k">Tracking</span><span className="trk">{ship?.tracking || reg.tracking_number || "—"}</span></div>
              <a className="btn btn-primary mt" href="/dashboard">Back to dashboard</a>
            </div>
          ) : ship ? (
            <div className="card">
              {labelJustMade && <div className="alert alert-ok">Your prepaid UPS label is ready — print it below.</div>}
              <span className="eyebrow">Step 4 · Shipping</span>
              <h2 className="mt" style={{ marginBottom: 6 }}>Your prepaid UPS return label</h2>
              <p className="muted" style={{ marginBottom: 16 }}>Print it, tape it to the box, and drop it at any UPS location.</p>
              <div className="labelcard">
                <div className="lrow"><span className="lk">Carrier</span><span>{[ship.carrier, ship.service].filter(Boolean).join(" · ") || "UPS"}</span></div>
                <div className="lrow"><span className="lk">Tracking</span><span className="trk">{ship.tracking || "—"}</span></div>
              </div>
              <a className="btn btn-primary btn-block mt" href={ship.label_url} target="_blank" rel="noopener">Print my UPS label (PDF)</a>
              <form action={markShipped} style={{ marginTop: 12 }}>
                <input type="hidden" name="sample_id" value={id} />
                <button className="btn btn-ghost btn-block" type="submit">I&rsquo;ve shipped it →</button>
              </form>
            </div>
          ) : (
            <div className="card">
              <span className="eyebrow">Step 4 · Shipping</span>
              <h2 className="mt" style={{ marginBottom: 6 }}>Get your prepaid UPS label</h2>
              <p className="muted" style={{ marginBottom: 16 }}>Return shipping is already paid. Confirm the address you&rsquo;re shipping from.</p>
              <form action={generateLabel}>
                <input type="hidden" name="sample_id" value={id} />
                <div className="field"><label>Full name</label><input name="name" defaultValue={reg.customer_name || ""} required /></div>
                <div className="field"><label>Street address</label><input name="street1" defaultValue={reg.street || ""} required /></div>
                <div className="field"><label>Apt / unit <span className="hint">(optional)</span></label><input name="street2" /></div>
                <div className="row3">
                  <div className="field"><label>City</label><input name="city" defaultValue={reg.city || ""} required /></div>
                  <div className="field"><label>State</label><input name="state" maxLength={2} defaultValue={reg.state || ""} required /></div>
                  <div className="field"><label>ZIP</label><input name="zip" defaultValue={reg.zip || ""} required /></div>
                </div>
                <div className="field"><label>Phone <span className="hint">(for the carrier)</span></label><input name="phone" defaultValue={reg.phone || ""} /></div>
                <button className="btn btn-primary btn-block" type="submit">Generate my prepaid UPS label →</button>
              </form>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
