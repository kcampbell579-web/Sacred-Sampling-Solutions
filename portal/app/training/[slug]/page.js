import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import TrainingGate from "./TrainingGate";

export const dynamic = "force-dynamic";

// "Title | description" newline lines -> [{title, desc}]
function parseLines(text) {
  return String(text || "")
    .split("\n")
    .map((l) => {
      const i = l.indexOf("|");
      if (i === -1) return { title: l.trim(), desc: "" };
      return { title: l.slice(0, i).trim(), desc: l.slice(i + 1).trim() };
    })
    .filter((x) => x.title);
}

export default async function TrainingPage({ params, searchParams }) {
  const user = await requireUser();
  const slug = decodeURIComponent(params.slug);
  const id = (searchParams?.id || "").toString().trim().toUpperCase();

  const kitRows = await sql`
    select code, title, slug, intro, tests, methods, sensitivity, containers, whats_inside, steps, video_url
    from kit_types where slug=${slug}`;
  if (!kitRows.length) redirect("/dashboard");
  const kit = kitRows[0];

  // If a sample ID is supplied, it must belong to this member.
  let sampleId = "";
  if (id) {
    const s = await sql`select sample_id from sample_registrations where sample_id=${id} and user_id=${user.id}`;
    if (!s.length) redirect("/dashboard");
    sampleId = s[0].sample_id;
  }

  const inside = parseLines(kit.whats_inside);
  const steps = parseLines(kit.steps);
  const facts = [
    ["Tests", kit.tests],
    ["Methods", kit.methods],
    ["Sensitivity", kit.sensitivity],
    ["Containers", kit.containers],
  ].filter(([, v]) => v);

  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="wrap">
          <a className="backlink" href="/dashboard">← Back to dashboard</a>

          <div className="hero-note">
            <span className="eyebrow" style={{ color: "#9fd0ff" }}>Step 2 · Collection training</span>
            <h1 style={{ marginTop: 8 }}>{kit.title}</h1>
            {kit.intro && <p>{kit.intro}</p>}
            {facts.length > 0 && (
              <div className="facts">
                {facts.map(([k, v]) => (
                  <div className="f" key={k}><div className="fk">{k}</div><div className="fv">{v}</div></div>
                ))}
              </div>
            )}
          </div>

          {inside.length > 0 && (
            <div className="card">
              <span className="eyebrow">In your box</span>
              <h2 className="mt" style={{ marginBottom: 4 }}>What&rsquo;s inside</h2>
              <p className="muted" style={{ marginBottom: 16 }}>Lay everything out before you start. If anything is missing or damaged, stop and contact support.</p>
              <div className="boxgrid">
                {inside.map((it, i) => (
                  <div className="bx" key={i}>
                    <div className="bx-t">{it.title}</div>
                    {it.desc && <div className="bx-d">{it.desc}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {steps.length > 0 && (
            <div className="card">
              <span className="eyebrow">Step by step</span>
              <h2 className="mt" style={{ marginBottom: 16 }}>How to collect your sample</h2>
              <div className="tsteps">
                {steps.map((st, i) => (
                  <div className="tstep-row" key={i}>
                    <div className="tstep-n">{i + 1}</div>
                    <div>
                      <div className="tstep-t">{st.title}</div>
                      {st.desc && <div className="tstep-d">{st.desc}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TrainingGate slug={kit.slug} sampleId={sampleId} videoUrl={kit.video_url || ""} kitTitle={kit.title} />
        </div>
      </main>
    </>
  );
}
