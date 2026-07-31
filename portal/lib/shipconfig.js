// Return-shipping configuration for prepaid UPS return labels (via Shippo).
//
// LAB_ADDRESS is the DESTINATION — where customers mail their samples.
// Samples ship directly to the analyzing lab: Long Island Analytical
// Laboratories (LIAL), Holbrook NY. Not a secret; override any field with an
// env var in Vercel and redeploy.
export const LAB_ADDRESS = {
  name:    process.env.LAB_NAME    || "Long Island Analytical Laboratories — Sample Receiving",
  company: process.env.LAB_COMPANY || "Long Island Analytical Laboratories, Inc.",
  street1: process.env.LAB_STREET1 || "110 Colin Drive",
  street2: process.env.LAB_STREET2 || "",
  city:    process.env.LAB_CITY    || "Holbrook",
  state:   process.env.LAB_STATE   || "NY",
  zip:     process.env.LAB_ZIP     || "11741",
  country: "US",
  phone:   process.env.LAB_PHONE   || "631-472-3400",
  email:   process.env.LAB_EMAIL   || "LIAL@lialinc.com",
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
