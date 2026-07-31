"use client";

import { useState } from "react";
import { saveAcknowledgment } from "@/app/actions/training";

export default function TrainingGate({ slug, sampleId, videoUrl, kitTitle }) {
  // If there's no video for this kit yet, don't block on it.
  const [watched, setWatched] = useState(!videoUrl);
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [c, setC] = useState(false);
  const [name, setName] = useState("");

  const ready = watched && a && b && c && name.trim().length > 1;

  return (
    <div className="card">
      <span className="eyebrow">Required · watch before you collect</span>
      <h2 className="mt" style={{ marginBottom: 6 }}>{kitTitle} — collection training</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        This short training is required. The acknowledgment below unlocks once the video finishes — we
        record that you watched it for your chain of custody.
      </p>

      {videoUrl ? (
        <video
          className="trainvid"
          controls
          playsInline
          preload="metadata"
          onEnded={() => setWatched(true)}
          src={videoUrl}
        />
      ) : (
        <div className="alert">A training video for this kit is coming soon — continue below.</div>
      )}

      <div className={`locktag ${watched ? "ok" : ""}`}>
        {watched ? "✓ Training complete" : "🔒 Finish the video to unlock the acknowledgment"}
      </div>

      <form action={saveAcknowledgment} style={{ marginTop: 18, opacity: watched ? 1 : 0.55 }}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="sample_id" value={sampleId} />
        {watched && <input type="hidden" name="ack_watched" value="1" />}

        <label className="ck">
          <input type="checkbox" name="ack_watched_box" disabled={!watched} checked={a} onChange={(e) => setA(e.target.checked)} />
          <span>I watched the full training video and understand the collection protocol for this kit.</span>
        </label>
        <label className="ck">
          <input type="checkbox" name="ack_deviations" disabled={!watched} checked={b} onChange={(e) => setB(e.target.checked)} />
          <span>I understand that not following the protocol can invalidate my results and require re-collection at my expense.</span>
        </label>
        <label className="ck">
          <input type="checkbox" name="ack_responsibility" disabled={!watched} checked={c} onChange={(e) => setC(e.target.checked)} />
          <span>I accept responsibility for collecting and shipping my sample correctly; Sacred Sampling Solutions is not liable for results affected by protocol deviations.</span>
        </label>

        <div className="field" style={{ marginTop: 6 }}>
          <label>Type your full name to sign</label>
          <input
            name="signed_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            style={{ fontStyle: "italic" }}
            disabled={!watched}
          />
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={!ready}>
          Acknowledge &amp; continue to Chain of Custody →
        </button>
        <p className="hint" style={{ marginTop: 8 }}>
          {ready ? "You're all set — continue." : watched ? "Check all three boxes and sign to continue." : "Finish the video to continue."}
        </p>
      </form>
    </div>
  );
}
