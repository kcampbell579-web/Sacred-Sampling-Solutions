"use client";

// Demo-only data layer backed by localStorage so the mockup is fully clickable
// without a database. Swap these functions for Neon queries (server actions) to
// go live — the shapes below match the SQL schema in db/schema.sql.

const KEY = "hvmc.portal.v2";

const DEMO_PATIENT = {
  name: "Jordan Alvarez",
  firstName: "Jordan",
  dob: "1988-04-12",
  mrn: "HV-04821",
  email: "jordan.alvarez@example.com",
  phone: "(631) 555-0142",
  address: "22 Birch Hollow Ln, Coram, NY 11727",
  insurance: "Empire BlueCross — PPO",
  memberId: "EBX9930041",
  pharmacy: "CVS Pharmacy — 401 Middle Country Rd, Coram",
};

// Seed a couple of appointments relative to "today" so the demo always looks alive.
function seedAppointments() {
  const now = new Date();
  const plus = (d) => {
    const x = new Date(now);
    x.setDate(x.getDate() + d);
    return x.toISOString().slice(0, 10);
  };
  const minus = (d) => plus(-d);
  return [
    {
      id: "apt-1001",
      providerId: "dr-butt",
      visitTypeId: "wellness",
      date: plus(6),
      time: "10:00 AM",
      reason: "Annual physical and lab review.",
      status: "upcoming",
    },
    {
      id: "apt-1002",
      providerId: "np-rivera",
      visitTypeId: "immunization",
      date: plus(13),
      time: "2:30 PM",
      reason: "Flu shot.",
      status: "upcoming",
    },
    {
      id: "apt-0990",
      providerId: "pa-osei",
      visitTypeId: "chronic",
      date: minus(24),
      time: "1:30 PM",
      reason: "Blood pressure follow-up.",
      status: "completed",
    },
    {
      id: "apt-0975",
      providerId: "dr-butt",
      visitTypeId: "sick",
      date: minus(61),
      time: "11:00 AM",
      reason: "Sinus infection.",
      status: "completed",
    },
  ];
}

const DEMO_RESULTS = [
  { id: "r1", name: "Comprehensive Metabolic Panel", date: "2026-06-27", status: "Reviewed", flag: "normal" },
  { id: "r2", name: "Lipid Panel", date: "2026-06-27", status: "Reviewed", flag: "attention" },
  { id: "r3", name: "Complete Blood Count (CBC)", date: "2026-06-27", status: "Reviewed", flag: "normal" },
  { id: "r4", name: "Hemoglobin A1C", date: "2026-03-14", status: "Reviewed", flag: "normal" },
];

function fresh() {
  return {
    patient: DEMO_PATIENT,
    appointments: seedAppointments(),
    results: DEMO_RESULTS,
  };
}

function read() {
  if (typeof window === "undefined") return fresh();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const seeded = fresh();
      window.localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch {
    return fresh();
  }
}

function write(state) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("hvmc-store-change"));
}

export function getPatient() {
  return read().patient;
}

export function getAppointments() {
  return read().appointments || [];
}

export function getResults() {
  return read().results || [];
}

export function upcoming() {
  return getAppointments()
    .filter((a) => a.status === "upcoming")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export function past() {
  return getAppointments()
    .filter((a) => a.status !== "upcoming")
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

export function bookAppointment({ providerId, visitTypeId, date, time, reason }) {
  const state = read();
  const appt = {
    id: "apt-" + Math.floor(performance.now() * 1000).toString(36),
    providerId,
    visitTypeId,
    date,
    time,
    reason: reason || "",
    status: "upcoming",
  };
  state.appointments = [...state.appointments, appt];
  write(state);
  return appt;
}

export function cancelAppointment(id) {
  const state = read();
  state.appointments = state.appointments.map((a) =>
    a.id === id ? { ...a, status: "cancelled" } : a
  );
  write(state);
}

// Which slots are taken for a given provider + date (demo collision check).
export function bookedSlots(providerId, date) {
  return getAppointments()
    .filter((a) => a.providerId === providerId && a.date === date && a.status === "upcoming")
    .map((a) => a.time);
}

// --- fake session ---
const SESSION = "hvmc.session";
export function isSignedIn() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SESSION) === "1";
}
export function signIn() {
  if (typeof window !== "undefined") window.localStorage.setItem(SESSION, "1");
}
export function signOut() {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION);
}
