import { sql } from "@/lib/db";
import { fulfillConfigured, fulfillAuthed } from "@/lib/fulfillauth";
import { fulfillLogin, fulfillLogout, setOrderStatus, saveOutboundTracking } from "@/app/actions/fulfill";
import { orderNumber } from "@/lib/stripe";
import { kvGet } from "@/lib/kv";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fulfillment — Sacred Sampling Solutions", robots: { index: false } };

const STAGES = ["new", "shipped", "fulfilled"];
const STAGE_LABEL = { new: "New — needs shipping", shipped: "Shipped", fulfilled: "Fulfilled" };
const PILL = { new: "p-warn", shipped: "p-blue", fulfilled: "p-good" };

function money(cents, cur) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: (cur || "usd").toUpperCase() }).format(cents / 100);
}
function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 10);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}
function upsUrl(t) {
  return `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(String(t || "").trim())}`;
}
const normEmail = (e) => String(e || "").trim().toLowerCase();

// One tracking cell: a clickable UPS link if we have a number, else a dash.
function TrackLink({ number }) {
  if (!number) return <span className="tk-none">—</span>;
  return (
    <a className="tk-link" href={upsUrl(number)} target="_blank" rel="noopener">
      <span className="tk-num mono">{number}</span>
      <span className="tk-ups">Track on UPS →</span>
    </a>
  );
}

export default async function Fulfillment({ searchParams }) {
  const ok = (searchParams?.ok || "").toString();
  const error = (searchParams?.error || "").toString();

  return (
    <main className="page">
      <div className="wrap" style={{ maxWidth: 1040 }}>
        <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <span className="eyebrow">Sacred Sampling · Fulfillment</span>
            <h1>Orders</h1>
          </div>
          {fulfillAuthed() && (
            <form action={fulfillLogout}><button className="linkbtn" type="submit">Lock</button></form>
          )}
        </div>

        {!fulfillConfigured() ? (
          <div className="card">
            <h2>Fulfillment portal not configured</h2>
            <p className="muted mt">Set the <span className="mono">FULFILLMENT_PIN</span> environment variable in Vercel (portal project), then redeploy. You&rsquo;ll also need <span className="mono">STRIPE_SECRET_KEY</span> and <span className="mono">STRIPE_WEBHOOK_SECRET</span> for orders to arrive, and the <span className="mono">orders</span> table created in Neon.</p>
          </div>
        ) : !fulfillAuthed() ? (
          <div className="card" style={{ maxWidth: 420 }}>
            <h2 style={{ marginBottom: 6 }}>Enter fulfillment PIN</h2>
            <p className="muted" style={{ marginBottom: 16 }}>Access is restricted to staff.</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form action={fulfillLogin}>
              <div className="field">
                <label>PIN</label>
                <input name="pin" type="password" inputMode="numeric" autoComplete="off" required />
              </div>
              <button className="btn btn-primary btn-block" type="submit">Unlock</button>
            </form>
          </div>
        ) : (
          <OrdersView ok={ok} error={error} />
        )}
      </div>
    </main>
  );
}

async function OrdersView({ ok, error }) {
  // The outbound tracking column is optional until the migration is run.
  let hasTracking = true;
  try {
    const col = await sql`select 1 from information_schema.columns where table_name='orders' and column_name='tracking_number' limit 1`;
    hasTracking = col.length > 0;
  } catch {
    hasTracking = false;
  }

  const orders = hasTracking
    ? await sql`
        select id, stripe_session_id, email, customer_name, amount_total, currency,
               kit_name, quantity, ship_name, ship_address, phone, status, created_at, shipped_at, tracking_number
        from orders
        order by case status when 'new' then 0 when 'shipped' then 1 else 2 end, created_at desc`
    : await sql`
        select id, stripe_session_id, email, customer_name, amount_total, currency,
               kit_name, quantity, ship_name, ship_address, phone, status, created_at, shipped_at, null as tracking_number
        from orders
        order by case status when 'new' then 0 when 'shipped' then 1 else 2 end, created_at desc`;

  // Customer-side progress: registrations (return tracking, training) keyed by email.
  let regsByEmail = new Map();
  try {
    const regs = await sql`
      select r.sample_id, r.email, r.status, r.kit_panel, r.coc_url, r.tracking_number,
             exists(select 1 from training_acknowledgments t where t.sample_id = r.sample_id) as trained
      from sample_registrations r`;
    for (const r of regs) {
      const k = normEmail(r.email);
      if (!k) continue;
      if (!regsByEmail.has(k)) regsByEmail.set(k, []);
      regsByEmail.get(k).push(r);
    }
  } catch {
    regsByEmail = new Map();
  }

  // Resolve the customer-facing order number (matches /orders) via KV; fall back to SSO-<id>.
  const numbers = await Promise.all(
    orders.map(async (o) => {
      const kv = await kvGet(`order:sid:${o.stripe_session_id}`);
      return kv || orderNumber(o.id);
    })
  );

  const counts = { new: 0, shipped: 0, fulfilled: 0 };
  for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;

  return (
    <>
      {ok && <div className="alert alert-ok">{ok}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {!hasTracking && (
        <div className="alert">
          Outbound tracking isn&rsquo;t enabled yet. Run <span className="mono">db/migrate-orders-tracking.sql</span> in the Neon SQL editor to turn on the &ldquo;To customer&rdquo; tracking field.
        </div>
      )}

      <div className="ord-summary">
        <div className="os-card"><div className="os-n">{counts.new}</div><div className="os-l">New — to ship</div></div>
        <div className="os-card"><div className="os-n">{counts.shipped}</div><div className="os-l">Shipped</div></div>
        <div className="os-card"><div className="os-n">{counts.fulfilled}</div><div className="os-l">Fulfilled</div></div>
        <div className="os-card"><div className="os-n">{orders.length}</div><div className="os-l">Total orders</div></div>
      </div>

      {orders.length === 0 ? (
        <div className="card"><p className="muted">No orders yet. Paid Stripe checkouts will appear here automatically.</p></div>
      ) : (
        <div className="ord-list">
          {orders.map((o, i) => {
            const stage = STAGES.indexOf(o.status);
            const regs = regsByEmail.get(normEmail(o.email)) || [];
            const returnTracking = regs.map((r) => r.tracking_number).find(Boolean) || "";
            return (
              <div className="ocard" key={o.id}>
                {/* Header */}
                <div className="ocard-head">
                  <div className="ocard-id">
                    <span className="mono ocard-no">{numbers[i]}</span>
                    <span className={`pill ${PILL[o.status] || "p-blue"}`}>{o.status}</span>
                  </div>
                  <div className="ocard-meta">
                    <span>{fmtDate(o.created_at)}</span>
                    <span className="ocard-amt">{money(o.amount_total, o.currency)}</span>
                  </div>
                </div>

                {/* Body grid */}
                <div className="ocard-grid">
                  <div className="ob">
                    <div className="ob-k">Customer</div>
                    <div className="ob-v">{o.customer_name || "—"}</div>
                    {o.email && <div className="sub">{o.email}</div>}
                    {o.phone && <div className="sub">{o.phone}</div>}
                  </div>
                  <div className="ob">
                    <div className="ob-k">Kit</div>
                    <div className="ob-v">{o.kit_name || "—"}</div>
                  </div>
                  <div className="ob">
                    <div className="ob-k">Ship to</div>
                    <div className="ob-v">{o.ship_name || "—"}</div>
                    {o.ship_address && <div className="sub">{o.ship_address}</div>}
                  </div>
                </div>

                {/* Tracking: two legs */}
                <div className="ocard-track">
                  <div className="ot ot-out">
                    <div className="ot-k">📦 To customer <span className="ot-dir">(outbound)</span></div>
                    {o.tracking_number ? (
                      <>
                        <TrackLink number={o.tracking_number} />
                        <form action={saveOutboundTracking} className="ot-form">
                          <input type="hidden" name="id" value={o.id} />
                          <input className="ot-input mono" name="tracking" defaultValue={o.tracking_number} placeholder="1Z…" />
                          <button className="btn btn-ghost btn-sm" type="submit">Update</button>
                        </form>
                      </>
                    ) : (
                      <form action={saveOutboundTracking} className="ot-form">
                        <input type="hidden" name="id" value={o.id} />
                        <input className="ot-input mono" name="tracking" placeholder="Paste UPS tracking #" />
                        <button className="btn btn-primary btn-sm" type="submit">Save</button>
                      </form>
                    )}
                  </div>
                  <div className="ot ot-lab">
                    <div className="ot-k">🧪 To lab <span className="ot-dir">(return)</span></div>
                    <TrackLink number={returnTracking} />
                    {!returnTracking && <div className="sub">Appears once the customer buys their return label.</div>}
                  </div>
                </div>

                {/* Customer progress */}
                <div className="ocard-prog">
                  <div className="ot-k">Customer progress</div>
                  {regs.length === 0 ? (
                    <div className="sub">No kit registered yet for this email.</div>
                  ) : (
                    <div className="prog-rows">
                      {regs.map((r) => (
                        <div className="prog-row" key={r.sample_id}>
                          <span className="mono prog-sid">{r.sample_id}</span>
                          <span className="prog-badges">
                            <span className="badge on">Registered</span>
                            <span className={`badge ${r.coc_url ? "on" : "off"}`}>{r.coc_url ? "COC ✓" : "COC —"}</span>
                            <span className={`badge ${r.trained ? "on" : "off"}`}>{r.trained ? "Trained ✓" : "Training —"}</span>
                          </span>
                          <span className="prog-status">{r.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="ocard-actions">
                  <div className="ostep" title={STAGE_LABEL[o.status]}>
                    {["Ordered", "Shipped", "Fulfilled"].map((lbl, k) => (
                      <span key={lbl} className={`os-dot${k <= stage ? " done" : ""}`} title={lbl} />
                    ))}
                  </div>
                  <div className="btnrow">
                    {o.status === "new" && (
                      <form action={setOrderStatus} className="ship-form">
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="status" value="shipped" />
                        <input className="ot-input mono" name="tracking" placeholder="UPS # (optional)" />
                        <button className="btn btn-primary btn-sm" type="submit">Mark shipped</button>
                      </form>
                    )}
                    {o.status === "shipped" && (
                      <>
                        <form action={setOrderStatus} className="inlineform">
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="status" value="fulfilled" />
                          <button className="btn btn-primary btn-sm" type="submit">Mark fulfilled</button>
                        </form>
                        <form action={setOrderStatus} className="inlineform">
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="status" value="new" />
                          <button className="btn btn-ghost btn-sm" type="submit">Reopen</button>
                        </form>
                      </>
                    )}
                    {o.status === "fulfilled" && (
                      <form action={setOrderStatus} className="inlineform">
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="status" value="shipped" />
                        <button className="btn btn-ghost btn-sm" type="submit">Reopen</button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
