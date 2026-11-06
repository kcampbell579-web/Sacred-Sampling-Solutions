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
  // Air badges (passive diffusive monitors). Code NO2 → Sample IDs look like
  // SS-NO2-00001 (the parser accepts the digit in this code).
  NO2: { code: "NO2", title: "NO₂ Monitor", slug: "no2-air", matrix: "air", panels: ["no2"] },
};

// Alternate codes that may be printed on a label but map to a known kit.
// NDX is the legacy NO₂ code, kept so any SS-NDX-##### labels still resolve.
const CODE_ALIASES = { PFAS: "PFA", PRF: "PRO", HM: "BAS", COMP: "COM", NDX: "NO2" };

// Every code we recognize (kit codes + aliases), longest first so a 4-char code
// is matched before a shorter one when separators are stripped. Matching against
// the known set — rather than a generic [A-Z]{3,4} — lets a code contain a digit
// (e.g. NO2) without the digits of the serial number being mis-read as the code.
const KNOWN_CODES = [...Object.keys(KIT_TYPES), ...Object.keys(CODE_ALIASES)]
  .sort((a, b) => b.length - a.length);

// Normalize loose input toward the canonical SS-CODE-##### shape.
// Tolerant of missing/extra hyphens, spaces, lowercase, and a missing S-prefix,
// while PRESERVING whether the label used SS- or SSS- so the stored ID matches
// exactly what's printed (and used on the chain-of-custody / results).
export function normalizeSampleId(raw) {
  const cleaned = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  // [optional S-prefix][known code][1–7 digit serial]
  for (const code of KNOWN_CODES) {
    const m = cleaned.match(new RegExp(`^(S{0,3})${code}(\\d{1,7})$`));
    if (m) {
      const pre = m[1].length >= 2 ? m[1] : "SS"; // labels print SS-; repair 0–1 S's to SS
      return `${pre}-${code}-${m[2]}`;
    }
  }
  // Fall back to a generic letters-only code for anything not in the known set.
  const g = cleaned.match(/^(S{0,3})([A-Z]{3,4})(\d{1,7})$/);
  if (g) {
    const pre = g[1].length >= 2 ? g[1] : "SS";
    return `${pre}-${g[2]}-${g[3]}`;
  }
  // Couldn't confidently parse — hand back a trimmed version.
  return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
}

// Returns { sampleId, code, kit } or null if it doesn't match / isn't a known code.
export function parseSampleId(raw) {
  const v = normalizeSampleId(raw);
  const m = v.match(/^S{2,3}-([A-Z0-9]{2,5})-(\d{1,7})$/);
  if (!m) return null;
  const code = CODE_ALIASES[m[1]] || m[1];
  const kit = KIT_TYPES[code] || null;
  if (!kit) return null;
  return { sampleId: v, code, kit }; // sampleId keeps the printed code (e.g. SS-NDX-…)
}

export function kitByCode(code) {
  return KIT_TYPES[String(code || "").toUpperCase()] || null;
}

export function kitBySlug(slug) {
  return Object.values(KIT_TYPES).find((k) => k.slug === slug) || null;
}

export const ALL_KITS = Object.values(KIT_TYPES);
