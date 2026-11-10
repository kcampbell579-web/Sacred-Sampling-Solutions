import { sql } from "@/lib/db";
import { fulfillConfigured, fulfillAuthed } from "@/lib/fulfillauth";
import { fulfillLogin, fulfillLogout, setOrderStatus, saveOutboundTracking, saveReturnTracking, markReceivedByLab, fulfillAttachResult, buyOutboundLabel, refreshTracking } from "@/app/actions/fulfill";
import { getTrackingMany, cleanTracking, carrierFor } from "@/lib/tracking";
import { buildJourney } from "@/lib/journey";
import { processDeliveries } from "@/lib/deliveries";
import { createSocialCodesAction } from "@/app/actions/campaigns";
import { SOCIAL_CODES } from "@/lib/socialCodes";
import { parseShipAddress } from "@/lib/address";
import { orderNumber } from "@/lib/stripe";
import { kvGet } from "@/lib/kv";
import { statusIndex } from "@/lib/status";
import { listLeads, leadCountsByType, LEAD_TYPES, leadTypeLabel } from "@/lib/leads";
import { stripeKeyKind } from "@/lib/stripe";
import {
  ensureAffiliateTables, suggestCode, commissionState,
  HOLD_DAYS, MIN_PAYOUT_CENTS, PAYOUT_METHODS, COMMISSION_RATE, CUSTOMER_DISCOUNT_CENTS,
} from "@/lib/affiliates";
import {
  affiliateStripeCheck, approveAffiliate, rejectAffiliate, setAffiliatePaused,
  toggleAffiliateW9, markAffiliatePaid, voidCommission,
} from "@/app/actions/affiliates";

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

// Six-step order journey: kit out to the customer, sample back to the lab.
function JourneyBar({ journey }) {
  return (
    <ol className="jbar" aria-label="Order progress">
      {journey.steps.map((s) => (
        <li key={s.key} className={`jstep${s.done ? " done" : ""}${s.current ? " current" : ""}${s.error ? " error" : ""}`}>
          <span className="jdot" aria-hidden="true">{s.error ? "!" : s.done ? "✓" : ""}</span>
          <span className="jlbl">{s.label}</span>
          {s.note && <span className="jnote">{s.note}</span>}
        </li>
      ))}
    </ol>
  );
}

const TABS = [["dashboard", "Dashboard"], ["orders", "Orders"], ["leads", "Leads"], ["campaigns", "Campaigns"], ["affiliates", "Affiliates"]];

export default async function Fulfillment({ searchParams }) {
  const ok = (searchParams?.ok || "").toString();
  const error = (searchParams?.error || "").toString();
  const tab = (searchParams?.tab || "dashboard").toString();
  const type = (searchParams?.type || "").toString();
  const authed = fulfillAuthed();
  const title = tab === "orders" ? "Orders" : tab === "leads" ? "Leads" : tab === "campaigns" ? "Campaigns" : tab === "affiliates" ? "Affiliates" : "Dashboard";

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
        ) : tab === "campaigns" ? (
          <CampaignsView ok={ok} error={error} />
        ) : tab === "affiliates" ? (
          <AffiliatesView ok={ok} error={error} />
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
  // Newly delivered kits: mark them and send the "your kit arrived" email (once).
  await processDeliveries();

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

  // Live UPS status for both legs (cached; delivered packages never re-checked).
  const returnRegFor = (o) => {
    const regs = regsByEmail.get(normEmail(o.email)) || [];
    return regs.find((r) => r.tracking_number) || regs[0] || null;
  };
  const live = await getTrackingMany(
    orders.flatMap((o) => [o.tracking_number, returnRegFor(o)?.tracking_number]).filter(Boolean)
  );
  const journeys = orders.map((o) => {
    const reg = returnRegFor(o);
    return buildJourney({
      order: o,
      out: o.tracking_number ? live.get(cleanTracking(o.tracking_number)) || null : null,
      reg,
      back: reg?.tracking_number ? live.get(cleanTracking(reg.tracking_number)) || null : null,
    });
  });
  const deliveredCount = journeys.filter((j) => j.delivered).length;

  return (
    <>
      {ok && <div className="alert alert-ok">{ok}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <div className="ord-summary">
        <div className="os-card"><div className="os-n">{counts.new}</div><div className="os-l">New — to ship</div></div>
        <div className="os-card"><div className="os-n">{counts.shipped}</div><div className="os-l">Shipped</div></div>
        <div className="os-card"><div className="os-n">{deliveredCount}</div><div className="os-l">Delivered</div></div>
        <div className="os-card"><div className="os-n">{counts.fulfilled}</div><div className="os-l">Fulfilled</div></div>
        <div className="os-card"><div className="os-n">{orders.length}</div><div className="os-l">Total orders</div></div>
      </div>

      {orders.length === 0 ? (
        <div className="card"><p className="muted">No orders yet. Paid Stripe checkouts will appear here automatically.</p></div>
      ) : (
        <div className="ord-list">
          {orders.map((o, i) => {
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

                <JourneyBar journey={journeys[i]} />

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
                  {(carrierFor(o.tracking_number) || carrierFor(returnTracking)) ? (
                    <form action={refreshTracking} className="inlineform" title="Ask UPS for the latest status now">
                      {carrierFor(o.tracking_number) && <input type="hidden" name="number" value={o.tracking_number} />}
                      {carrierFor(returnTracking) && <input type="hidden" name="number" value={returnTracking} />}
                      <button className="linkbtn" type="submit">↻ Check UPS now</button>
                    </form>
                  ) : <span />}
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

// ── Campaigns tab: coupon/promotion-code performance ────────────────────────
async function CampaignsView({ ok, error }) {
  let rows = [];
  try {
    rows = await sql`
      select upper(promo_code) as code, count(*)::int as orders,
             coalesce(sum(amount_total),0)::bigint as revenue,
             coalesce(sum(discount_total),0)::bigint as discount,
             max(created_at) as last
      from orders where promo_code is not null and promo_code <> ''
      group by upper(promo_code)
      order by orders desc, revenue desc`;
  } catch {}
  const totalOrders = rows.reduce((a, r) => a + r.orders, 0);
  const totalRev = rows.reduce((a, r) => a + Number(r.revenue || 0), 0);

  return (
    <>
      {ok && <div className="alert alert-ok">{ok}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Social post codes</h2>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: ".85rem" }}>
            Creates the {SOCIAL_CODES.length} codes from your social plan in Stripe ($15 off, first order only). Codes that already exist are skipped, so it&rsquo;s safe to click again.
          </p>
        </div>
        <form action={createSocialCodesAction}><button className="btn btn-primary btn-sm" type="submit">Create social codes</button></form>
      </div>
      <div className="ord-summary">
        <div className="os-card"><div className="os-n">{rows.length}</div><div className="os-l">Codes used</div></div>
        <div className="os-card"><div className="os-n">{totalOrders}</div><div className="os-l">Orders with a code</div></div>
        <div className="os-card"><div className="os-n">{money(totalRev, "usd")}</div><div className="os-l">Revenue from codes</div></div>
      </div>
      {rows.length === 0 ? (
        <div className="card">
          <p className="muted">No coupon redemptions captured yet. When a customer checks out with a promotion code, it shows up here &mdash; code, orders, revenue, and discounts given. (Captured from new orders going forward; match these against the codes in your social-post plan.)</p>
        </div>
      ) : (
        <div className="card lead-card">
          <table className="leadtable">
            <thead><tr><th>Coupon code</th><th>Orders</th><th>Revenue</th><th>Discounts given</th><th>Last used</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="mono"><b>{r.code}</b></td>
                  <td>{r.orders}</td>
                  <td>{money(Number(r.revenue || 0), "usd")}</td>
                  <td>{money(Number(r.discount || 0), "usd")}</td>
                  <td>{fmtDate(r.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── Affiliates tab: Sacred Partners applications, codes, commissions, payouts ──
async function AffiliatesView({ ok, error }) {
  let apps = [], partners = [], recent = [], dbError = "";
  try {
    await ensureAffiliateTables();
    apps = await sql`select * from affiliates where status='pending' order by created_at asc`;
    partners = await sql`
      select a.*,
        count(c.id) filter (where c.status <> 'void')::int as orders,
        coalesce(sum(c.product_cents) filter (where c.status <> 'void'), 0)::bigint as sales,
        coalesce(sum(c.commission_cents) filter (where c.status='pending' and c.created_at >  now() - make_interval(days => ${HOLD_DAYS})), 0)::bigint as pending,
        coalesce(sum(c.commission_cents) filter (where c.status='pending' and c.created_at <= now() - make_interval(days => ${HOLD_DAYS})), 0)::bigint as payable,
        coalesce(sum(c.commission_cents) filter (where c.status='paid'), 0)::bigint as paid
      from affiliates a left join affiliate_commissions c on c.affiliate_id = a.id
      where a.status in ('approved','paused')
      group by a.id order by payable desc, sales desc, a.approved_at desc`;
    recent = await sql`
      select c.*, a.code from affiliate_commissions c join affiliates a on a.id = c.affiliate_id
      order by c.created_at desc limit 50`;
    for (const a of apps) a.suggested = await suggestCode(a);
  } catch (e) {
    dbError = "Couldn't load affiliate data from the database.";
  }
  const owed = partners.reduce((n, p) => n + Number(p.payable || 0), 0);
  const paidAll = partners.reduce((n, p) => n + Number(p.paid || 0), 0);
  const payoutLabel = (k) => (PAYOUT_METHODS.find(([m]) => m === k) || [k, k || "—"])[1];
  const keyKind = stripeKeyKind();
  const keyOk = keyKind.startsWith("full secret key (live)");

  return (
    <>
      {ok && <div className="alert alert-ok">{ok}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {dbError && <div className="alert alert-error">{dbError}</div>}

      <div className="ord-summary">
        <div className="os-card"><div className="os-n">{partners.filter((p) => p.status === "approved").length}</div><div className="os-l">Active partners</div></div>
        <div className="os-card"><div className="os-n">{apps.length}</div><div className="os-l">Applications to review</div></div>
        <div className="os-card"><div className="os-n">{money(owed, "usd")}</div><div className="os-l">Payable now</div></div>
        <div className="os-card"><div className="os-n">{money(paidAll, "usd")}</div><div className="os-l">Paid to date</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Stripe check</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Key in Vercel: <b>{keyKind}</b>{keyOk ? " — can create codes." : keyKind.startsWith("restricted") ? " — needs Write access to Coupons and Promotion codes." : ""}
              {" "}Program: customer saves {money(CUSTOMER_DISCOUNT_CENTS, "usd")}, partner earns {Math.round(COMMISSION_RATE * 100)}%, payable after {HOLD_DAYS} days, {money(MIN_PAYOUT_CENTS, "usd")} minimum payout.
            </p>
          </div>
          <form action={affiliateStripeCheck}><button className="btn btn-ghost btn-sm" type="submit">Run Stripe check</button></form>
        </div>
      </div>

      <h2 style={{ fontSize: "1.1rem", margin: "22px 0 10px" }}>Applications</h2>
      {apps.length === 0 ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>No applications waiting. They arrive from the Become a Partner form on sacredsamplingsolutions.com/affiliate.</p></div>
      ) : (
        <div className="card lead-card">
          <table className="leadtable">
            <thead><tr><th>Applicant</th><th>Audience</th><th>About</th><th>Approve with code</th><th></th></tr></thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.name}</b><br /><span className="muted">{a.email}</span><br /><span className="muted">Applied {fmtDate(a.created_at)}</span></td>
                  <td>{a.channel || "—"}{a.audience ? ` · ${a.audience}` : ""}{a.website ? <><br /><a href={/^https?:/i.test(a.website) ? a.website : `https://${a.website}`} target="_blank" rel="noopener noreferrer">{a.website}</a></> : null}</td>
                  <td style={{ maxWidth: 260 }}>{a.about || <span className="muted">—</span>}</td>
                  <td>
                    <form action={approveAffiliate}>
                      <input type="hidden" name="id" value={a.id} />
                      <input name="code" defaultValue={a.suggested} maxLength={20} className="mono" style={{ width: 130, textTransform: "uppercase", padding: "6px 8px" }} aria-label="Partner code" />
                      <label className="muted" style={{ display: "block", fontSize: ".75rem", margin: "6px 0" }}>
                        <input type="checkbox" name="manual" /> I already made this code in Stripe
                      </label>
                      <button className="btn btn-primary btn-sm" type="submit">Approve</button>
                    </form>
                  </td>
                  <td>
                    <form action={rejectAffiliate}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="linkbtn" type="submit">Decline</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontSize: "1.1rem", margin: "22px 0 10px" }}>Partners</h2>
      {partners.length === 0 ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>No partners yet. Approve an application to create their code.</p></div>
      ) : (
        <div className="card lead-card">
          <table className="leadtable">
            <thead><tr><th>Code</th><th>Partner</th><th>Orders</th><th>Sales</th><th>Pending</th><th>Payable</th><th>Paid</th><th>Payout to</th><th>W-9</th><th></th></tr></thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id}>
                  <td className="mono"><b>{p.code}</b>{p.status === "paused" && <><br /><span className="badge off">paused</span></>}</td>
                  <td>{p.name}<br /><span className="muted">{p.email}</span></td>
                  <td>{p.orders}</td>
                  <td>{money(Number(p.sales), "usd")}</td>
                  <td>{money(Number(p.pending), "usd")}</td>
                  <td><b>{money(Number(p.payable), "usd")}</b>{Number(p.payable) > 0 && Number(p.payable) < MIN_PAYOUT_CENTS && <><br /><span className="muted" style={{ fontSize: ".72rem" }}>under minimum</span></>}</td>
                  <td>{money(Number(p.paid), "usd")}</td>
                  <td>{p.payout_handle ? <>{payoutLabel(p.payout_method)}<br /><span className="muted">{p.payout_handle}</span></> : <span className="muted">not set</span>}</td>
                  <td>
                    <form action={toggleAffiliateW9}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={`badge ${p.w9_received ? "on" : "off"}`} type="submit" title="Click to toggle">{p.w9_received ? "on file" : "needed"}</button>
                    </form>
                  </td>
                  <td style={{ minWidth: 170 }}>
                    {Number(p.payable) > 0 && (
                      <form action={markAffiliatePaid} style={{ marginBottom: 8 }}>
                        <input type="hidden" name="id" value={p.id} />
                        <input name="ref" placeholder="Payment ref (optional)" style={{ width: 150, padding: "5px 7px", fontSize: ".8rem" }} />
                        <button className="btn btn-primary btn-sm" type="submit" style={{ marginTop: 6 }}>Mark {money(Number(p.payable), "usd")} paid</button>
                      </form>
                    )}
                    <form action={setAffiliatePaused}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="pause" value={p.status === "paused" ? "0" : "1"} />
                      <button className="linkbtn" type="submit">{p.status === "paused" ? "Resume code" : "Pause code"}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontSize: "1.1rem", margin: "22px 0 10px" }}>Recent commissions</h2>
      {recent.length === 0 ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Commissions appear here when a customer checks out with a partner&rsquo;s code or link.</p></div>
      ) : (
        <div className="card lead-card">
          <table className="leadtable">
            <thead><tr><th>Date</th><th>Code</th><th>Order</th><th>Via</th><th>Products</th><th>Commission</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {recent.map((c) => {
                const state = commissionState(c);
                return (
                  <tr key={c.id}>
                    <td>{fmtDate(c.created_at)}</td>
                    <td className="mono">{c.code}</td>
                    <td className="mono">{c.order_id ? orderNumber(c.order_id) : "—"}</td>
                    <td>{c.source === "code" ? "Code" : "Link"}</td>
                    <td>{money(c.product_cents, "usd")}</td>
                    <td><b>{money(c.commission_cents, "usd")}</b></td>
                    <td>{state}{c.status === "paid" && c.payout_ref ? <><br /><span className="muted">{c.payout_ref}</span></> : null}</td>
                    <td>
                      {c.status === "pending" && (
                        <form action={voidCommission}>
                          <input type="hidden" name="id" value={c.id} />
                          <button className="linkbtn" type="submit" title="Use for refunded or cancelled orders">Void</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted" style={{ fontSize: ".8rem", marginTop: 12 }}>
        Void a commission if its order is refunded. Collect a W-9 before a partner&rsquo;s first payout. Partner dashboard: app.sacredsamplingsolutions.com/affiliate
      </p>
    </>
  );
}
