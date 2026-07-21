"use client";

import { providerById, visitTypeById } from "@/lib/clinic";
import { fmtParts } from "@/lib/format";

export default function AppointmentRow({ appt, onCancel }) {
  const provider = providerById(appt.providerId);
  const visit = visitTypeById(appt.visitTypeId);
  const { mo, day, wd } = fmtParts(appt.date);
  const cancelled = appt.status === "cancelled";
  const completed = appt.status === "completed";

  return (
    <div className="appt" style={cancelled ? { opacity: 0.55 } : undefined}>
      <div className="when">
        <div className="mo">{mo}</div>
        <div className="day">{day}</div>
        <div className="wd">{wd}</div>
      </div>
      <div className="info">
        <h3>{visit?.name || "Visit"}</h3>
        <div className="meta">
          <span>🕒 {appt.time}</span>
          <span>👤 {provider?.name}</span>
          {appt.reason ? <span>📝 {appt.reason}</span> : null}
        </div>
      </div>
      <div className="actions">
        {appt.status === "upcoming" && (
          <>
            <span className="pill pill-brand">Upcoming</span>
            {onCancel && (
              <button className="btn btn-sm btn-danger" onClick={() => onCancel(appt)}>
                Cancel
              </button>
            )}
          </>
        )}
        {completed && <span className="pill pill-muted">Completed</span>}
        {cancelled && <span className="pill pill-warn">Cancelled</span>}
      </div>
    </div>
  );
}
