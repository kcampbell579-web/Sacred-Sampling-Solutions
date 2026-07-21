"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { PROVIDERS, VISIT_TYPES, TIME_SLOTS, providerById, visitTypeById } from "@/lib/clinic";
import { bookAppointment, bookedSlots } from "@/lib/store";
import { fmtLong, fmtParts } from "@/lib/format";

const STEPS = ["Visit type", "Provider", "Date & time", "Confirm"];

// Next 14 days (clinic is open every day).
function upcomingDays() {
  const out = [];
  const base = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function SchedulePage() {
  const [step, setStep] = useState(0);
  const [visitTypeId, setVisitTypeId] = useState(null);
  const [providerId, setProviderId] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [reason, setReason] = useState("");
  const [booked, setBooked] = useState(null);

  const days = useMemo(() => upcomingDays(), []);

  // Pre-select provider from ?provider= (deep link from dashboard).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("provider");
    if (pid && providerById(pid)) {
      setProviderId(pid);
    }
  }, []);

  useEffect(() => {
    if (!date && days.length) setDate(days[0]);
  }, [days, date]);

  const takenSlots = useMemo(() => {
    if (!providerId || !date) return [];
    return bookedSlots(providerId, date);
  }, [providerId, date, step]);

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function confirm() {
    const appt = bookAppointment({ providerId, visitTypeId, date, time, reason });
    setBooked(appt);
  }

  const visit = visitTypeById(visitTypeId);
  const provider = providerById(providerId);

  if (booked) {
    const { mo, day, wd } = fmtParts(booked.date);
    return (
      <Shell>
        <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="success">
            <div className="check">✓</div>
            <h1>Appointment booked</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              A confirmation has been sent to your email. You can view or cancel it anytime.
            </p>
          </div>
          <div className="summary" style={{ marginTop: 8 }}>
            <div className="row">
              <span className="k">Visit</span>
              <span className="v">{visitTypeById(booked.visitTypeId)?.name}</span>
            </div>
            <div className="row">
              <span className="k">Provider</span>
              <span className="v">{providerById(booked.providerId)?.name}</span>
            </div>
            <div className="row">
              <span className="k">When</span>
              <span className="v">
                {wd}, {mo} {day} · {booked.time}
              </span>
            </div>
            <div className="row">
              <span className="k">Location</span>
              <span className="v">369 Middle Country Rd, Coram</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Link href="/appointments" className="btn btn-primary btn-block">
              View my appointments
            </Link>
            <Link href="/dashboard" className="btn btn-ghost btn-block">
              Back to dashboard
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const canContinue =
    (step === 0 && visitTypeId) ||
    (step === 1 && providerId) ||
    (step === 2 && date && time) ||
    step === 3;

  return (
    <Shell>
      <div className="page-head">
        <div>
          <div className="eyebrow">New appointment</div>
          <h1>Schedule a visit</h1>
        </div>
      </div>

      <div className="steps">
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: "contents" }}>
            <div className={`step ${i < step ? "done" : ""} ${i === step ? "cur" : ""}`}>
              <span className="n">{i < step ? "✓" : i + 1}</span>
              <span className="lbl">{label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="sep" />}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 0 && (
          <>
            <div className="card-head">
              <h2>What do you need to be seen for?</h2>
            </div>
            <div className="choice">
              {VISIT_TYPES.map((v) => (
                <button
                  key={v.id}
                  className={visitTypeId === v.id ? "sel" : ""}
                  onClick={() => setVisitTypeId(v.id)}
                >
                  <span style={{ fontSize: "1.6rem" }}>{v.icon}</span>
                  <span>
                    <span className="ct">{v.name}</span>
                    <br />
                    <span className="cd">
                      {v.desc} · {v.duration} min
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="card-head">
              <h2>Choose a provider</h2>
            </div>
            <div className="choice">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  className={providerId === p.id ? "sel" : ""}
                  onClick={() => setProviderId(p.id)}
                >
                  <span className="avatar">{p.initials}</span>
                  <span>
                    <span className="ct">{p.name}</span>
                    <br />
                    <span className="cd">
                      {p.title} · {p.specialty}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="card-head">
              <h2>Pick a date & time</h2>
              <span className="muted" style={{ fontSize: ".85rem" }}>
                with {provider?.name}
              </span>
            </div>
            <div className="daytabs">
              {days.map((iso) => {
                const { mo, day, wd } = fmtParts(iso);
                return (
                  <button
                    key={iso}
                    className={`daytab ${date === iso ? "sel" : ""}`}
                    onClick={() => {
                      setDate(iso);
                      setTime(null);
                    }}
                  >
                    <div className="wd">{wd}</div>
                    <div className="num">{day}</div>
                    <div className="mo">{mo}</div>
                  </button>
                );
              })}
            </div>
            <div className="slots">
              {TIME_SLOTS.map((t) => {
                const taken = takenSlots.includes(t);
                return (
                  <button
                    key={t}
                    className={`slot ${time === t ? "sel" : ""}`}
                    disabled={taken}
                    onClick={() => setTime(t)}
                    title={taken ? "Unavailable" : ""}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="card-head">
              <h2>Review & confirm</h2>
            </div>
            <div className="summary">
              <div className="row">
                <span className="k">Visit type</span>
                <span className="v">{visit?.name}</span>
              </div>
              <div className="row">
                <span className="k">Provider</span>
                <span className="v">{provider?.name}</span>
              </div>
              <div className="row">
                <span className="k">Date</span>
                <span className="v">{date ? fmtLong(date) : "—"}</span>
              </div>
              <div className="row">
                <span className="k">Time</span>
                <span className="v">{time}</span>
              </div>
            </div>
            <div className="field" style={{ marginTop: 18 }}>
              <label htmlFor="reason">Reason for visit (optional)</label>
              <textarea
                id="reason"
                placeholder="Briefly describe what you'd like to discuss…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {step > 0 && (
            <button className="btn btn-ghost" onClick={back}>
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={next} disabled={!canContinue}>
              Continue
            </button>
          ) : (
            <button className="btn btn-primary" onClick={confirm}>
              Confirm appointment
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}
