"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import AppointmentRow from "@/components/AppointmentRow";
import { upcoming, past, cancelAppointment } from "@/lib/store";

export default function AppointmentsPage() {
  const [state, setState] = useState({ up: [], pastList: [] });

  useEffect(() => {
    const load = () => setState({ up: upcoming(), pastList: past() });
    load();
    window.addEventListener("hvmc-store-change", load);
    return () => window.removeEventListener("hvmc-store-change", load);
  }, []);

  function handleCancel(appt) {
    if (window.confirm("Cancel this appointment? This can't be undone in the demo.")) {
      cancelAppointment(appt.id);
    }
  }

  return (
    <Shell>
      <div className="page-head">
        <div>
          <div className="eyebrow">Your visits</div>
          <h1>Appointments</h1>
        </div>
        <Link href="/schedule" className="btn btn-primary">
          + Book new
        </Link>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Upcoming</h2>
          <span className="pill pill-brand">{state.up.length}</span>
        </div>
        {state.up.length === 0 ? (
          <div className="emptystate">
            <div className="ic">📅</div>
            <p>Nothing scheduled.</p>
          </div>
        ) : (
          state.up.map((a) => (
            <AppointmentRow key={a.id} appt={a} onCancel={handleCancel} />
          ))
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Past & cancelled</h2>
        </div>
        {state.pastList.length === 0 ? (
          <div className="emptystate">
            <div className="ic">🗂️</div>
            <p>No visit history yet.</p>
          </div>
        ) : (
          state.pastList.map((a) => <AppointmentRow key={a.id} appt={a} />)
        )}
      </div>
    </Shell>
  );
}
