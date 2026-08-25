import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { mailerConfigured, mailerAuthed } from "@/lib/auth";
import { setCampaignStatus, sendTest, sendNextBatch, retryFailed, deleteCampaign } from "@/app/actions/mailer";
import { renderEmail, mergeTokens } from "@/lib/render";
import { humanInterval, fmtDateTime, estimateRemaining } from "@/lib/format";

export const dynamic = "force-dynamic";

const PILL = { draft: "p-draft", running: "p-running", paused: "p-paused", done: "p-done" };
const ROW_PILL = { sent: "p-done", queued: "p-draft", sending: "p-running", failed: "p-failed", skipped: "p-draft" };

export default async function CampaignPage({ params, searchParams }) {
  if (!mailerConfigured() || !mailerAuthed()) {
    return (
      <div className="authwrap">
        <div className="authcard">
          <h1 style={{ fontSize: "1.3rem", marginBottom: 8 }}>Locked</h1>
          <p className="muted"><Link href="/" style={{ color: "var(--brand-ink)", fontWeight: 600 }}>Enter your PIN →</Link></p>
        </div>
      </div>
    );
  }

  const id = Number(params.id);
  const ok = (searchParams?.ok || "").toString();
  const error = (searchParams?.error || "").toString();

  const [c] = await sql`
    select c.*, l.name as list_name
      from mail_campaigns c
      join mail_lists l on l.id = c.list_id
     where c.id = ${id}`;
  if (!c) notFound();

  const counts = await sql`
    select status, count(*)::int as n from mail_queue where campaign_id = ${id} group by status`;
  const byStatus = Object.fromEntries(counts.map((r) => [r.status, r.n]));
  const total = counts.reduce((n, r) => n + r.n, 0);
  const sent = byStatus.sent || 0;
  const queued = (byStatus.queued || 0) + (byStatus.sending || 0);
  const failed = byStatus.failed || 0;
  const skipped = byStatus.skipped || 0;

  const recent = await sql`
    select q.email, q.status, q.attempts, q.error, q.sent_at
      from mail_queue q
     where q.campaign_id = ${id}
     order by (q.sent_at is null), q.sent_at desc, q.id
     limit 25`;

  const sample = { email: "you@example.com", name: "Alex Rivera", fields: {} };
  const preview = renderEmail({ body: c.body, bodyIsHtml: c.body_is_html, contact: sample });
  const pct = (n) => (total ? (n / total) * 100 : 0);

  return (
    <main className="page">
      <div className="wrap">
        <Link href="/" className="crumb">← All campaigns</Link>
        <div className="page-head" style={{ marginTop: 10 }}>
          <div>
            <span className="eyebrow">{c.list_name}</span>
            <h1>{c.name}</h1>
          </div>
          <span className={`pill ${PILL[c.status] || "p-draft"}`}>{c.status}</span>
        </div>

        {ok && <div className="alert alert-ok">{ok}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="stats">
          <div className="stat"><div className="n">{total}</div><div className="l">On this campaign</div></div>
          <div className="stat"><div className="n">{sent}</div><div className="l">Sent</div></div>
          <div className="stat"><div className="n">{queued}</div><div className="l">Still queued</div></div>
          <div className="stat"><div className="n">{failed}</div><div className="l">Failed</div></div>
          <div className="stat"><div className="n">{skipped}</div><div className="l">Skipped (opted out)</div></div>
        </div>

        <div className="card">
          <div className="bar" aria-label={`${sent} of ${total} sent`}>
            <span className="b-sent" style={{ width: `${pct(sent)}%` }} />
            <span className="b-failed" style={{ width: `${pct(failed)}%` }} />
            <span className="b-skipped" style={{ width: `${pct(skipped)}%` }} />
          </div>
          <div className="mt muted" style={{ fontSize: ".9rem" }}>
            Releasing <b>{c.batch_size}</b> email{c.batch_size === 1 ? "" : "s"} every <b>{humanInterval(c.interval_seconds)}</b>
            {" "}from <span className="mono">{c.from_email}</span>.
            {c.status === "running" && <> Next batch at <b>{fmtDateTime(c.next_send_at)}</b>; {queued} left, {estimateRemaining(queued, c.batch_size, c.interval_seconds)} to finish.</>}
            {c.status === "done" && <> Finished {fmtDateTime(c.finished_at)}.</>}
            {c.status === "paused" && <> Paused — nothing goes out until you resume.</>}
            {c.status === "draft" && <> Not started yet.</>}
          </div>

          <div className="actions mt" style={{ marginTop: 18 }}>
            {c.status === "running" ? (
              <>
                <form action={setCampaignStatus}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="status" value="paused" />
                  <button className="btn btn-ghost" type="submit">Pause</button>
                </form>
                <form action={sendNextBatch}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="btn btn-primary" type="submit">Send next batch now</button>
                </form>
              </>
            ) : c.status !== "done" ? (
              <form action={setCampaignStatus}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="status" value="running" />
                <button className="btn btn-primary" type="submit">{c.status === "paused" ? "Resume" : "Start sending"}</button>
              </form>
            ) : null}

            {failed > 0 && (
              <form action={retryFailed}>
                <input type="hidden" name="id" value={c.id} />
                <button className="btn btn-ghost" type="submit">Retry {failed} failed</button>
              </form>
            )}

            <form action={deleteCampaign} style={{ marginLeft: "auto" }}>
              <input type="hidden" name="id" value={c.id} />
              <button className="btn btn-danger btn-sm" type="submit">Delete campaign</button>
            </form>
          </div>
        </div>

        <div className="split">
          <div className="card">
            <h2>Preview</h2>
            <p className="muted sub" style={{ marginBottom: 6 }}>
              Subject: <b>{mergeTokens(c.subject, sample)}</b>
            </p>
            <iframe
              title="Email preview"
              srcDoc={preview.html}
              sandbox=""
              style={{ width: "100%", height: 340, border: "1px solid var(--line)", borderRadius: 12, background: "#eef4fc", marginTop: 10 }}
            />
          </div>

          <div className="card">
            <h2>Send a test</h2>
            <p className="muted sub" style={{ marginBottom: 14 }}>Goes to one address only and is not recorded against the list.</p>
            <form action={sendTest}>
              <input type="hidden" name="id" value={c.id} />
              <div className="field">
                <label>Your address</label>
                <input name="test_email" type="email" placeholder="you@sacredsamplingsolutions.com" required />
              </div>
              <button className="btn btn-ghost btn-block" type="submit">Send test</button>
            </form>
          </div>
        </div>

        <div className="card flat">
          <div style={{ padding: "22px 24px 16px" }}>
            <h2>Activity</h2>
            <p className="muted sub">Most recent 25 recipients.</p>
          </div>
          <div className="tbl-scroll">
            <table className="tbl">
              <thead><tr><th>Address</th><th>Status</th><th>Sent</th><th>Detail</th></tr></thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.email}>
                    <td className="mono" style={{ fontSize: ".85rem" }}>{r.email}</td>
                    <td><span className={`pill ${ROW_PILL[r.status] || "p-draft"}`}>{r.status}</span></td>
                    <td className="nowrap sub">{r.sent_at ? fmtDateTime(r.sent_at) : "—"}</td>
                    <td className="sub">{r.error || (r.attempts > 1 ? `${r.attempts} attempts` : "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
