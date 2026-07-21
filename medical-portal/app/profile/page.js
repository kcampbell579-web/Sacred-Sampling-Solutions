"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { CLINIC } from "@/lib/clinic";
import { getPatient } from "@/lib/store";
import { fmtDob } from "@/lib/format";

function Field({ label, value }) {
  return (
    <div className="summary">
      <div className="row">
        <span className="k">{label}</span>
        <span className="v">{value}</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    setPatient(getPatient());
  }, []);

  if (!patient) return <Shell>{null}</Shell>;

  return (
    <Shell>
      <div className="page-head">
        <div>
          <div className="eyebrow">Account</div>
          <h1>My profile</h1>
        </div>
        <button className="btn btn-ghost">Edit</button>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: "1.2rem" }}>
            {patient.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <h2>{patient.name}</h2>
            <div className="muted">MRN {patient.mrn}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h2>Personal</h2>
          </div>
          <Field label="Date of birth" value={fmtDob(patient.dob)} />
          <Field label="Email" value={patient.email} />
          <Field label="Phone" value={patient.phone} />
          <Field label="Address" value={patient.address} />
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Insurance & pharmacy</h2>
          </div>
          <Field label="Plan" value={patient.insurance} />
          <Field label="Member ID" value={patient.memberId} />
          <Field label="Preferred pharmacy" value={patient.pharmacy} />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Your clinic</h2>
        </div>
        <Field label="Location" value={CLINIC.address} />
        <Field label="Phone" value={CLINIC.phone} />
        <Field label="Hours" value={CLINIC.hours} />
      </div>
    </Shell>
  );
}
