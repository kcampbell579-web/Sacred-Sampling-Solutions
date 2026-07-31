"use client";

import { useState } from "react";
import { parseSampleId } from "@/lib/catalog";
import { registerSample } from "@/app/actions/registration";

export default function RegisterForm({ initialId, user, error }) {
  const [sid, setSid] = useState(initialId || "");
  const parsed = parseSampleId(sid);
  const kit = parsed?.kit || null;
  const matrix = kit?.matrix || null;

  const [firstDefault, ...rest] = (user.name || "").split(" ");
  const lastDefault = rest.join(" ");

  return (
    <main className="page">
      <div className="wrap" style={{ maxWidth: 620 }}>
        <div className="page-head">
          <span className="eyebrow">Step 1 · Register your kit</span>
          <h1>Register your test kit</h1>
          <p className="muted">
            Your Sample ID links this kit to your results. Scanned the QR? It&rsquo;s already filled in below.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form action={registerSample} className="card">
          <div className="field">
            <label>Your Sample ID</label>
            <input
              name="sample_id"
              value={sid}
              onChange={(e) => setSid(e.target.value)}
              placeholder="SSS-COM-00001"
              autoCapitalize="characters"
              className="mono"
              required
            />
            {kit ? (
              <div className="kitbanner">
                <span className="dot">✓</span>
                <div>
                  <div className="kb-label">Detected kit</div>
                  <div className="kb-name">{kit.title}</div>
                </div>
              </div>
            ) : (
              <span className="hint">{sid ? "Keep typing — the format is SSS-COM-00001." : "Printed on your kit label."}</span>
            )}
          </div>

          <div className="row2">
            <div className="field">
              <label>First name</label>
              <input name="first_name" defaultValue={firstDefault || ""} required />
            </div>
            <div className="field">
              <label>Last name</label>
              <input name="last_name" defaultValue={lastDefault} />
            </div>
          </div>

          <div className="field">
            <label>Email</label>
            <input name="email" type="email" defaultValue={user.email || ""} required />
            <span className="hint">Your chain-of-custody copy, tracking, and results all go here.</span>
          </div>
          <div className="field">
            <label>Phone <span className="hint">(optional)</span></label>
            <input name="phone" type="tel" defaultValue={user.phone || ""} />
          </div>

          <div className="field">
            <label>Street address <span className="hint">(where the sample was taken)</span></label>
            <input name="street" />
          </div>
          <div className="row3">
            <div className="field"><label>City</label><input name="city" /></div>
            <div className="field"><label>State</label><input name="state" maxLength={2} placeholder="NY" /></div>
            <div className="field"><label>ZIP</label><input name="zip" /></div>
          </div>

          {matrix === "water" && (
            <div className="cond">
              <div className="cond-t">For water kits</div>
              <div className="field">
                <label>Water source</label>
                <select name="water_source" defaultValue="">
                  <option value="">Choose…</option>
                  <option>Municipal / city water</option>
                  <option>Private well</option>
                  <option>Shared well</option>
                  <option>Spring</option>
                  <option>Cistern</option>
                  <option>Bottled</option>
                  <option>Other / not sure</option>
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Where in the home was it collected?</label>
                <input name="sample_source" placeholder="e.g. kitchen cold tap" />
              </div>
            </div>
          )}

          {matrix === "air" && (
            <div className="cond">
              <div className="cond-t">For air kits</div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Which room was monitored?</label>
                <input name="room_location" placeholder="e.g. nursery, basement" />
              </div>
            </div>
          )}

          <label className="ck">
            <input type="checkbox" name="consent" required />
            <span>I understand my sample ships the same day it&rsquo;s collected, with the chain-of-custody completed.</span>
          </label>
          <label className="ck">
            <input type="checkbox" name="marketing" />
            <span>Send me occasional home-safety tips and product updates. (optional)</span>
          </label>

          <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: 6 }}>
            Register &amp; start training →
          </button>
        </form>
      </div>
    </main>
  );
}
