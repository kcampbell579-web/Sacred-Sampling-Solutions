"use client";

import { useState } from "react";
import { saveAcknowledgment } from "@/app/actions/training";

// Figure out how to embed a video URL: a hosted YouTube/Vimeo link (iframe) or
// a direct file (/videos/x.mp4, .webm, or any other URL we play with <video>).
function videoKind(url) {
  const u = String(url || "").trim();
  if (!u) return { type: "none" };
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return { type: "embed", src: `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1` };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { type: "embed", src: `https://player.vimeo.com/video/${m[1]}` };
  return { type: "file", src: u };
}

export default function TrainingGate({ slug, sampleId, videoUrl, kitTitle }) {
  const vid = videoKind(videoUrl);
  // If there's no video for this kit yet, don't block on it.
  const [watched, setWatched] = useState(vid.type === "none");
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

      {vid.type === "file" && (
        <video
          className="trainvid"
          controls
          playsInline
          preload="metadata"
          onEnded={() => setWatched(true)}
          src={vid.src}
        />
      )}
      {vid.type === "embed" && (
        <>
          <div className="trainvid-embed">
            <iframe
              src={vid.src}
              title={`${kitTitle} training video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {!watched && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setWatched(true)}>
              ✓ I&rsquo;ve watched the full video
            </button>
          )}
        </>
      )}
      {vid.type === "none" && (
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
