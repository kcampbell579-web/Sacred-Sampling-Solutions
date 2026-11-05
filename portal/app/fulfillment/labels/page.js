import QRCode from "qrcode";
import { sql } from "@/lib/db";
import { fulfillConfigured, fulfillAuthed } from "@/lib/fulfillauth";
import { KIT_TYPES } from "@/lib/catalog";
import { cocPublicUrl } from "@/lib/coc";
import { mintLabels } from "@/app/actions/labels";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kit QR labels — Sacred Sampling", robots: { index: false } };

// CUSTOMER QR → registration with the Sample ID prefilled.
// LAB QR → the public chain-of-custody link for the SAME Sample ID.
// Override the host with PORTAL_BASE_URL in Vercel if the portal ever moves.
const APP_BASE = process.env.PORTAL_BASE_URL || "https://app.sacredsamplingsolutions.com";
const regUrl = (sid) => `${APP_BASE}/sampleregistration?id=${encodeURIComponent(sid)}`;

const QR_OPTS = { margin: 0, width: 320, errorCorrectionLevel: "M" };

const PRINT_CSS = `
.ql-sheet { display: flex; flex-wrap: wrap; gap: 0.18in; margin-top: 18px; }
.ql-label {
  width: 3.65in; box-sizing: border-box; border: 1px solid #c9d4e6; border-radius: 7px;
  overflow: hidden; background: #fff; color: #0b1b3a; font-family: Arial, Helvetica, sans-serif;
  break-inside: avoid; page-break-inside: avoid;
}
.ql-ban { background: #000; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 6px 8px; }
.ql-ban svg { width: 20px; height: 20px; flex: 0 0 auto; }
.ql-brand { text-align: center; line-height: 1; }
.ql-brand .b1 { color: #19a6f0; font-weight: 800; font-size: 18px; letter-spacing: 1.5px; }
.ql-brand .b2 { color: #fff; font-size: 7px; letter-spacing: 3px; margin-top: 3px; }
.ql-body { display: grid; grid-template-columns: 1fr 1.22fr 1fr; align-items: start; gap: 6px; padding: 9px 8px 10px; }
.ql-col { text-align: center; }
.ql-tab { background: #1f93e6; color: #fff; font-size: 8px; font-weight: 800; letter-spacing: .5px; padding: 2px 7px; border-radius: 3px; display: inline-block; }
.ql-col img { width: 0.95in; height: 0.95in; display: block; margin: 5px auto 3px; }
.ql-sub { font-size: 7.5px; font-weight: 800; letter-spacing: .4px; }
.ql-sub.reg { color: #1f93e6; }
.ql-sub.coc { color: #0b1b3a; }
.ql-mid { text-align: center; padding-top: 2px; }
.ql-kitname { color: #1f93e6; font-weight: 800; font-size: 12px; line-height: 1.1; }
.ql-rule { height: 1px; background: #1f93e6; margin: 6px auto; width: 82%; }
.ql-idlabel { font-size: 7px; color: #666; letter-spacing: 1.5px; }
.ql-id { font-family: ui-monospace, Menlo, Consolas, monospace; font-weight: 800; font-size: 15px; color: #0b1b3a; margin-top: 2px; }
@media print {
  .ql-noprint { display: none !important; }
  @page { margin: 0.4in; }
  body { background: #fff !important; }
  .ql-sheet { margin-top: 0; }
}
`;

const Droplet = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2C12 2 5 9.6 5 15a7 7 0 0 0 14 0c0-5.4-7-13-7-13z" fill="#19a6f0" />
    <path d="M12 2C12 2 5 9.6 5 15a7 7 0 0 0 14 0c0-5.4-7-13-7-13z" fill="none" stroke="#fff" strokeWidth="1" />
  </svg>
);

export default async function LabelsPage({ searchParams }) {
  const batch = (searchParams?.batch || "").toString();
  const error = (searchParams?.error || "").toString();

  if (!fulfillConfigured() || !fulfillAuthed()) {
    return (
      <main className="page">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <div className="card">
            <h2>Locked</h2>
            <p className="muted mt">
              Unlock the <a href="/fulfillment">fulfillment portal</a> first, then come back here to print kit QR labels.
            </p>
          </div>
        </div>
      </main>
    );
  }

  let labels = [];
  if (batch) {
    const rows = await sql`select sample_id, kit_code from issued_sample_ids where batch=${batch} order by sample_id`;
    labels = await Promise.all(
      rows.map(async (r) => ({
        sampleId: r.sample_id,
        kit: (KIT_TYPES[r.kit_code]?.title || r.kit_code).toUpperCase(),
        qrReg: await QRCode.toDataURL(regUrl(r.sample_id), QR_OPTS),
        qrCoc: await QRCode.toDataURL(cocPublicUrl(r.sample_id), QR_OPTS),
      }))
    );
  }

  const first = labels[0]?.sampleId;
  const last = labels[labels.length - 1]?.sampleId;

  return (
    <main className="page">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="wrap" style={{ maxWidth: 1040 }}>
        <div className="ql-noprint">
          <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <span className="eyebrow">Sacred Sampling · Fulfillment</span>
              <h1>Kit QR labels</h1>
            </div>
            <a className="linkbtn" href="/fulfillment">← Orders</a>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {!labels.length && (
            <>
              <div className="card" style={{ maxWidth: 480 }}>
                <p className="muted" style={{ marginBottom: 16 }}>
                  Pick a kit type and how many stickers you need. Each label carries its own Sample ID with two QR codes
                  on it: <b>Customer → Scan to register</b>, and <b>Lab → Chain of custody</b> (same Sample ID). IDs start
                  at <span className="mono">13000</span> and count up, so they never clash with labels you already made.
                </p>
                <form action={mintLabels}>
                  <div className="field">
                    <label>Kit type</label>
                    <select name="kit_code" defaultValue="ESS" required>
                      {Object.values(KIT_TYPES).map((k) => (
                        <option key={k.code} value={k.code}>{k.code} — {k.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>How many labels? <span className="hint">(1–40 per sheet)</span></label>
                    <input name="qty" type="number" min={1} max={40} defaultValue={12} required />
                  </div>
                  <button className="btn btn-primary btn-block" type="submit">Generate QR labels →</button>
                </form>
              </div>
              <p className="muted mt" style={{ fontSize: ".9rem" }}>
                Only kit types with a portal registration flow are listed — scanning one of these codes auto-detects the kit.
              </p>
              <RecentBatches />
            </>
          )}

          {!!labels.length && (
            <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <strong>{labels.length} label{labels.length === 1 ? "" : "s"}</strong>{" "}
                <span className="muted">· {labels[0]?.kit}</span>
                {first && (
                  <div className="mono" style={{ fontSize: ".9rem", marginTop: 4 }}>
                    {first}{last && last !== first ? ` – ${last}` : ""}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <PrintButton />
                <a className="btn btn-ghost" href="/fulfillment/labels">+ New batch</a>
              </div>
            </div>
          )}
        </div>

        {!!labels.length && (
          <div className="ql-sheet">
            {labels.map((l) => (
              <div className="ql-label" key={l.sampleId}>
                <div className="ql-ban">
                  <Droplet />
                  <div className="ql-brand">
                    <div className="b1">SACRED</div>
                    <div className="b2">SAMPLING SOLUTIONS</div>
                  </div>
                </div>
                <div className="ql-body">
                  <div className="ql-col">
                    <span className="ql-tab">CUSTOMER</span>
                    <img src={l.qrReg} alt={`Register ${l.sampleId}`} width={91} height={91} />
                    <div className="ql-sub reg">SCAN TO REGISTER</div>
                  </div>
                  <div className="ql-mid">
                    <div className="ql-kitname">{l.kit}</div>
                    <div className="ql-rule" />
                    <div className="ql-idlabel">SAMPLE ID:</div>
                    <div className="ql-id">{l.sampleId}</div>
                  </div>
                  <div className="ql-col">
                    <span className="ql-tab">LAB USE ONLY</span>
                    <img src={l.qrCoc} alt={`Chain of custody ${l.sampleId}`} width={91} height={91} />
                    <div className="ql-sub coc">CHAIN OF CUSTODY</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// Past label batches, so an operator can re-open / re-print any set generated
// earlier (each batch is otherwise only reachable by its one-time URL).
async function RecentBatches() {
  let rows = [];
  try {
    rows = await sql`
      select batch, max(kit_code) as kit_code, count(*)::int as n,
             min(sample_id) as first_id, max(sample_id) as last_id, max(created_at) as created
      from issued_sample_ids where batch is not null
      group by batch order by created desc limit 30`;
  } catch {}
  if (!rows.length) return null;
  const d = (v) => { try { return new Date(v).toISOString().slice(0, 16).replace("T", " "); } catch { return ""; } };
  return (
    <div className="card" style={{ maxWidth: 560, marginTop: 18 }}>
      <div className="section-row"><div className="sh">Recent batches</div></div>
      <p className="muted" style={{ fontSize: ".85rem", marginBottom: 10 }}>Re-open any batch to view or re-print its labels.</p>
      <div className="dash-list">
        {rows.map((b) => (
          <a className="dash-row" key={b.batch} href={`/fulfillment/labels?batch=${encodeURIComponent(b.batch)}`} style={{ textDecoration: "none" }}>
            <div>
              <div className="dr-main">{(KIT_TYPES[b.kit_code]?.title || b.kit_code)} · {b.n} label{b.n === 1 ? "" : "s"}</div>
              <div className="dr-sub mono">{b.first_id}{b.last_id !== b.first_id ? ` – ${b.last_id}` : ""}</div>
            </div>
            <div className="dr-right"><span className="dr-sub">{d(b.created)}</span><span className="dr-sub">Open →</span></div>
          </a>
        ))}
      </div>
    </div>
  );
}
