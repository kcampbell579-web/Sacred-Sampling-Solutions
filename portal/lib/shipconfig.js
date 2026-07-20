// Return-shipping configuration for prepaid UPS return labels (via Shippo).
//
// LAB_ADDRESS is the DESTINATION — where customers mail their samples. This is
// NOT a secret; edit it here (or override any field with an env var in Vercel)
// and redeploy. IMPORTANT: replace the placeholder below with the real lab /
// sample-intake address before generating live labels.
export const LAB_ADDRESS = {
  name:    process.env.LAB_NAME    || "Sacred Sampling Solutions — Sample Intake",
  company: process.env.LAB_COMPANY || "Sacred Sampling Solutions LLC",
  street1: process.env.LAB_STREET1 || "44 Drake Ave",
  street2: process.env.LAB_STREET2 || "",
  city:    process.env.LAB_CITY    || "Bellport",
  state:   process.env.LAB_STATE   || "NY",
  zip:     process.env.LAB_ZIP     || "11713",
  country: "US",
  phone:   process.env.LAB_PHONE   || "",
  email:   process.env.LAB_EMAIL   || "support@sacredsamplingsolutions.com",
};

// Default return parcel — a small water-kit box. Shippo needs dimensions + weight.
// Tune these to your actual return mailer; override with env vars if you prefer.
export const PARCEL = {
  length: process.env.RETURN_BOX_L || "9",
  width:  process.env.RETURN_BOX_W || "6",
  height: process.env.RETURN_BOX_H || "3",
  distance_unit: "in",
  weight: process.env.RETURN_BOX_OZ || "48", // ~3 lb, safe for bottles + packaging
  mass_unit: "oz",
};

// Carriers to consider when picking the cheapest rate. Requires the matching
// carrier account to be connected in your Shippo dashboard.
export const CARRIERS = ["UPS"];
