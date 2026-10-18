import Link from "next/link";
import { sql } from "@/lib/db";
import { mailerConfigured, mailerAuthed } from "@/lib/auth";
import { login, logout, uploadList, createCampaign, deleteList } from "@/app/actions/mailer";
import { transportConfigured } from "@/lib/send";
import { humanInterval, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const PILL = { draft: "p-draft", running: "p-running", paused: "p-paused", done: "p-done" };

export default function Home({ searchParams }) {
  const ok = (searchParams?.ok || "").toString();
  const error = (searchParams?.error || "").toString();

  if (!mailerConfigured()) {
    return (
      <div className="authwrap">
        <div className="authcard">
          <span className="eyebrow">Sacred Sampling · Mailer</span>
          <h1 style={{ fontSize: "1.4rem", margin: "6px 0 8px" }}>Not configured yet</h1>
          <p className="muted">
            Set <span className="mono">MAILER_PIN</span> in this project&rsquo;s environment variables and redeploy.
            See <span className="mono">mailer/README.md</span> for the full setup list.
          </p>
        </div>
      </div>
    );
  }

  if (!mailerAuthed()) {
    return (
      <div className="authwrap">
        <div className="authcard">
          <span className="eyebrow">Sacred Sampling · Mailer</span>
          <h1 style={{ fontSize: "1.4rem", margin: "6px 0 6px" }}>Enter PIN</h1>
          <p className="muted" style={{ marginBottom: 20 }}>Access is restricted.</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form action={login}>
            <div className="field">
              <label>PIN</label>
              <input name="pin" type="password" inputMode="numeric" autoComplete="off" required autoFocus />
            </div>
            <button className="btn btn-primary btn-block" type="submit">Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return <Dashboard ok={ok} error={error} />;
}

async function Dashboard({ ok, error }) {
  let lists = [];
  let campaigns = [];
  let dbError = null;

  try {
    lists = await sql`
      select l.id, l.name, l.created_at,
             (select count(*)::int from mail_contacts c where c.list_id = l.id) as contacts,
             (select count(*)::int from mail_contacts c where c.list_id = l.id and c.unsubscribed) as opted_out
        from mail_lists l
       order by l.created_at desc`;
    campaigns = await sql`
      select c.id, c.name, c.status, c.subject, c.from_email, c.interval_seconds, c.batch_size,
             c.next_send_at, c.created_at, l.name as list_name,
             (select count(*)::int from mail_queue q where q.campaign_id = c.id) as total,
             (select count(*)::int from mail_queue q where q.campaign_id = c.id and q.status = 'sent') as sent
        from mail_campaigns c
        join mail_lists l on l.id = c.list_id
       order by c.created_at desc`;
  } catch (e) {
    dbError = e?.message || "Could not reach the database.";
  }

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <span className="eyebrow">Sacred Sampling · Mailer</span>
            <h1>Lists &amp; campaigns</h1>
          </div>
          <form action={logout}><button className="linkbtn" type="submit">Lock</button></form>
        </div>

        {ok && <div className="alert alert-ok">{ok}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {dbError && (
          <div className="alert alert-error">
            {dbError} — check <span className="mono">DATABASE_URL</span>, and run <span className="mono">db/schema.sql</span> in the Neon SQL editor.
          </div>
        )}
        {!transportConfigured() && (
          <div className="alert alert-warn">
            <span className="mono">RESEND_API_KEY</span> is not set, so nothing can actually be sent yet. You can still upload lists and draft campaigns.
          </div>
        )}
        {!process.env.CRON_SECRET && (
          <div className="alert alert-warn">
            <span className="mono">CRON_SECRET</span> is not set, so the automatic dispatcher is switched off. Campaigns will only advance when you press &ldquo;Send next batch now&rdquo;.
          </div>
        )}

        <div className="split">
          <div>
            <Campaigns campaigns={campaigns} />
            <Lists lists={lists} />
          </div>
          <div>
            <UploadCard />
            <NewCampaignCard lists={lists} />
          </div>
        </div>
      </div>
    </main>
  );
}

function Campaigns({ campaigns }) {
  return (
    <div className="card flat">
      <div style={{ padding: "22px 24px 16px" }}>
        <h2>Campaigns</h2>
        <p className="muted sub">One email, released to the list at a fixed interval.</p>
      </div>
      {campaigns.length === 0 ? (
        <p className="muted" style={{ padding: "0 24px 24px" }}>Nothing yet — upload a list, then create a campaign.</p>
      ) : (
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr><th>Campaign</th><th>List</th><th>Pace</th><th>Progress</th><th>Status</th></tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/campaign/${c.id}`} style={{ fontWeight: 600, color: "var(--brand-ink)" }}>{c.name}</Link>
                    <div className="sub">{c.subject}</div>
                  </td>
                  <td>{c.list_name}</td>
                  <td className="nowrap">
                    {c.batch_size} every {humanInterval(c.interval_seconds)}
                    {c.status === "running" && <div className="sub">next {fmtDateTime(c.next_send_at)}</div>}
                  </td>
                  <td className="nowrap">{c.sent} / {c.total}</td>
                  <td><span className={`pill ${PILL[c.status] || "p-draft"}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Lists({ lists }) {
  return (
    <div className="card flat">
      <div style={{ padding: "22px 24px 16px" }}>
        <h2>Lists</h2>
        <p className="muted sub">Opted-out addresses are held permanently and skipped on every future send.</p>
      </div>
      {lists.length === 0 ? (
        <p className="muted" style={{ padding: "0 24px 24px" }}>No lists uploaded yet.</p>
      ) : (
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr><th>List</th><th>Contacts</th><th>Opted out</th><th>Uploaded</th><th></th></tr>
            </thead>
            <tbody>
              {lists.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>{l.name}</td>
                  <td>{l.contacts}</td>
                  <td>{l.opted_out}</td>
                  <td className="nowrap sub">{fmtDateTime(l.created_at)}</td>
                  <td>
                    <form action={deleteList}>
                      <input type="hidden" name="id" value={l.id} />
                      <button className="btn btn-danger btn-sm" type="submit">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UploadCard() {
  return (
    <div className="card">
      <h2>Upload a list</h2>
      <p className="muted sub" style={{ marginBottom: 16 }}>
        CSV or TSV. Any column named <span className="mono">email</span> is used for the address; a
        <span className="mono"> name</span> (or first/last) column fills <span className="mono">{"{{name}}"}</span>. Every other
        column becomes a merge field you can use in the body.
      </p>
      <form action={uploadList}>
        <div className="field">
          <label>List name</label>
          <input name="name" placeholder="e.g. Home Safety Check leads" />
          <span className="hint">Optional — the file name is used if you leave this blank.</span>
        </div>
        <div className="field">
          <label>CSV file</label>
          <input name="file" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" required />
        </div>
        <button className="btn btn-primary btn-block" type="submit">Upload</button>
      </form>
    </div>
  );
}

function NewCampaignCard({ lists }) {
  const defaultFrom = process.env.MAILER_DEFAULT_FROM || "";
  return (
    <div className="card">
      <h2>New campaign</h2>
      <p className="muted sub" style={{ marginBottom: 16 }}>Nothing sends until you open it and press Start.</p>
      <form action={createCampaign}>
        <div className="field">
          <label>Campaign name</label>
          <input name="name" placeholder="e.g. July well-water outreach" required />
        </div>
        <div className="field">
          <label>Send to list</label>
          <select name="list_id" required defaultValue="">
            <option value="" disabled>Choose a list…</option>
            {lists.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.contacts})</option>)}
          </select>
        </div>
        <div className="row">
          <div className="field">
            <label>From name</label>
            <input name="from_name" placeholder="Sacred Sampling Solutions" />
          </div>
          <div className="field">
            <label>From address</label>
            <input name="from_email" type="email" placeholder="hello@sacredsamplingsolutions.com" defaultValue={defaultFrom} required />
          </div>
        </div>
        <div className="field">
          <label>Reply-to</label>
          <input name="reply_to" type="email" placeholder="Optional — where replies land" />
        </div>
        <div className="field">
          <label>Subject</label>
          <input name="subject" placeholder="Your home safety checklist" required />
        </div>
        <div className="field">
          <label>Message</label>
          <textarea name="body" rows={9} required placeholder={"Hi {{first_name}},\n\nThanks for grabbing the checklist…"} />
          <span className="hint">Plain text. Use {"{{first_name}}"}, {"{{name}}"}, {"{{email}}"} or any column from your CSV.</span>
        </div>
        <label className="check">
          <input type="checkbox" name="body_is_html" />
          My message is already HTML
        </label>
        <div className="row-3">
          <div className="field">
            <label>Send</label>
            <input name="batch_size" type="number" min="1" max="500" defaultValue="1" />
            <span className="hint">emails</span>
          </div>
          <div className="field">
            <label>Every</label>
            <input name="interval_value" type="number" min="1" defaultValue="1" />
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <select name="interval_unit" defaultValue="hours">
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary btn-block" type="submit">Create campaign</button>
      </form>
    </div>
  );
}
