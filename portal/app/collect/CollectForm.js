"use client";

import { useState } from "react";
import { generateCOC } from "@/app/actions/coc";

export default function CollectForm({ sampleId, defaultLocation, defaultMatrix, error }) {
  const [certified, setCertified] = useState(false);

  return (
    <div className="card">
      <span className="eyebrow">Step 3 · Chain of custody</span>
      <h2 className="mt" style={{ marginBottom: 6 }}>Generate your chain of custody</h2>
      <p className="muted" style={{ marginBottom: 18 }}>
        Fill this in as you collect. We create a traceable chain-of-custody document tied to your sample —
        the lab opens it when your kit arrives.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <form action={generateCOC}>
        <input type="hidden" name="sample_id" value={sampleId} />
        <div className="row2">
          <div className="field">
            <label>Date collected</label>
            <input name="collected_date" type="date" required />
          </div>
          <div className="field">
            <label>Time collected</label>
            <input name="collected_time" type="time" />
          </div>
        </div>
        <div className="field">
          <label>Sample location / faucet</label>
          <input name="location" defaultValue={defaultLocation || ""} placeholder="e.g. kitchen cold tap" />
        </div>
        <div className="field">
          <label>Matrix</label>
          <select name="matrix" defaultValue={defaultMatrix || "DW"}>
            <option value="DW">DW — Drinking Water</option>
            <option value="GW">GW — Groundwater / Well</option>
            <option value="A">A — Indoor Air</option>
            <option value="O">O — Other</option>
          </select>
        </div>
        <div className="field">
          <label>Observations <span className="hint">(optional)</span></label>
          <textarea name="observations" rows={2} placeholder="Color, odor, conditions…" />
        </div>
        <div className="field">
          <label>Signature — type your full name</label>
          <input name="signature" placeholder="Type to sign" style={{ fontStyle: "italic", fontSize: "1.05rem" }} required />
        </div>

        <label className="ck">
          <input type="checkbox" name="certify" checked={certified} onChange={(e) => setCertified(e.target.checked)} />
          <span>I certify this information is accurate and the sample was collected and handled under documented chain-of-custody conditions.</span>
        </label>

        <button className="btn btn-primary btn-block" type="submit" disabled={!certified} style={{ marginTop: 8 }}>
          Generate chain of custody →
        </button>
      </form>
    </div>
  );
}
