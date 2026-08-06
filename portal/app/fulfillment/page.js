import { sql } from "@/lib/db";
import { fulfillConfigured, fulfillAuthed } from "@/lib/fulfillauth";
import { fulfillLogin, fulfillLogout, setOrderStatus } from "@/app/actions/fulfill";
import { orderNumber } from "@/lib/stripe";

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
          <OrdersView ok={ok} />
        )}
      </div>
    </main>
  );
}

async function OrdersView({ ok }) {
  const orders = await sql`
    select id, stripe_session_id, email, customer_name, amount_total, currency,
           kit_name, quantity, ship_name, ship_address, phone, status, created_at, shipped_at
    from orders
    order by case status when 'new' then 0 when 'shipped' then 1 else 2 end, created_at desc`;

  const counts = { new: 0, shipped: 0, fulfilled: 0 };
  for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;

  return (
    <>
      {ok && <div className="alert alert-ok">{ok}</div>}

      <div className="ord-summary">
        <div className="os-card"><div className="os-n">{counts.new}</div><div className="os-l">New — to ship</div></div>
        <div className="os-card"><div className="os-n">{counts.shipped}</div><div className="os-l">Shipped</div></div>
        <div className="os-card"><div className="os-n">{counts.fulfilled}</div><div className="os-l">Fulfilled</div></div>
        <div className="os-card"><div className="os-n">{orders.length}</div><div className="os-l">Total orders</div></div>
      </div>

      {orders.length === 0 ? (
        <div className="card"><p className="muted">No orders yet. Paid Stripe checkouts will appear here automatically.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="otable-scroll">
            <table className="otable">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Kit</th>
                  <th>Ship to</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const stage = STAGES.indexOf(o.status);
                  return (
                    <tr key={o.id}>
                      <td className="mono nowrap"><b>{orderNumber(o.id)}</b></td>
                      <td className="nowrap">{fmtDate(o.created_at)}</td>
                      <td>
                        <div>{o.customer_name || "—"}</div>
                        {o.email && <div className="sub">{o.email}</div>}
                        {o.phone && <div className="sub">{o.phone}</div>}
                      </td>
                      <td>{o.kit_name || "—"}</td>
                      <td>
                        <div>{o.ship_name || "—"}</div>
                        {o.ship_address && <div className="sub">{o.ship_address}</div>}
                      </td>
                      <td className="nowrap">{money(o.amount_total, o.currency)}</td>
                      <td>
                        <span className={`pill ${PILL[o.status] || "p-blue"}`}>{o.status}</span>
                        <div className="ostep" title={STAGE_LABEL[o.status]}>
                          {["Ordered", "Shipped", "Fulfilled"].map((lbl, i) => (
                            <span key={lbl} className={`os-dot${i <= stage ? " done" : ""}`} title={lbl} />
                          ))}
                        </div>
                      </td>
                      <td className="nowrap">
                        {o.status === "new" && (
                          <form action={setOrderStatus} className="inlineform">
                            <input type="hidden" name="id" value={o.id} />
                            <input type="hidden" name="status" value="shipped" />
                            <button className="btn btn-primary btn-sm" type="submit">Mark shipped</button>
                          </form>
                        )}
                        {o.status === "shipped" && (
                          <div className="btnrow">
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
                          </div>
                        )}
                        {o.status === "fulfilled" && (
                          <form action={setOrderStatus} className="inlineform">
                            <input type="hidden" name="id" value={o.id} />
                            <input type="hidden" name="status" value="shipped" />
                            <button className="btn btn-ghost btn-sm" type="submit">Reopen</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
