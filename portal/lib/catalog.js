// Kit catalog metadata + Sample ID parsing.
// The full editable content (whats_inside, steps, video, etc.) lives in the
// kit_types DB table; this module holds the lightweight, code-level facts the
// app needs for ID parsing and routing without a DB round-trip.

export const KIT_TYPES = {
  BAS: { code: "BAS", title: "Baseline Water Kit",      slug: "baseline-water",      matrix: "water", panels: ["metals"] },
  BEN: { code: "BEN", title: "Benchmark Water Kit",     slug: "benchmark-water",     matrix: "water", panels: ["metals", "nitrite"] },
  ESS: { code: "ESS", title: "Essentials Water Kit",    slug: "essentials-water",    matrix: "water", panels: ["bacteria", "nitrate", "ph", "hardness"] },
  COM: { code: "COM", title: "Comprehensive Water Kit", slug: "comprehensive-water", matrix: "water", panels: ["metals", "vocs", "chloride", "fluoride"] },
  PFA: { code: "PFA", title: "PFAS Water Kit",          slug: "pfas-water",          matrix: "water", panels: ["pfas"] },
  PRO: { code: "PRO", title: "Complete Home Inspection Water Kit", slug: "professional", matrix: "water", panels: ["metals", "vocs", "pfas", "nitrate", "bacteria"] },
};

// SS-BAS-00001 / SSS-COM-00001 — 2–3 S's, a 3–4 letter kit code, up to 7 digits.
const SAMPLE_ID_RE = /^S{2,3}-([A-Z]{3,4})-\d{1,7}$/;

// Alternate codes that may be printed on a label but map to a known kit.
const CODE_ALIASES = { PFAS: "PFA", PRF: "PRO", HM: "BAS", COMP: "COM" };

// Normalize loose input toward the canonical SS-CODE-##### shape.
// Tolerant of missing/extra hyphens, spaces, lowercase, and a missing S-prefix,
// while PRESERVING whether the label used SS- or SSS- so the stored ID matches
// exactly what's printed (and used on the chain-of-custody / results).
export function normalizeSampleId(raw) {
  const cleaned = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  // [optional S-prefix][3–4 letter code][1–7 digits]
  const m = cleaned.match(/^(S{0,3})([A-Z]{3,4})(\d{1,7})$/);
  if (m) {
    const pre = m[1].length >= 2 ? m[1] : "SS"; // labels print SS-; repair 0–1 S's to SS
    return `${pre}-${m[2]}-${m[3]}`;
  }
  // Couldn't confidently parse — hand back a trimmed version and let the RE decide.
  return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
}

// Returns { sampleId, code, kit } or null if it doesn't match / isn't a known code.
export function parseSampleId(raw) {
  const v = normalizeSampleId(raw);
  const m = v.match(SAMPLE_ID_RE);
  if (!m) return null;
  const code = CODE_ALIASES[m[1]] || m[1];
  const kit = KIT_TYPES[code] || null;
  if (!kit) return null;
  return { sampleId: v, code, kit };
}

export function kitByCode(code) {
  return KIT_TYPES[String(code || "").toUpperCase()] || null;
}

export function kitBySlug(slug) {
  return Object.values(KIT_TYPES).find((k) => k.slug === slug) || null;
}

export const ALL_KITS = Object.values(KIT_TYPES);
