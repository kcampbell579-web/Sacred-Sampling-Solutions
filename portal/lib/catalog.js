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

// SSS-COM-00001 (2–3 S's, 3-letter code, up to 6 digits).
const SAMPLE_ID_RE = /^S{2,3}-([A-Z]{3})-\d{1,6}$/;

// Normalize loose input toward the canonical SSS-CODE-##### shape.
export function normalizeSampleId(raw) {
  let v = String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
  if (v && !v.startsWith("SSS-") && !v.startsWith("SS-")) {
    v = v.replace(/^S+-?/, "");
    v = "SSS-" + v.replace(/^-/, "");
  }
  return v;
}

// Returns { sampleId, code, kit } or null if it doesn't match / isn't a known code.
export function parseSampleId(raw) {
  const v = normalizeSampleId(raw);
  const m = v.match(SAMPLE_ID_RE);
  if (!m) return null;
  const code = m[1];
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
