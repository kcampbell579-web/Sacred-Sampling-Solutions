// Build the Assay Technology "594AT Lab Request Form" (the air-badge chain of
// custody) with pdf-lib — drawn from scratch so it runs in the serverless
// runtime (no headless browser). NO2 / air samples use this instead of the
// LIAL water COC.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ASSAY_LOGO_B64, ASSAY_LOGO_WH } from "./assay-logo.b64.js";
import { CLIENT } from "./coc.js";
import { splitCollected } from "./coc.js";

// Fixed "Send Lab Report To:" block + account facts for the Assay account.
const REPORT_TO = {
  name: "Kelly Campbell McClure",
  email: "laboratory@sacredsamplingsolutions.com",
  company: "Sacred Sampling Solutions",
  tel: CLIENT.phone || "631-875-2958",
  address: "44 Drake Ave",
  cityStateZip: "Bellport, NY 11713",
};
const CUSTOMER_NUMBER = process.env.ASSAY_CUSTOMER_NUMBER || "70575";
const RETURN_TO = "Return to: AT Labs, 8540 Crossroads Dr, Youngstown, OH 44514";

const GREEN = rgb(0.0, 0.70, 0.27); // prefilled values
const BLACK = rgb(0.07, 0.07, 0.07);

function usDate(v) {
  const { date } = splitCollected(v);
  const m = String(date || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : "";
}

export async function buildAssayLrf({ reg, coc }) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // US Letter
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg_ = await doc.embedFont(StandardFonts.Helvetica);
  const ital = await doc.embedFont(StandardFonts.HelveticaOblique);
  const logo = await doc.embedPng(`data:image/png;base64,${ASSAY_LOGO_B64}`);

  const L = 40, R = 572, W = R - L; // content box

  const text = (s, x, y, { size = 10, font = reg_, color = BLACK } = {}) =>
    page.drawText(String(s == null ? "" : s), { x, y, size, font, color });
  const rtext = (s, xRight, y, opts = {}) => {
    const f = opts.font || reg_, sz = opts.size || 10;
    text(s, xRight - f.widthOfTextAtSize(String(s), sz), y, opts);
  };
  const ctext = (s, xc, y, opts = {}) => {
    const f = opts.font || reg_, sz = opts.size || 10;
    text(s, xc - f.widthOfTextAtSize(String(s), sz) / 2, y, opts);
  };
  const rect = (x, y, w, h) =>
    page.drawRectangle({ x, y, width: w, height: h, borderColor: BLACK, borderWidth: 1.2 });
  // A labelled box: small bold label top-left, value beneath.
  const cell = (x, y, w, h, label, value, color = GREEN) => {
    rect(x, y, w, h);
    text(label, x + 6, y + h - 13, { size: 8.5, font: bold });
    if (value) text(value, x + 6, y + h - 30, { size: 12, color });
  };

  // ---- Header: logo left, title right, rule under ----
  const logoH = 66, logoW = logoH * (ASSAY_LOGO_WH.w / ASSAY_LOGO_WH.h);
  const headTop = 752;
  page.drawImage(logo, { x: L, y: headTop - logoH, width: logoW, height: logoH });
  rtext("594AT LAB REQUEST FORM", R, headTop - logoH + 20, { size: 19, font: bold });
  page.drawLine({ start: { x: L, y: headTop - logoH - 8 }, end: { x: R, y: headTop - logoH - 8 }, thickness: 2, color: BLACK });
  text("Please print clearly and complete all boxes.", L, headTop - logoH - 26, { size: 11, font: ital });

  // ---- Top three boxes ----
  let y = headTop - logoH - 44;
  const boxH = 50, gap = 10, bw = (W - 2 * gap) / 3;
  const bY = y - boxH;
  cell(L, bY, bw, boxH, "Monitor Serial Number * (ex: AB12345)", "");
  cell(L + bw + gap, bY, bw, boxH, "Customer Number", CUSTOMER_NUMBER);
  cell(L + 2 * (bw + gap), bY, bw, boxH, "Sample ID *", reg.sample_id);

  // ---- Send Lab Report To: ----
  y = bY - 22;
  text("Send Lab Report To:", L, y, { size: 13.5, font: bold });
  y -= 6;
  const colL = W / 2, rowH = 34;
  const half = (xi, yTop, label, value, color = GREEN) => cell(xi, yTop - rowH, colL, rowH, label, value, color);
  let ry = y;
  half(L, ry, "Name/Title *", REPORT_TO.name); half(L + colL, ry, "E-Mail", REPORT_TO.email); ry -= rowH;
  half(L, ry, "Company/Organization *", REPORT_TO.company); half(L + colL, ry, "TEL *", REPORT_TO.tel); ry -= rowH;
  half(L, ry, "Address *", REPORT_TO.address); half(L + colL, ry, "FAX", ""); ry -= rowH;
  half(L, ry, "City/State/Zip *", REPORT_TO.cityStateZip); half(L + colL, ry, "", ""); ry -= rowH;

  // ---- Sampling Data: ----
  y = ry - 20;
  text("Sampling Data:", L, y, { size: 13.5, font: bold });
  y -= 6;
  // Row A: full width Person/Area/Task
  cell(L, y - rowH, W, rowH, "Person/Area/Task Monitored", coc?.location || "", BLACK);
  y -= rowH;
  // Row B: Start / Stop / Date(s)
  const t3 = W / 3;
  cell(L, y - rowH, t3, rowH, "Start Time * (AM / PM)", "");
  cell(L + t3, y - rowH, t3, rowH, "Stop Time * (AM / PM)", "");
  cell(L + 2 * t3, y - rowH, W - 2 * t3, rowH, "Date(s) Sampled *", usDate(coc?.collected_at), BLACK);
  y -= rowH;
  // Row C: Sampled & Relinquished By (2/3) / OR Time Sampled (1/3)
  const w23 = (W * 2) / 3;
  cell(L, y - rowH, w23, rowH, "Sampled & Relinquished By", coc?.sampler_name || "", BLACK);
  cell(L + w23, y - rowH, W - w23, rowH, "OR Time Sampled (min)", "");
  y -= rowH;
  // Row D: Project Name/No.
  cell(L, y - rowH, W, rowH, "Project Name/No. (optional)", reg.sample_id);
  y -= rowH;

  // ---- Important + analyte table ----
  y -= 22;
  ctext("IMPORTANT!  Record All Sampling Data!", (L + R) / 2, y, { size: 13.5, font: bold });
  y -= 18;
  text("Pre-paid analysis has been selected below.", L, y, { size: 11.5, font: bold });
  y -= 6;
  const aH = 22, c4 = W / 4;
  const headers = ["Analyte Selected", "Analyte CAS No.", "ANALYTE NAME", "Monitor Number"];
  const values = ["X", "10102-44-0", "Nitrogen Dioxide", "594"];
  for (let i = 0; i < 4; i++) {
    rect(L + i * c4, y - aH, c4, aH);
    ctext(headers[i], L + i * c4 + c4 / 2, y - 15, { size: 9.5, font: bold });
    rect(L + i * c4, y - 2 * aH, c4, aH);
    ctext(values[i], L + i * c4 + c4 / 2, y - aH - 15, { size: 11, font: i === 0 ? bold : reg_ });
  }
  y -= 2 * aH + 18;

  // ---- Return-to + required note ----
  text(RETURN_TO, L, y, { size: 13, font: bold });
  rtext("* REQUIRED FIELDS", R, y - 16, { size: 10.5, font: bold });

  return await doc.save();
}
