"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { getResults } from "@/lib/store";
import { fmtDob } from "@/lib/format";

function flagPill(flag) {
  if (flag === "attention") return <span className="pill pill-warn">Review</span>;
  return <span className="pill pill-good">Normal</span>;
}

export default function RecordsPage() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    setResults(getResults());
  }, []);

  return (
    <Shell>
      <div className="page-head">
        <div>
          <div className="eyebrow">Health records</div>
          <h1>Lab results</h1>
        </div>
      </div>

      <div className="banner">
        <span>ℹ️</span>
        <span>
          Results are for your reference. Your care team reviews every result — message us or book a
          follow-up with any questions.
        </span>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Recent results</h2>
        </div>
        <div className="datalist">
          {results.map((r) => (
            <div key={r.id} className="row">
              <div className="avatar sm brandbg">🧪</div>
              <div className="grow">
                <h3>{r.name}</h3>
                <div className="sub">
                  Collected {fmtDob(r.date)} · {r.status}
                </div>
              </div>
              {flagPill(r.flag)}
              <button className="btn btn-ghost btn-sm">View</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Documents</h2>
        </div>
        <div className="emptystate">
          <div className="ic">📄</div>
          <p>Visit summaries and after-visit notes will appear here.</p>
        </div>
      </div>
    </Shell>
  );
}
