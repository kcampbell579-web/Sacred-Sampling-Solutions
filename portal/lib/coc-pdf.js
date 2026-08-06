// Fill the REAL Long Island Analytical (LIAL) "Chain of Custody / Request for
// Analysis" fillable PDF — the exact form the lab uses — with pdf-lib.
//
// The blank template (all 327 AcroForm fields cleared) is embedded as base64 in
// lial-coc-template.b64.js so the serverless bundle is self-contained.

import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { LIAL_COC_TEMPLATE_B64 } from "./lial-coc-template.b64.js";
import {
  CLIENT,
  RELINQUISHER,
  cocSpecForCode,
  NAMED_COL_INDEX,
  ANALYSIS_TEXT,
  splitCollected,
} from "./coc.js";

// The company's fixed name/address block (relinquishing party on the form).
const CLIENT_ADDRESS = "SACRED SAMPLING SOLUTIONS\n44 Drake Ave, Bellport, NY 11713";

// X of the left edge of each analysis checkbox column on page 1 (from the
// template's widget rectangles). Columns 0-3 are pre-printed
// (Metals / Nitrate / VOCs / PFCs); 4+ are blank write-in columns.
const COL_X = [507.2, 525.7, 544.1, 562.5, 580.9, 599.3, 617.7, 636.1, 654.5, 672.9, 691.3, 709.7];
const COL_W = 17.9; // box width, for centering the write-in label

function set(form, name, value) {
  if (value == null || value === "") return;
  try {
    const f = form.getTextField(name);
    f.setText(String(value));
    try { f.setFontSize(8); } catch {}
  } catch {}
}

function check(form, name) {
  try { form.getCheckBox(name).check(); } catch {}
}

// MM/DD/YY for the sample-date cell.
function usDate(dateStr) {
  const m = String(dateStr || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateStr || "";
  return `${m[2]}/${m[3]}/${m[1].slice(2)}`;
}

/**
 * Build the filled COC PDF.
 * @param {object} args
 * @param {object} args.coc  chain_of_custody row (sampler_name, collected_at, location, matrix, observations, signature_png)
 * @param {object} args.reg  sample_registrations row (sample_id, kit_code, kit_panel, customer_name, sample_source, city, state)
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function fillLialCoc({ coc, reg }) {
  const bytes = Buffer.from(LIAL_COC_TEMPLATE_B64, "base64");
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  const helv = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.getPages()[0];

  const code = String(reg.kit_code || "").toUpperCase();
  const spec = cocSpecForCode(code);
  const sampleId = reg.sample_id;
  const customer = reg.customer_name || coc.sampler_name || "";
  const { date, time } = splitCollected(coc.collected_at);

  // --- Header / client block ------------------------------------------------
  set(form, "CLIENT NAME/ADDRESS", CLIENT_ADDRESS);
  set(form, "CONTACT", CLIENT.contact);
  set(form, "PHONE", CLIENT.phone);
  set(form, "REPORTS EMAIL", CLIENT.reportsEmail);
  set(form, "INVOICE EMAIL", CLIENT.invoiceEmail);
  // Project location = the customer's city/state.
  const loc = [reg.city, reg.state].filter(Boolean).join(", ");
  set(form, "PROJECT LOCATION", loc);
  // Sampler = the homeowner who collected it.
  set(form, "SAMPLER SIGNATURE", customer);
  set(form, "SAMPLER NAME PRINT", customer);

  // --- Sample row 1 ---------------------------------------------------------
  // The Sample ID is the lab's key, so it goes in the location cell.
  set(form, "SAMPLE LOCATION 1", sampleId);
  set(form, "SAMPLE DATE 1", usDate(date));
  set(form, "SAMPLE TIME 1", time);
  set(form, "M1", "DW"); // matrix: drinking water
  set(form, "T1", "G"); //  type: grab
  set(form, "P1", "1"); //  preservative code
  set(form, " OF CONTAINERS1", String(spec.containers)); // NOTE: leading space in field name

  // --- Analysis columns -----------------------------------------------------
  // Pre-printed columns: tick the box in header row 0 for this single sample.
  for (const key of spec.named) {
    const col = NAMED_COL_INDEX[key];
    if (col != null) check(form, `Check Box1.0.${col}`);
  }
  // Write-in columns (EST, CL/F, BACT…): draw a rotated label above a blank
  // column and tick that column for the sample.
  spec.writeIns.forEach((label, i) => {
    const col = 4 + i;
    if (col > 11) return;
    const cx = COL_X[col] + COL_W / 2;
    // Diagonal header text, matching the pre-printed column headers' angle.
    page.drawText(label, {
      x: cx - 3,
      y: 409,
      size: 7,
      font: helv,
      color: rgb(0, 0, 0),
      rotate: degrees(55),
    });
    check(form, `Check Box1.0.${col}`);
  });

  // --- Comments / analysis requested ---------------------------------------
  const analysis = ANALYSIS_TEXT[code] || "";
  const faucet = reg.sample_source || coc.location || "";
  let comment = analysis ? `Analysis requested: ${analysis}.` : "";
  if (faucet) comment += ` Collected at ${faucet}.`;
  comment += " Sacred Sampling household kit — shipped same day on ice.";
  set(form, "COMMENTS/INSTRUCTIONS", comment.trim());

  // --- Relinquished by (company rep) ---------------------------------------
  set(form, "RELINQUISHED BY SIGNATURE_1", RELINQUISHER);
  set(form, "PRINTED NAME_1", RELINQUISHER.toUpperCase());
  // Relinquished date = collection date (shipped same day).
  const dm = String(date || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dm) {
    set(form, "MONTH", dm[2]);
    set(form, "DAY", dm[3]);
    set(form, "YEAR", dm[1].slice(2));
  }

  // Bake appearances and flatten so the lab sees a clean, non-editable form.
  try { form.updateFieldAppearances(helv); } catch {}
  form.flatten();

  return await doc.save();
}
