import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { statusIndex } from "@/lib/status";
import { Stepbar, StageBadge } from "@/components/Stepbar";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

const LEARN = "https://www.sacredsamplingsolutions.com/learn.html";

function nextStep(k) {
  const i = statusIndex(k.status);
  const id = encodeURIComponent(k.sample_id);
  if (i >= 6) return { label: "View results", href: `/results/${id}` };
  if (i >= 3) return { label: "Track sample", href: `/shipping?id=${id}` };
  if (k.coc_url) return { label: "Print label & ship", href: `/shipping?id=${id}` };
  return { label: "Start training", href: `/training/${k.kit_slug}?id=${id}` };
}

function pickPrimary(kits) {
  return (
    kits.find((k) => statusIndex(k.status) < 3) || // needs customer action
    kits.find((k) => statusIndex(k.status) >= 6) || // results ready
    kits[0] ||
    null
  );
}

function bannerFor(k) {
  const i = statusIndex(k.status);
  const name = k.kit_panel || k.kit_code;
  const id = k.sample_id;
  const btn = nextStep(k);
  if (i >= 6) return { eyebrow: "Results ready", title: "Your results are in", sub: `${name} (${id}) — your report is available now.`, btn };
  if (i >= 3) return { eyebrow: "In progress", title: "Your sample is on its way", sub: `${name} (${id}) is heading to the lab. We'll email you the moment results are ready.`, btn };
  if (k.coc_url) return { eyebrow: "Do this next", title: "Ready to ship", sub: `${name} (${id}) — print your prepaid label and ship it the same day you collect.`, btn };
  return { eyebrow: "Do this next", title: "Ready to collect", sub: `${name} (${id}) is registered — watch the quick training, then collect and ship the same day.`, btn };
}

export default async function Dashboard({ searchParams }) {
  const user = await requireUser();
  const kits = await sql`
    select sample_id, kit_code, kit_panel, kit_slug, status, coc_url
    from sample_registrations
    where user_id=${user.id}
    order by created_at desc`;

  const justRegistered = (searchParams?.registered || "").toString();
  const justCoc = (searchParams?.coc || "").toString();
  const justShipped = (searchParams?.shipped || "").toString();
  const primary = pickPrimary(kits);
  const banner = primary ? bannerFor(primary) : null;

  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="wrap">
          <div className="page-head" style={{ marginBottom: 14 }}>
            <span className="eyebrow">Your sample portal</span>
            <h1>Welcome back, {user.name.split(" ")[0]}</h1>
            <p className="muted">Here&rsquo;s where your testing stands — and the next step for each kit, all in one place.</p>
          </div>

          {justRegistered && <div className="alert alert-ok">Kit {justRegistered} registered. Start its training to continue.</div>}
          {justCoc && <div className="alert alert-ok">Chain of custody generated for {justCoc}. Print your shipping label and send it the same day.</div>}
          {justShipped && <div className="alert alert-ok">{justShipped} is on its way to the lab. We&rsquo;ll update you as it moves through analysis.</div>}

          {kits.length === 0 ? (
            <div className="card center">
              <h2>No kits yet</h2>
              <p className="muted mt">Scan the QR on your kit — or enter its Sample ID — to register it and start tracking.</p>
              <a className="btn btn-primary mt" href="/sampleregistration">Register your first kit</a>
            </div>
          ) : (
            <>
              {banner && (
                <div className="next-banner">
                  <div>
                    <div className="nb-eyebrow">{banner.eyebrow}</div>
                    <h3>{banner.title}</h3>
                    <p>{banner.sub}</p>
                  </div>
                  <a className="btn nb-btn" href={banner.btn.href}>{banner.btn.label} →</a>
                </div>
              )}

              <section className="dash-section">
                <div className="section-row">
                  <div className="sh">Your kits</div>
                  <a className="btn btn-ghost btn-sm" href="/sampleregistration">+ Register a kit</a>
                </div>
                <div className="kits-grid">
                  {kits.map((k) => {
                    const ns = nextStep(k);
                    const i = statusIndex(k.status);
                    return (
                      <div className="kitcard" key={k.sample_id}>
                        <div className="kc-top">
                          <div className="kc-meta">
                            <div className="kc-name">{k.kit_panel || k.kit_code}</div>
                            <div className="code">{k.sample_id}</div>
                          </div>
                          <StageBadge status={k.status} />
                        </div>
                        <Stepbar status={k.status} />
                        <div className="kc-step">Step {i + 1} of 7</div>
                        <a className="btn btn-primary btn-sm" href={ns.href}>{ns.label} →</a>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="dash-section">
                <div className="card">
                  <span className="eyebrow">While you wait</span>
                  <h2 className="mt" style={{ marginBottom: 4 }}>Understand what&rsquo;s in your home</h2>
                  <p className="muted" style={{ marginBottom: 14 }}>Lab-backed answers — no chemistry degree required. Explore by what&rsquo;s on your mind:</p>
                  <div className="sit-grid">
                    <a href={LEARN} className="sitcard"><div className="st">Preparing the nursery</div><div className="sb">Water, air &amp; dust before baby</div></a>
                    <a href={LEARN} className="sitcard"><div className="st">Buying or selling a home</div><div className="sb">What inspectors miss</div></a>
                    <a href={LEARN} className="sitcard"><div className="st">Had a leak or flood</div><div className="sb">When to test and why</div></a>
                    <a href={LEARN} className="sitcard"><div className="st">I have a private well</div><div className="sb">Annual testing basics</div></a>
                  </div>
                  <div className="chips">
                    {["Lead", "PFAS", "VOCs", "Arsenic", "Nitrate", "Fluoride", "E. coli", "Hardness"].map((c) => (
                      <span className="chip" key={c}>{c}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 14 }}><a className="btn btn-ghost btn-sm" href={LEARN}>Open the learning library →</a></div>
                </div>
              </section>

              <section className="dash-section">
                <div className="two-col">
                  <div className="card">
                    <span className="eyebrow">Results</span>
                    <h2 className="mt" style={{ marginBottom: 4 }}>Your reports</h2>
                    <p className="muted" style={{ marginBottom: 12 }}>When a kit&rsquo;s analysis is done, its report appears here — clear numbers compared against EPA limits. You&rsquo;ll get an email the moment it&rsquo;s ready.</p>
                    <a className="btn btn-ghost btn-sm" href="https://www.sacredsamplingsolutions.com/understanding-results.html">How to read your report →</a>
                  </div>
                  <div className="card">
                    <span className="eyebrow">Here to help</span>
                    <h2 className="mt" style={{ marginBottom: 4 }}>Questions?</h2>
                    <p className="muted" style={{ marginBottom: 12 }}>Collection, shipping, or reading your report — we&rsquo;ve got you.</p>
                    <a className="btn btn-ghost btn-sm" href="mailto:info@sacredsamplingsolutions.com">Email support</a>
                  </div>
                </div>
              </section>
            </>
          )}

          <div className="dash-foot">
            <span>Staff?</span>
            <a href="/lab">Lab Portal →</a>
            <a href="/fulfillment" style={{ marginLeft: 14 }}>Fulfillment →</a>
          </div>
        </div>
      </main>
    </>
  );
}
