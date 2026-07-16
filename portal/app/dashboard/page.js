import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { productOf } from "@/lib/products";
import Header from "@/components/Header";
import { StatusPill } from "@/components/Timeline";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireUser();
  const kits = await sql`
    select kit_id, product, status
    from kits
    where activated_by=${user.id}
    order by activated_at desc nulls last`;

  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="wrap">
          <div
            className="page-head"
            style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}
          >
            <div>
              <span className="eyebrow">Your kits</span>
              <h1>Welcome back, {user.name.split(" ")[0]}</h1>
            </div>
            <a className="btn btn-primary" href="/activate">+ Activate a kit</a>
          </div>

          {kits.length === 0 ? (
            <div className="card center">
              <h2>No kits yet</h2>
              <p className="muted mt">Have a kit? Enter its Kit ID to register it and start tracking your results.</p>
              <a className="btn btn-primary mt" href="/activate">Activate your first kit</a>
            </div>
          ) : (
            <div className="kitlist">
              {kits.map((k) => {
                const p = productOf(k.product);
                return (
                  <a className="kitrow" href={`/kit/${encodeURIComponent(k.kit_id)}`} key={k.kit_id}>
                    <div className="kmeta">
                      <div className="code">{k.kit_id}</div>
                      <h3>{p.name}</h3>
                      <div className="muted" style={{ fontSize: ".85rem" }}>{p.tests}</div>
                    </div>
                    <StatusPill status={k.status} />
                    <span className="arrow">→</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
