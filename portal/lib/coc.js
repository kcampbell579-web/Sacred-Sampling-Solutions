// Chain-of-custody helpers, modeled on the LIAL "Chain of Custody / Request
// for Analysis" form the lab uses (master spec §8).

// The receiving laboratory (fixed on every COC).
export const LAB = {
  name: "LONG ISLAND ANALYTICAL LABORATORIES, INC.",
  web: "www.lialinc.com",
  line: "110 Colin Drive • Holbrook, New York 11741 • Phone (631) 472-3400 • Fax (631) 472-8505 • Email: LIAL@lialinc.com",
  accreditations: "NYSDOH ELAP# 11693   USEPA# NY01273   CTDOH# PH-0284   NJDEP# NY012   PADEP# 68-2943",
};

// The client block (fixed).
export const CLIENT = {
  name: "SACRED SAMPLING SOLUTIONS",
  contact: "Kelly Campbell",
  phone: "631-875-2958",
  reportsEmail: "laboratory@sacredsamplingsolutions.com",
  invoiceEmail: "info@sacredsamplingsolutions.com",
};

// Who relinquishes the sample to the lab (the company rep, not the homeowner).
export const RELINQUISHER = "Kelly McClure";

// The four named analysis columns on the LIAL form.
export const ANALYSIS_COLUMNS = [
  { label: "13 Heavy Metals", key: "metals" },
  { label: "Nitrate", key: "nitrate" },
  { label: "VOCs", key: "vocs" },
  { label: "40 PFCs (PFAS/PFOA)", key: "pfas" },
];

// Which analysis columns each kit ticks (by kit code), matching the real COCs.
export const COC_CHECKS = {
  BAS: ["metals"],
  BEN: ["metals", "nitrate"],
  ESS: ["nitrate"], // remaining Essentials analytes flagged as "EST" in the comment
  COM: ["metals", "vocs"], // chloride & fluoride noted in the comment (no LIAL column)
  PFA: ["pfas"],
  PRO: ["metals", "nitrate", "vocs", "pfas"],
};

// Analysis description printed in the comments line (by kit code).
export const ANALYSIS_TEXT = {
  BAS: "Metals EPA 200.8",
  BEN: "Metals EPA 200.8 + Nitrate EPA 353.2",
  ESS: "EST — Total Coliform, E. coli, Nitrate, pH, Hardness",
  COM: "Metals EPA 200.8 + VOCs EPA 524.2 + Chloride & Fluoride EPA 300.0",
  PFA: "PFAS (40 PFCs, EPA 537.1)",
  PRO: "Metals 200.8 + VOCs 524.2 + PFAS 537.1 + Nitrate 353.2 + Bacteria",
};

// Boolean[] over ANALYSIS_COLUMNS for a kit code.
export function checkedColumnsForCode(code) {
  const checks = COC_CHECKS[String(code || "").toUpperCase()] || [];
  return ANALYSIS_COLUMNS.map((c) => checks.includes(c.key));
}

// The comment / instructions line, matching the real COC format.
export function cocComment(sampleId, code, kitPanel, faucet) {
  const analysis = ANALYSIS_TEXT[String(code || "").toUpperCase()];
  let s = `Sacred Sampling kit ${sampleId} - ${kitPanel || "Water"}`;
  if (analysis) s += ` (${analysis})`;
  s += ". Shipped same day on ice.";
  if (faucet) s += ` Collected at ${faucet}.`;
  return s;
}

// The public, lab-scannable COC link (marketing domain redirects to the portal).
export function cocPublicUrl(sampleId) {
  return `https://www.sacredsamplingsolutions.com/chain-of-custody?id=${encodeURIComponent(sampleId)}`;
}

// Split a stored timestamp into {date, time} for the form cells.
export function splitCollected(v) {
  if (!v) return { date: "—", time: "" };
  // Neon returns timestamptz as a Date (or a string); coerce and format in UTC
  // so it round-trips to what the customer entered.
  const d = new Date(v);
  if (!isNaN(d.getTime())) {
    const p = (n) => String(n).padStart(2, "0");
    return {
      date: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`,
      time: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`,
    };
  }
  const s = String(v).replace("T", " ");
  return { date: s.slice(0, 10), time: s.slice(11, 16) };
}
