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

// Ship-FROM for OUTBOUND labels (warehouse -> customer), bought from the
// fulfillment dashboard. Defaults to the Sacred Sampling address; override any
// field with an env var in Vercel and redeploy.
export const SHIP_FROM = {
  name:    process.env.SHIP_FROM_NAME    || "Sacred Sampling Solutions",
  street1: process.env.SHIP_FROM_STREET1 || "44 Drake Ave",
  street2: process.env.SHIP_FROM_STREET2 || "",
  city:    process.env.SHIP_FROM_CITY    || "Bellport",
  state:   process.env.SHIP_FROM_STATE   || "NY",
  zip:     process.env.SHIP_FROM_ZIP     || "11713",
  country: "US",
  phone:   process.env.SHIP_FROM_PHONE   || "631-875-2958",
  email:   process.env.SHIP_FROM_EMAIL   || "info@sacredsamplingsolutions.com",
};

// Default outbound kit box. Override with env vars to match your real mailer.
export const OUTBOUND_PARCEL = {
  length: process.env.SHIP_BOX_L || "10",
  width:  process.env.SHIP_BOX_W || "8",
  height: process.env.SHIP_BOX_H || "4",
  distance_unit: "in",
  weight: process.env.SHIP_BOX_OZ || "32", // ~2 lb kit + packaging
  mass_unit: "oz",
};

// Air badges (passive monitors) are analyzed by AT Labs / Assay Technology,
// not LIAL — a different destination. The lab moved from Boardman to this
// Youngstown address in 2026. Override any field with an env var in Vercel.
export const AT_LABS_ADDRESS = {
  name:    process.env.ATLABS_NAME    || "AT Labs — Sample Receiving",
  company: process.env.ATLABS_COMPANY || "AT Labs (Assay Technology)",
  street1: process.env.ATLABS_STREET1 || "8540 Crossroads Dr",
  street2: process.env.ATLABS_STREET2 || "",
  city:    process.env.ATLABS_CITY    || "Youngstown",
  state:   process.env.ATLABS_STATE   || "OH",
  zip:     process.env.ATLABS_ZIP     || "44514",
  country: "US",
  phone:   process.env.ATLABS_PHONE   || "800-833-1258",
  email:   process.env.ATLABS_EMAIL   || "custservice@assaytech.com",
};

// A passive badge is tiny and light — a padded envelope, not a bottle box.
// Right-sizing the parcel keeps the UPS rate correct.
export const AIR_PARCEL = {
  length: process.env.BADGE_BOX_L || "9",
  width:  process.env.BADGE_BOX_W || "6",
  height: process.env.BADGE_BOX_H || "1",
  distance_unit: "in",
  weight: process.env.BADGE_BOX_OZ || "4",
  mass_unit: "oz",
};

// Pick the return destination + parcel for a sample by its kit matrix.
// Air badges go to AT Labs; everything else (water) goes to LIAL.
export function returnConfigFor(matrix) {
  if (matrix === "air") return { address: AT_LABS_ADDRESS, parcel: AIR_PARCEL };
  return { address: LAB_ADDRESS, parcel: PARCEL };
}
