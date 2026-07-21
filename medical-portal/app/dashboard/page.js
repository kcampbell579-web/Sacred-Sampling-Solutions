"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import AppointmentRow from "@/components/AppointmentRow";
import { PROVIDERS } from "@/lib/clinic";
import { getPatient, upcoming, past, getResults } from "@/lib/store";

const QUICK = [
  { href: "/schedule", ic: "📅", t: "Book a visit", d: "Find an open time" },
  { href: "/appointments", ic: "🗂️", t: "My appointments", d: "Upcoming & past" },
  { href: "/records", ic: "🧪", t: "Lab results", d: "View recent labs" },
  { href: "/profile", ic: "⚙️", t: "My profile", d: "Insurance & info" },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = () =>
      setData({
        patient: getPatient(),
        up: upcoming(),
        results: getResults(),
        pastCount: past().length,
      });
    load();
    window.addEventListener("hvmc-store-change", load);
    return () => window.removeEventListener("hvmc-store-change", load);
  }, []);

  return (
    <Shell>
      {!data ? null : (
        <>
          <section className="hero">
            <div className="eyebrow" style={{ color: "rgba(255,255,255,.8)" }}>
              Highland Valley Medical Care
            </div>
            <h1>Good to see you, {data.patient.firstName}.</h1>
            <p>Here's a snapshot of your care. Need to be seen? Booking takes a minute.</p>
            <div style={{ marginTop: 18 }}>
              <Link href="/schedule" className="btn btn-primary">
                + Book an appointment
              </Link>
            </div>
            <div className="statrow">
              <div className="stat">
                <div className="v">{data.up.length}</div>
                <div className="l">Upcoming visits</div>
              </div>
              <div className="stat">
                <div className="v">{data.results.length}</div>
                <div className="l">Lab results</div>
              </div>
              <div className="stat">
                <div className="v">{data.pastCount}</div>
                <div className="l">Past visits</div>
              </div>
            </div>
          </section>

          <div style={{ height: 18 }} />

          <div className="qa">
            {QUICK.map((q) => (
              <Link key={q.href} href={q.href}>
                <span className="ic">{q.ic}</span>
                <span className="t">{q.t}</span>
                <span className="d">{q.d}</span>
              </Link>
            ))}
          </div>

          <div style={{ height: 18 }} />

          <div className="grid grid-2">
            <div className="card">
              <div className="card-head">
                <h2>Upcoming appointments</h2>
                <Link href="/appointments" className="linkbtn">
                  View all
                </Link>
              </div>
              {data.up.length === 0 ? (
                <div className="emptystate">
                  <div className="ic">📅</div>
                  <p>No upcoming visits.</p>
                  <p style={{ marginTop: 10 }}>
                    <Link href="/schedule" className="btn btn-soft btn-sm">
                      Book one now
                    </Link>
                  </p>
                </div>
              ) : (
                data.up.slice(0, 3).map((a) => <AppointmentRow key={a.id} appt={a} />)
              )}
            </div>

            <div className="card">
              <div className="card-head">
                <h2>Your care team</h2>
              </div>
              <div className="team">
                {PROVIDERS.map((p) => (
                  <div key={p.id} className="member">
                    <div className="avatar">{p.initials}</div>
                    <div className="grow">
                      <div className="nm">{p.name}</div>
                      <div className="rl">{p.specialty}</div>
                    </div>
                    <Link href={`/schedule?provider=${p.id}`} className="btn btn-ghost btn-sm">
                      Book
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}
