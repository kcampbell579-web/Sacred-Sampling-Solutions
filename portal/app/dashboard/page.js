import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { statusIndex } from "@/lib/status";
import { Stepbar, StageBadge } from "@/components/Stepbar";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

function nextStep(k) {
  const i = statusIndex(k.status);
  const id = encodeURIComponent(k.sample_id);
  if (i >= 6) return { label: "View results", href: `/results/${id}` };
  if (i >= 3) return { label: "Track sample", href: `/shipping?id=${id}` };
  return { label: "Continue — start training", href: `/training/${k.kit_slug}?id=${id}` };
}

export default async function Dashboard({ searchParams }) {
  const user = await requireUser();
  const kits = await sql`
    select sample_id, kit_code, kit_panel, kit_slug, status
    from sample_registrations
    where user_id=${user.id}
    order by created_at desc`;

  const justRegistered = (searchParams?.registered || "").toString();

  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="wrap">
          <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <span className="eyebrow">Your samples</span>
              <h1>Welcome back, {user.name.split(" ")[0]}</h1>
            </div>
            <a className="btn btn-primary" href="/sampleregistration">+ Register a kit</a>
          </div>

          {justRegistered && (
            <div className="alert alert-ok">Kit {justRegistered} registered. Start its training to continue.</div>
          )}

          {kits.length === 0 ? (
            <div className="card center">
              <h2>No kits yet</h2>
              <p className="muted mt">Scan the QR on your kit — or enter its Sample ID — to register it and start tracking.</p>
              <a className="btn btn-primary mt" href="/sampleregistration">Register your first kit</a>
            </div>
          ) : (
            <div className="kitlist">
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
                    <div className="kc-actions">
                      <a className="btn btn-primary btn-sm" href={ns.href}>{ns.label} →</a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
