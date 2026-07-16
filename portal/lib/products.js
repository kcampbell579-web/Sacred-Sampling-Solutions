// Display metadata for each kit product. Keyed by the `product` column in `kits`.
export const PRODUCTS = {
  heavymetals:   { name: "Heavy Metals Kit",     tests: "13 heavy metals — lead, arsenic, copper, mercury +", price: "$249" },
  minerals:      { name: "Metals & Minerals Kit", tests: "13 heavy metals · chloride · fluoride",              price: "$329" },
  essentials:    { name: "Essentials Kit",        tests: "bacteria, E. coli, nitrates, pH, hardness",           price: "$199" },
  comprehensive: { name: "Comprehensive Kit",     tests: "VOCs · 13 metals · chloride · fluoride",              price: "$499" },
  pfas:          { name: "PFAS Kit",              tests: "25-compound PFAS panel (EPA 533)",                    price: "$499" },
  professional:  { name: "Professional Kit",      tests: "every analyte — bacteria to PFAS",                    price: "$1,195" },
};

export function productOf(key) {
  return PRODUCTS[key] || { name: "Test Kit", tests: "", price: "" };
}

// Ordered status pipeline shown in the timeline.
export const STATUS_STEPS = [
  { key: "activated",  label: "Registered",     hint: "Kit linked to your account" },
  { key: "received",   label: "Received at lab", hint: "Your sample arrived" },
  { key: "analyzing",  label: "In analysis",     hint: "The lab is running your panel" },
  { key: "ready",      label: "Report ready",    hint: "Your results are available" },
];

export function statusIndex(status) {
  const i = STATUS_STEPS.findIndex((s) => s.key === status);
  return i; // -1 when 'inactive'
}
