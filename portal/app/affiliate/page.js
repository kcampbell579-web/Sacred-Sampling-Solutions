import { getUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import CopyButton from "./CopyButton";
import { saveAffiliatePayout } from "@/app/actions/affiliates";
import {
  ensureAffiliateTables, affiliateTotals, commissionState, referralLink,
  HOLD_DAYS, MIN_PAYOUT_CENTS, PAYOUT_METHODS, COMMISSION_RATE, CUSTOMER_DISCOUNT_CENTS, SITE,
} from "@/lib/affiliates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Partner dashboard — Sacred Sampling Solutions" };

const money = (c) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(c || 0) / 100);
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
const RATE = `${Math.round(COMMISSION_RATE * 100)}%`;
const OFF = money(CUSTOMER_DISCOUNT_CENTS).replace(".00", "");

export default async function AffiliatePage({ searchParams }) {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/affiliate")}`);
  const ok = (searchParams?.ok || "").toString();
  const error = (searchParams?.error || "").toString();

  await ensureAffiliateTables();
  const rows = await sql`select * from affiliates where user_id=${user.id} or email=${user.email.toLowerCase()} order by id limit 1`;
  const aff = rows[0] || null;

  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="wrap" style={{ maxWidth: 960 }}>
          <div className="page-head">
            <span className="eyebrow">Sacred Partners</span>
            <h1>Partner dashboard</h1>
          </div>
          {ok && <div className="alert alert-ok">{ok}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          {!aff ? <NotPartner />
            : aff.status === "pending" ? <Notice title="Your application is under review">We review every application personally and will email you at <b>{aff.email}</b> once you&rsquo;re approved &mdash; usually within a few business days.</Notice>
            : aff.status === "rejected" ? <Notice title="Application not approved">Thanks for your interest in the Sacred Partners program. We weren&rsquo;t able to approve this application. Questions? Email <a href="mailto:info@sacredsamplingsolutions.com">info@sacredsamplingsolutions.com</a>.</Notice>
            : <Dashboard aff={aff} />}
        </div>
      </main>
    </>
  );
}

function Notice({ title, children }) {
  return <div className="card"><h2 style={{ marginTop: 0 }}>{title}</h2><p className="muted" style={{ marginBottom: 0 }}>{children}</p></div>;
}

function NotPartner() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Become a Sacred Partner</h2>
      <p className="muted">Share lab-backed home testing with your audience. They save <b>{OFF}</b> with your code, and you earn <b>{RATE}</b> on every sale.</p>
      <a className="btn btn-primary" href={`${SITE}/affiliate#apply`}>Apply to the program &rarr;</a>
    </div>
  );
}

async function Dashboard({ aff }) {
  const t = await affiliateTotals(aff.id);
  const refs = await sql`
    select c.created_at, c.source, c.product_cents, c.commission_cents, c.status, c.paid_at, o.kit_name
    from affiliate_commissions c left join orders o on o.id = c.order_id
    where c.affiliate_id = ${aff.id} and c.status <> 'void'
    order by c.created_at desc limit 100`;
  const link = referralLink(aff.code);
  const captions = [
    `Do you actually know what's in your tap water? I tested mine with @sacredsamplingsolutions — a real accredited lab, not test strips. Use code ${aff.code} for ${OFF} off. #ad`,
    `New home? Old pipes? Well water? Sacred Sampling Solutions mails you a kit, a lab analyzes it, and you get clear results. ${OFF} off with my code ${aff.code} 👉 ${link} (I earn a commission)`,
    `PFAS, lead, VOCs — you can't see, smell or taste them. Get your home tested by a certified lab: ${link} — code ${aff.code} saves you ${OFF}. #partner`,
  ];

  return (
    <>
      {aff.status === "paused" && <div className="alert alert-error">Your code is paused right now, so it won&rsquo;t work at checkout. Email info@sacredsamplingsolutions.com with any questions.</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
          <div>
            <div className="muted" style={{ fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".06em" }}>Your code &mdash; customers save {OFF}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <span className="mono" style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--brand)", letterSpacing: ".04em" }}>{aff.code}</span>
              <CopyButton text={aff.code} />
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".06em" }}>Your link &mdash; applies your code automatically</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              <span className="mono" style={{ fontSize: ".85rem", wordBreak: "break-all" }}>{link}</span>
              <CopyButton text={link} />
            </div>
          </div>
        </div>
      </div>

      <div className="ord-summary">
        <div className="os-card"><div className="os-n">{t.orders}</div><div className="os-l">Orders referred</div></div>
        <div className="os-card"><div className="os-n">{money(t.sales)}</div><div className="os-l">Sales</div></div>
        <div className="os-card"><div className="os-n">{money(t.pending)}</div><div className="os-l">Pending ({HOLD_DAYS}-day hold)</div></div>
        <div className="os-card"><div className="os-n">{money(t.payable)}</div><div className="os-l">Ready to pay</div></div>
        <div className="os-card"><div className="os-n">{money(t.paid)}</div><div className="os-l">Paid to you</div></div>
      </div>

      <h2 style={{ fontSize: "1.1rem", margin: "22px 0 10px" }}>Your referrals</h2>
      {refs.length === 0 ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>No sales yet. Share your code or link &mdash; each order shows up here as soon as it&rsquo;s placed.</p></div>
      ) : (
        <div className="card lead-card">
          <table className="leadtable">
            <thead><tr><th>Date</th><th>Kit</th><th>Via</th><th>Sale</th><th>You earn</th><th>Status</th></tr></thead>
            <tbody>
              {refs.map((r, i) => (
                <tr key={i}>
                  <td>{fmtDate(r.created_at)}</td>
                  <td>{r.kit_name || "Test kit"}</td>
                  <td>{r.source === "code" ? "Your code" : "Your link"}</td>
                  <td>{money(r.product_cents)}</td>
                  <td><b>{money(r.commission_cents)}</b></td>
                  <td>{commissionState(r)}{r.status === "paid" && r.paid_at ? ` ${fmtDate(r.paid_at)}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 22 }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>How you get paid</h2>
          <form action={saveAffiliatePayout}>
            <div className="field">
              <label>Payout method</label>
              <select name="method" defaultValue={aff.payout_method || ""} required>
                <option value="" disabled>Choose…</option>
                {PAYOUT_METHODS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Send payments to</label>
              <input name="handle" defaultValue={aff.payout_handle || ""} placeholder="PayPal email, @venmo, Zelle phone/email, or mailing address" required />
            </div>
            <button className="btn btn-primary btn-sm" type="submit">Save payout details</button>
          </form>
          <p className="muted" style={{ fontSize: ".82rem", marginBottom: 0 }}>
            Commissions are {RATE} of the products a customer buys (after their discount, before shipping and tax). Each one is held {HOLD_DAYS} days in case of a return, then paid monthly once you have at least {money(MIN_PAYOUT_CENTS)} ready.
            {!aff.w9_received && " Before your first payout we'll send you a secure request for a W-9 (required for U.S. tax reporting)."}
          </p>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Ready-to-post captions</h2>
          {captions.map((c, i) => (
            <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : 0, padding: "10px 0" }}>
              <p style={{ margin: "0 0 8px", fontSize: ".88rem" }}>{c}</p>
              <CopyButton text={c} label="Copy caption" />
            </div>
          ))}
          <p className="muted" style={{ fontSize: ".78rem", margin: "6px 0 0" }}>
            The FTC requires you to disclose the partnership every time (#ad, #partner, or &ldquo;I earn a commission&rdquo;). Please don&rsquo;t make health claims, post your code on coupon sites, or use it on your own orders.
          </p>
        </div>
      </div>
    </>
  );
}
