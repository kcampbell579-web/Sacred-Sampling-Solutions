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
  address: "44 Drake Ave, Bellport NY",
  contact: "Kelly Campbell",
  phone: "631-875-2958",
  reportsEmail: "laboratory@sacredsamplingsolutions.com",
  invoiceEmail: "laboratory@sacredsamplingsolutions.com",
};

// The four named analysis columns on the LIAL form + which portal panels tick each.
export const ANALYSIS_COLUMNS = [
  { label: "13 Heavy Metals", panels: ["metals"] },
  { label: "Nitrate", panels: ["nitrate", "nitrite"] },
  { label: "VOCs", panels: ["vocs"] },
  { label: "40 PFCs (PFAS/PFOA)", panels: ["pfas"] },
];

// Panels that don't have a dedicated LIAL column — surfaced in the comments line.
export const EXTRA_PANEL_NAMES = {
  bacteria: "Total Coliform / E. coli",
  ph: "pH",
  hardness: "Hardness",
};

export function panelSet(panelsCsv) {
  return new Set(String(panelsCsv || "").split(",").map((s) => s.trim()).filter(Boolean));
}

// Which of the 4 columns are checked for a kit's panels.
export function checkedColumns(panelsCsv) {
  const set = panelSet(panelsCsv);
  return ANALYSIS_COLUMNS.map((c) => c.panels.some((p) => set.has(p)));
}

// Human list of any analyses not covered by the 4 columns (for the comments line).
export function extraAnalyses(panelsCsv) {
  const set = panelSet(panelsCsv);
  return Object.entries(EXTRA_PANEL_NAMES).filter(([k]) => set.has(k)).map(([, v]) => v);
}

// The public, lab-scannable COC link (marketing domain redirects to the portal).
export function cocPublicUrl(sampleId) {
  return `https://www.sacredsamplingsolutions.com/chain-of-custody?id=${encodeURIComponent(sampleId)}`;
}

// Split a stored timestamp into {date, time} for the form cells.
export function splitCollected(v) {
  if (!v) return { date: "—", time: "" };
  const s = String(v).replace("T", " ");
  return { date: s.slice(0, 10), time: s.slice(11, 16) };
}
