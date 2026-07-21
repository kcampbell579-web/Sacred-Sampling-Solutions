// Static clinic + demo reference data.
// In production this comes from Neon (Postgres). See README for the wiring path.

export const CLINIC = {
  name: "Highland Valley Medical Care",
  short: "Highland Valley",
  tagline: "Your neighborhood primary care clinic in Coram, NY",
  address: "369 Middle Country Rd, Coram, NY 11727",
  phone: "(934) 246-8316",
  email: "highlandvalley369@gmail.com",
  website: "www.highlandvalleyclinic.com",
  hours: "Mon–Sun, 9:30 AM – 5:30 PM",
};

export const PROVIDERS = [
  {
    id: "dr-butt",
    name: "Dr. Butt",
    title: "Primary Care Physician",
    specialty: "Family & Internal Medicine",
    initials: "DB",
  },
  {
    id: "np-rivera",
    name: "Maya Rivera, NP",
    title: "Nurse Practitioner",
    specialty: "Preventive & Women's Health",
    initials: "MR",
  },
  {
    id: "pa-osei",
    name: "Daniel Osei, PA-C",
    title: "Physician Assistant",
    specialty: "Chronic Disease & Physicals",
    initials: "DO",
  },
];

export const VISIT_TYPES = [
  { id: "wellness", name: "Wellness / Annual Physical", duration: 30, icon: "🩺", desc: "Preventive screening and yearly check-up." },
  { id: "sick", name: "Sick Visit", duration: 20, icon: "🤒", desc: "Cold, flu, infection, or a new concern." },
  { id: "chronic", name: "Chronic Care Follow-up", duration: 20, icon: "📋", desc: "Diabetes, blood pressure, cholesterol, etc." },
  { id: "dot", name: "DOT / Employment Physical", duration: 30, icon: "🚚", desc: "DOT, pre-employment, and sports physicals." },
  { id: "immunization", name: "Immunization / Vaccine", duration: 15, icon: "💉", desc: "Flu, travel, and routine vaccinations." },
  { id: "medspa", name: "Med Spa Consult", duration: 30, icon: "✨", desc: "Botox, IV therapy, and weight-loss counseling." },
];

export function providerById(id) {
  return PROVIDERS.find((p) => p.id === id) || null;
}
export function visitTypeById(id) {
  return VISIT_TYPES.find((v) => v.id === id) || null;
}

// Clinic hours -> bookable 30-min start times.
export const TIME_SLOTS = [
  "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM",
  "3:30 PM", "4:00 PM", "4:30 PM",
];
