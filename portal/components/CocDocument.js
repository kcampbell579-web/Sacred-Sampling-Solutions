import { LAB, CLIENT, RELINQUISHER, ANALYSIS_COLUMNS, checkedColumnsForCode, cocComment, splitCollected } from "@/lib/coc";

const MATRIX_CODE = { water: "DW", air: "A", tick: "O" };

export default function CocDocument({ coc, reg, kit }) {
  const checks = checkedColumnsForCode(reg.kit_code);
  const { date, time } = splitCollected(coc.collected_at);
  const matrix = coc.matrix || MATRIX_CODE[kit?.matrix] || "DW";
  const containers = Math.max(1, checks.filter(Boolean).length);
  const sampler = coc.signature_png || coc.sampler_name || reg.customer_name || "";
  const projectLocation = [reg.city, reg.state].filter(Boolean).join(", ") || "—";
  const comment = cocComment(reg.sample_id, reg.kit_code, reg.kit_panel, coc.location);

  return (
    <div className="cocdoc">
      {/* Header */}
      <div className="coc-top">
        <div className="coc-web">{LAB.web}</div>
        <div className="coc-labline">{LAB.line}</div>
        <div className="coc-doctitle">CHAIN OF CUSTODY / REQUEST FOR ANALYSIS DOCUMENT</div>
      </div>

      {/* Client / sampler block */}
      <div className="coc-client">
        <div className="cc cc-name">
          <div className="cc-lbl">Client Name / Address</div>
          <div className="cc-big">{CLIENT.name}</div>
          <div className="cc-lbl" style={{ marginTop: 8 }}>Project Location</div>
          <div>{projectLocation}</div>
          <div className="cc-emails">
            <div><span className="cc-lbl">Reports Email</span> {CLIENT.reportsEmail}</div>
            <div><span className="cc-lbl">Invoice Email</span> {CLIENT.invoiceEmail}</div>
          </div>
        </div>
        <div className="cc cc-contact">
          <div className="cc-lbl">Contact</div>
          <div className="cc-big">{CLIENT.contact}</div>
          <div className="cc-lbl" style={{ marginTop: 8 }}>Phone</div>
          <div className="cc-big">{CLIENT.phone}</div>
        </div>
        <div className="cc cc-sampler">
          <div className="cc-lbl">Sampler (Signature)</div>
          <div className="cc-sig">{sampler}</div>
          <div className="cc-lbl" style={{ marginTop: 6 }}>Sampler Name (Print)</div>
          <div className="cc-print">{coc.sampler_name || reg.customer_name || "—"}</div>
        </div>
        <div className="cc cc-flags">
          <div><span className="cc-lbl">Samples Sealed</span> <b>YES</b> / NO</div>
          <div style={{ marginTop: 8 }}><span className="cc-lbl">Correct Container(s)</span> <b>YES</b> / NO</div>
          <div style={{ marginTop: 8 }}><span className="cc-lbl">Received At</span> ____ °C</div>
        </div>
      </div>

      {/* Sample table */}
      <div className="coc-tablewrap">
        <table className="coc-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th>Matrix</th>
              <th>Type</th>
              <th>Pres</th>
              <th>Date</th>
              <th>Time</th>
              <th className="col-loc">Sample # / Location</th>
              {ANALYSIS_COLUMNS.map((c) => (
                <th className="col-an" key={c.label}><span>{c.label}</span></th>
              ))}
              <th className="col-cont"># Cont.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="col-num">1</td>
              <td>{matrix}</td>
              <td>G</td>
              <td>1</td>
              <td>{date}</td>
              <td>{time || "—"}</td>
              <td className="col-loc mono">{reg.sample_id}</td>
              {checks.map((on, i) => (
                <td className="col-an" key={i}>{on ? "✓" : ""}</td>
              ))}
              <td className="col-cont">{containers}</td>
            </tr>
            {[2, 3, 4].map((n) => (
              <tr key={n}>
                <td className="col-num">{n}</td>
                <td /><td /><td /><td /><td /><td className="col-loc" />
                {ANALYSIS_COLUMNS.map((_, i) => <td className="col-an" key={i} />)}
                <td className="col-cont" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legends + comments */}
      <div className="coc-lower">
        <div className="coc-legend">
          <div><b>Matrix:</b> S=Soil; SL=Sludge; DW=Drinking Water; A=Air; W=Wipe; PC=Paint Chips; BM=Bulk Material; O=Oil; WW=Waste Water</div>
          <div><b>Type:</b> G=Grab; C=Composite; SS=Split Spoon</div>
          <div><b>Pres:</b> (1) Ice; (2) HCl; (3) H₂SO₄; (4) NaOH; (5) Na₂S₂O₃; (6) HNO₃; (7) Other</div>
        </div>
        <div className="coc-comments">
          <div className="cc-lbl">Comments / Instructions</div>
          <div>{comment}</div>
        </div>
      </div>

      {/* Custody signatures */}
      <div className="coc-custody">
        <div className="ccx">
          <div className="cc-lbl">Relinquished by (Signature)</div>
          <div className="cc-sig">{RELINQUISHER}</div>
          <div className="ccx-row"><span>Printed: {RELINQUISHER}</span><span>{date} {time}</span></div>
        </div>
        <div className="ccx">
          <div className="cc-lbl">Received by (Signature)</div>
          <div className="cc-sig" style={{ color: "#c4d0e0" }}>Pending</div>
          <div className="ccx-row"><span>For laboratory use</span><span>____ / ____</span></div>
        </div>
      </div>

      <div className="coc-foot">
        <div>COC Ref <b>{coc.coc_ref}</b> · Page 1 of 1</div>
        <div className="coc-accred">{LAB.accreditations}</div>
      </div>
    </div>
  );
}
