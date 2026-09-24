import { getUser } from "@/lib/auth";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

const LOGO = "https://www.sacredsamplingsolutions.com/assets/logo-color.png";

// General water-kit collection protocol. Kit-specific steps still live on each
// kit's training page; this is the always-available master reference.
const STEPS = [
  ["Freeze your ice pack first", "Put the gel/ice pack in the freezer until solid — at least 6 hours ahead (overnight is best). Your sample has to stay cold all the way to the lab."],
  ["Lay everything out", "Open your kit and check the contents against the “What’s inside” list. If anything is missing or damaged, stop and contact support before you collect."],
  ["Put on the nitrile gloves", "Powder-free gloves keep skin oils and contaminants off the bottle and the sample. Put them on before you handle the bottle."],
  ["Pick a cold, unfiltered tap", "Use a cold kitchen or bathroom tap. Remove any aerator, filter, or softener attachment first — and don’t sample from an outdoor spigot or garden hose."],
  ["Flush the line for 2–3 minutes", "Run the cold water for 2–3 minutes to clear water that’s been sitting in the pipes, then turn it down to a gentle, pencil-thin stream."],
  ["Do NOT rinse the bottle", "The HDPE bottle is pre-cleaned and acid-preserved to hold metals in solution. Do not rinse it or pour anything out — fill it exactly as it comes."],
  ["Fill to the shoulder, then cap", "Fill to within 1–2 inches of the top without letting the faucet touch the bottle, then cap it tightly."],
  ["Chill it right away", "Set the capped bottle against the frozen pack inside the thermal wrap so it starts cooling immediately."],
  ["Fill out and seal the label", "Complete the sample label (see the walkthrough below), then apply the label integrity seal across the cap so the lab can confirm it arrived sealed."],
  ["Register & ship the same day", "Scan the QR code on your card to finish your chain of custody, then drop the prepaid mailer with the carrier the same day you collect."],
];

const LABEL_EXAMPLE = [
  ["Date", "09 / 24 / 2026", "The date you actually collected the sample — not the day it shipped."],
  ["Time", "8:15 AM", "The time you filled the bottle. This lets the lab confirm the sample was analyzed within its hold time."],
  ["Sample ID", "SS-BAS-91001", "The code from your kit / registration. If it’s already printed on the label, just confirm it matches your registration."],
  ["Matrix", "Drinking Water", "What you sampled — e.g. Drinking Water, Well Water, or Air."],
  ["Analysis", "Heavy Metals", "The test your kit runs (e.g. Heavy Metals, PFAS, Comprehensive). It usually matches your kit’s name."],
  ["Signature", "Kelly M.", "Sign to certify you collected the sample following these instructions. This is part of your chain of custody."],
];

export default async function InstructionsPage() {
  const user = await getUser();
  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="wrap">
          <a className="backlink" href={user ? "/dashboard" : "/"}>← Back</a>

          <div className="hero-note">
            <span className="eyebrow" style={{ color: "#9fd0ff" }}>Reference · always available</span>
            <h1 style={{ marginTop: 8 }}>Sample collection instructions</h1>
            <p>Everything you need to collect a clean, valid sample and fill out your label correctly. For the exact steps for your specific kit, open its training page from your dashboard.</p>
          </div>

          <div className="freeze-note">
            <span className="freeze-ic">❄️</span>
            <div>
              <b>Freeze your ice pack first.</b> Put it in the freezer until solid — <b>at least 6 hours ahead</b> (overnight is best). Your sample has to stay cold all the way to the lab.
            </div>
          </div>

          <div className="card">
            <span className="eyebrow">Step by step</span>
            <h2 className="mt" style={{ marginBottom: 16 }}>How to collect your sample</h2>
            <div className="tsteps">
              {STEPS.map(([t, d], i) => (
                <div className="tstep-row" key={i}>
                  <div className="tstep-n">{i + 1}</div>
                  <div>
                    <div className="tstep-t">{t}</div>
                    <div className="tstep-d">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <span className="eyebrow">Chain of custody</span>
            <h2 className="mt" style={{ marginBottom: 4 }}>How to fill out your sample label</h2>
            <p className="muted" style={{ marginBottom: 18 }}>Fill in every line in ballpoint pen. Here’s a completed example — the blue text shows what goes on each line.</p>

            {/* Example label */}
            <div className="lbl">
              <div className="lbl-head">
                <img src={LOGO} alt="" className="lbl-logo" />
                <div>
                  <div className="lbl-title">SAMPLE LABEL</div>
                  <div className="lbl-sub">SACRED SAMPLING SOLUTIONS</div>
                </div>
              </div>
              <div className="lbl-body">
                <div className="lbl-row"><span className="lbl-k">Date:</span><span className="lbl-v">09 / 24 / 2026</span><span className="lbl-k" style={{ marginLeft: 18 }}>Time:</span><span className="lbl-v">8:15 AM</span></div>
                <div className="lbl-row"><span className="lbl-k">Sample ID:</span><span className="lbl-v">SS-BAS-91001</span></div>
                <div className="lbl-row"><span className="lbl-k">Matrix:</span><span className="lbl-v">Drinking Water</span></div>
                <div className="lbl-row"><span className="lbl-k">Analysis:</span><span className="lbl-v">Heavy Metals</span></div>
                <div className="lbl-row"><span className="lbl-k">Signature:</span><span className="lbl-v lbl-sign">Kelly M.</span></div>
              </div>
            </div>

            <div className="lbl-guide">
              {LABEL_EXAMPLE.map(([k, ex, d]) => (
                <div className="lbl-g" key={k}>
                  <div className="lbl-g-top"><b>{k}</b><span className="lbl-g-ex">{ex}</span></div>
                  <div className="lbl-g-d">{d}</div>
                </div>
              ))}
            </div>

            <div className="alert" style={{ marginTop: 16 }}>
              <b>Then seal it.</b> Once the label is filled in, apply the <b>label integrity seal</b> across the cap. The lab checks that the seal is intact — it’s what keeps your chain of custody defensible.
            </div>
          </div>

          <div className="card">
            <span className="eyebrow">Last step</span>
            <h2 className="mt" style={{ marginBottom: 10 }}>Register &amp; ship</h2>
            <p className="muted" style={{ marginTop: 0 }}>Scan the QR code on your instruction card to complete your chain of custody, then drop the prepaid mailer the <b>same day</b> you collect so the sample stays cold and within its hold time.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
              {user && <a className="btn btn-primary" href="/dashboard">Go to my dashboard →</a>}
              <a className="btn btn-ghost" href="https://www.sacredsamplingsolutions.com/contact">Contact support</a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
