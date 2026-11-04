import { sql } from "@/lib/db";
import { fulfillConfigured, fulfillAuthed } from "@/lib/fulfillauth";
import { fulfillLogin, fulfillLogout, setOrderStatus, saveOutboundTracking, saveReturnTracking, markReceivedByLab, fulfillAttachResult, buyOutboundLabel } from "@/app/actions/fulfill";
import { parseShipAddress } from "@/lib/address";
import { orderNumber } from "@/lib/stripe";
import { kvGet } from "@/lib/kv";
import { statusIndex } from "@/lib/status";
import { listLeads, leadCountsByType, LEAD_TYPES, leadTypeLabel } from "@/lib/leads";

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

const TABS = [["dashboard", "Dashboard"], ["orders", "Orders"], ["leads", "Leads"]];

export default async function Fulfillment({ searchParams }) {
  const ok = (searchParams?.ok || "").toString();
  const error = (searchParams?.error || "").toString();
  const tab = (searchParams?.tab || "dashboard").toString();
  const type = (searchParams?.type || "").toString();
  const authed = fulfillAuthed();
  const title = tab === "orders" ? "Orders" : tab === "leads" ? "Leads" : "Dashboard";

  return (
    <main className="page">
      <div className="wrap" style={{ maxWidth: 1040 }}>
        <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <span className="eyebrow">Sacred Sampling · Fulfillment</span>
            <h1>{title}</h1>
          </div>
          {authed && (
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <a className="linkbtn" href="/fulfillment/labels">🏷️ Print QR labels</a>
              <form action={fulfillLogout}><button className="linkbtn" type="submit">Lock</button></form>
            </div>
          )}
        </div>

        {authed && (
          <nav className="ftabs">
            {TABS.map(([k, label]) => (
              <a key={k} className={`ftab${tab === k ? " on" : ""}`} href={`/fulfillment?tab=${k}`}>{label}</a>
            ))}
          </nav>
        )}

        {!fulfillConfigured() ? (
          <div className="card">
            <h2>Fulfillment portal not configured</h2>
            <p className="muted mt">Set the <span className="mono">FULFILLMENT_PIN</span> environment variable in Vercel (portal project), then redeploy. You&rsquo;ll also need <span className="mono">STRIPE_SECRET_KEY</span> and <span className="mono">STRIPE_WEBHOOK_SECRET</span> for orders to arrive, and the <span className="mono">orders</span> table created in Neon.</p>
          </div>
        ) : !authed ? (
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
        ) : tab === "orders" ? (
          <OrdersView ok={ok} error={error} />
        ) : tab === "leads" ? (
          <LeadsView type={type} ok={ok} error={error} />
        ) : (
          <DashboardView ok={ok} error={error} />
        )}
      </div>
    </main>
  );
}

async function OrdersView({ ok, error }) {
  // Self-heal the optional tracking + label columns (idempotent).
  try {
    await sql`alter table orders add column if not exists tracking_number text`;
    await sql`alter table orders add column if not exists outbound_label_url text`;
  } catch {}

  let orders;
  try {
    orders = await sql`
        select id, stripe_session_id, email, customer_name, amount_total, currency,
               kit_name, quantity, ship_name, ship_address, phone, status, created_at, shipped_at,
               tracking_number, outbound_label_url
        from orders
        order by case status when 'new' then 0 when 'shipped' then 1 else 2 end, created_at desc`;
  } catch {
    orders = await sql`
        select id, stripe_session_id, email, customer_name, amount_total, currency,
               kit_name, quantity, ship_name, ship_address, phone, status, created_at, shipped_at,
               null as tracking_number, null as outbound_label_url
        from orders
        order by case status when 'new' then 0 when 'shipped' then 1 else 2 end, created_at desc`;
  }

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
            const returnReg = regs.find((r) => r.tracking_number) || regs[0] || null;
            const returnTracking = returnReg?.tracking_number || "";
            const shipTo = parseShipAddress(o.ship_address);
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
                    {o.outbound_label_url && (
                      <a className="btn btn-primary btn-sm" href={o.outbound_label_url} target="_blank" rel="noopener">🖨️ Print UPS label (PDF)</a>
                    )}
                    {o.tracking_number ? (
                      <TrackLink number={o.tracking_number} />
                    ) : (
                      <details className="prog-attach">
                        <summary>🏷️ Buy UPS label</summary>
                        <form action={buyOutboundLabel} className="lblform">
                          <input type="hidden" name="id" value={o.id} />
                          <input className="ot-input" name="name" defaultValue={o.ship_name || ""} placeholder="Full name" />
                          <input className="ot-input" name="street1" defaultValue={shipTo.street1} placeholder="Street address" />
                          <input className="ot-input" name="street2" defaultValue={shipTo.street2} placeholder="Apt / unit (optional)" />
                          <div className="lblrow">
                            <input className="ot-input" name="city" defaultValue={shipTo.city} placeholder="City" />
                            <input className="ot-input" name="state" defaultValue={shipTo.state} placeholder="ST" maxLength={2} style={{ maxWidth: 58 }} />
                            <input className="ot-input" name="zip" defaultValue={shipTo.zip} placeholder="ZIP" style={{ maxWidth: 92 }} />
                          </div>
                          <input className="ot-input" name="phone" defaultValue={o.phone || ""} placeholder="Phone (optional)" />
                          <button className="btn btn-primary btn-sm" type="submit">Buy UPS label →</button>
                        </form>
                      </details>
                    )}
                    <form action={saveOutboundTracking} className="ot-form">
                      <input type="hidden" name="id" value={o.id} />
                      <input className="ot-input mono" name="tracking" defaultValue={o.tracking_number || ""} placeholder={o.tracking_number ? "1Z…" : "…or paste UPS tracking #"} />
                      <button className="btn btn-ghost btn-sm" type="submit">{o.tracking_number ? "Update" : "Save"}</button>
                    </form>
                  </div>
                  <div className="ot ot-lab">
                    <div className="ot-k">🧪 To lab <span className="ot-dir">(return)</span></div>
                    {returnTracking && <TrackLink number={returnTracking} />}
                    {returnReg ? (
                      <>
                        <form action={saveReturnTracking} className="ot-form">
                          <input type="hidden" name="sample_id" value={returnReg.sample_id} />
                          <input className="ot-input mono" name="tracking" defaultValue={returnTracking} placeholder="Paste UPS tracking #" />
                          <button className={`btn btn-sm ${returnTracking ? "btn-ghost" : "btn-primary"}`} type="submit">{returnTracking ? "Update" : "Save"}</button>
                        </form>
                        <div className="ot-or">or</div>
                        {statusIndex(returnReg.status) >= 4 ? (
                          <div className="ot-received">✓ Received by lab</div>
                        ) : (
                          <form action={markReceivedByLab}>
                            <input type="hidden" name="sample_id" value={returnReg.sample_id} />
                            <button className="btn btn-ghost btn-sm" type="submit">✓ Mark received by lab</button>
                          </form>
                        )}
                        <div className="sub">Enter tracking if you send the return label — or just mark it received once it arrives at the lab.</div>
                      </>
                    ) : (
                      <>
                        <TrackLink number={returnTracking} />
                        <div className="sub">No registered kit for this customer yet, so there&rsquo;s no sample to attach return tracking to.</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Customer progress */}
                <div className="ocard-prog">
                  <div className="ot-k">Customer progress</div>
                  {regs.length === 0 ? (
                    <div className="sub">No kit registered yet for this email.</div>
                  ) : (
                    <div className="prog-rows">
                      {regs.map((r) => {
                        const released = statusIndex(r.status) >= 6;
                        return (
                          <div className="prog-item" key={r.sample_id}>
                            <div className="prog-row">
                              <span className="mono prog-sid">{r.sample_id}</span>
                              <span className="prog-badges">
                                <span className="badge on">Registered</span>
                                <span className={`badge ${r.coc_url ? "on" : "off"}`}>{r.coc_url ? "COC ✓" : "COC —"}</span>
                                <span className={`badge ${r.trained ? "on" : "off"}`}>{r.trained ? "Trained ✓" : "Training —"}</span>
                                <span className={`badge ${released ? "on" : "off"}`}>{released ? "Results ✓" : "Results —"}</span>
                              </span>
                              <span className="prog-status">{r.status}</span>
                            </div>
                            <details className="prog-attach">
                              <summary>📄 {released ? "Replace results" : "Attach results & release"}</summary>
                              <form action={fulfillAttachResult} className="attach-form">
                                <input type="hidden" name="sample_id" value={r.sample_id} />
                                <input type="file" name="file" accept="application/pdf,.pdf" />
                                <input className="ot-input" name="summary" placeholder="Plain-English summary (optional)" />
                                <button className="btn btn-primary btn-sm" type="submit">Attach &amp; release →</button>
                              </form>
                              <div className="sub">Uploads the PDF and marks this sample <b>Results Ready</b> — the customer sees it on their results page. PDFs up to 4.5 MB; for bigger files paste a hosted URL in the Lab Portal.</div>
                            </details>
                          </div>
                        );
                      })}
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

// ── Dashboard tab ───────────────────────────────────────────────────────────
async function DashboardView({ ok, error }) {
  const ordersByStatus = {};
  let totalOrders = 0, revenueCents = 0, customers = 0, samples = 0, resultsReady = 0;
  try {
    const rows = await sql`select status, count(*)::int n, coalesce(sum(amount_total),0)::bigint rev from orders group by status`;
    for (const r of rows) { ordersByStatus[r.status] = r.n; totalOrders += r.n; revenueCents += Number(r.rev || 0); }
  } catch {}
  try { const r = await sql`select count(distinct lower(email))::int n from orders where email is not null`; customers = r[0]?.n || 0; } catch {}
  try { const r = await sql`select count(*)::int n from sample_registrations`; samples = r[0]?.n || 0; } catch {}
  try { const r = await sql`select count(*)::int n from sample_registrations where status='Results Ready'`; resultsReady = r[0]?.n || 0; } catch {}
  const leadCounts = await leadCountsByType();
  const totalLeads = Object.values(leadCounts).reduce((a, b) => a + b, 0);

  let recentOrders = [];
  try { recentOrders = await sql`select id, customer_name, email, kit_name, amount_total, currency, status, created_at from orders order by created_at desc limit 6`; } catch {}
  const recentLeads = (await listLeads()).slice(0, 6);

  const card = (n, label, href) => (
    <a className="os-card" href={href} style={{ textDecoration: "none" }}>
      <div className="os-n">{n}</div><div className="os-l">{label}</div>
    </a>
  );

  return (
    <>
      {ok && <div className="alert alert-ok">{ok}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ord-summary">
        {card(ordersByStatus.new || 0, "New — to ship", "/fulfillment?tab=orders")}
        {card(totalOrders, "Total orders", "/fulfillment?tab=orders")}
        {card(customers, "Customers", "/fulfillment?tab=leads&type=customer")}
        {card(totalLeads, "Leads captured", "/fulfillment?tab=leads")}
      </div>
      <div className="ord-summary">
        {card(money(revenueCents, "usd"), "Revenue (all orders)", "/fulfillment?tab=orders")}
        {card(samples, "Registered kits", "/fulfillment?tab=orders")}
        {card(resultsReady, "Results ready", "/fulfillment?tab=orders")}
        {card(ordersByStatus.shipped || 0, "Shipped", "/fulfillment?tab=orders")}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-row"><div className="sh">Recent orders</div><a className="btn btn-ghost btn-sm" href="/fulfillment?tab=orders">All orders →</a></div>
          {recentOrders.length === 0 ? <p className="muted">No orders yet.</p> : (
            <div className="dash-list">
              {recentOrders.map((o) => (
                <div className="dash-row" key={o.id}>
                  <div><div className="dr-main">{o.customer_name || o.email || "—"}</div><div className="dr-sub">{o.kit_name || "—"}</div></div>
                  <div className="dr-right"><span className={`pill ${PILL[o.status] || "p-blue"}`}>{o.status}</span><span className="dr-amt">{money(o.amount_total, o.currency)}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="section-row"><div className="sh">Recent leads</div><a className="btn btn-ghost btn-sm" href="/fulfillment?tab=leads">All leads →</a></div>
          {recentLeads.length === 0 ? <p className="muted">No leads captured yet. New newsletter, affiliate &amp; contact submissions land here.</p> : (
            <div className="dash-list">
              {recentLeads.map((l) => (
                <div className="dash-row" key={l.id}>
                  <div><div className="dr-main">{l.name || l.email || l.phone || "—"}</div><div className="dr-sub">{leadTypeLabel(l.type)}{l.email ? ` · ${l.email}` : ""}</div></div>
                  <div className="dr-right"><span className="dr-sub">{fmtDate(l.created_at)}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Leads tab ───────────────────────────────────────────────────────────────
async function LeadsView({ type, ok, error }) {
  const counts = await leadCountsByType();
  const totalLeads = Object.values(counts).reduce((a, b) => a + b, 0);
  let customerCount = 0;
  try { const r = await sql`select count(distinct lower(email))::int n from orders where email is not null`; customerCount = r[0]?.n || 0; } catch {}

  const filters = [
    ["", `All (${totalLeads})`],
    ["customer", `Customers (${customerCount})`],
    ...LEAD_TYPES.map(([k, label]) => [k, `${label} (${counts[k] || 0})`]),
  ];

  return (
    <>
      {ok && <div className="alert alert-ok">{ok}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <nav className="ltabs">
        {filters.map(([k, label]) => (
          <a key={k || "all"} className={`ltab${(type || "") === k ? " on" : ""}`} href={`/fulfillment?tab=leads${k ? `&type=${k}` : ""}`}>{label}</a>
        ))}
      </nav>
      {type === "customer" ? <CustomersTable /> : <LeadsTable type={type} />}
    </>
  );
}

async function CustomersTable() {
  let rows = [];
  try {
    rows = await sql`
      select max(customer_name) as name, max(email) as email, max(phone) as phone,
             count(*)::int as orders, coalesce(sum(amount_total),0)::bigint as total, max(created_at) as last
      from orders where email is not null
      group by lower(email) order by last desc limit 500`;
  } catch {}
  if (!rows.length) return <div className="card"><p className="muted">No customers yet.</p></div>;
  return (
    <div className="card lead-card">
      <table className="leadtable">
        <thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Last</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.name || "—"}</td>
              <td className="mono">{r.email || "—"}</td>
              <td>{r.phone || "—"}</td>
              <td>{r.orders}</td>
              <td>{money(Number(r.total || 0), "usd")}</td>
              <td>{fmtDate(r.last)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function LeadsTable({ type }) {
  const rows = await listLeads(type || undefined);
  if (!rows.length) {
    return (
      <div className="card">
        <p className="muted">No {type ? leadTypeLabel(type).toLowerCase() : "leads"} captured yet. New submissions from the site forms appear here automatically.</p>
      </div>
    );
  }
  return (
    <div className="card lead-card">
      <table className="leadtable">
        <thead><tr><th>Date</th>{!type && <th>Type</th>}<th>Name</th><th>Email</th><th>Phone</th><th>Details</th></tr></thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id}>
              <td>{fmtDate(l.created_at)}</td>
              {!type && <td>{leadTypeLabel(l.type)}</td>}
              <td>{l.name || "—"}</td>
              <td className="mono">{l.email || "—"}</td>
              <td>{l.phone || "—"}</td>
              <td>{[l.message, l.ref ? `ref: ${l.ref}` : "", l.source ? `(${l.source})` : ""].filter(Boolean).join(" · ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
