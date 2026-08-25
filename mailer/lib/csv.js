// Minimal RFC-4180 CSV/TSV reader — no dependency, because the rest of this
// repo has none. Handles quoted fields, escaped quotes, embedded newlines and
// CRLF line endings.

function detectDelimiter(text) {
  const line = text.split(/\r?\n/, 1)[0] || "";
  const counts = { ",": 0, "\t": 0, ";": 0 };
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch in counts) counts[ch]++;
  }
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
}

export function parseDelimited(text) {
  const src = text.replace(/^﻿/, "");           // strip a UTF-8 BOM
  const delim = detectDelimiter(src);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }  // "" is a literal quote
        else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === delim) { row.push(field); field = ""; continue; }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);

  return rows.map((r) => r.map((c) => c.trim()));
}

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i;

export function isEmail(v) {
  return EMAIL_RE.test(String(v || "").trim());
}

const EMAIL_HEADERS = ["email", "email address", "e-mail", "emailaddress", "email_address", "mail"];
const NAME_HEADERS = ["name", "full name", "fullname", "full_name", "contact", "contact name"];
const FIRST_HEADERS = ["first name", "firstname", "first_name", "first", "given name"];
const LAST_HEADERS = ["last name", "lastname", "last_name", "last", "surname", "family name"];

function indexOfHeader(headers, candidates) {
  return headers.findIndex((h) => candidates.includes(h));
}

// Turn raw CSV text into {contacts, skipped, total}. Works with or without a
// header row, and with a bare one-address-per-line list.
export function parseContacts(text) {
  const rows = parseDelimited(text);
  if (!rows.length) return { contacts: [], skipped: [], total: 0 };

  const first = rows[0];
  const headerRow = first.some((c) => isEmail(c)) ? null : first;
  const body = headerRow ? rows.slice(1) : rows;

  let headers = headerRow ? headerRow.map((h) => h.toLowerCase()) : [];
  let emailIdx = headers.length ? indexOfHeader(headers, EMAIL_HEADERS) : -1;
  if (emailIdx < 0) {
    // No usable header — fall back to the first column that looks like an address.
    emailIdx = (body[0] || []).findIndex((c) => isEmail(c));
    if (emailIdx < 0) emailIdx = 0;
  }
  const nameIdx = headers.length ? indexOfHeader(headers, NAME_HEADERS) : -1;
  const firstIdx = headers.length ? indexOfHeader(headers, FIRST_HEADERS) : -1;
  const lastIdx = headers.length ? indexOfHeader(headers, LAST_HEADERS) : -1;

  const contacts = [];
  const skipped = [];
  const seen = new Set();

  for (const r of body) {
    const email = (r[emailIdx] || "").trim().toLowerCase();
    if (!isEmail(email)) { skipped.push(r.join(",").slice(0, 120)); continue; }
    if (seen.has(email)) continue;                    // in-file duplicate
    seen.add(email);

    let name = nameIdx >= 0 ? r[nameIdx] : "";
    if (!name && (firstIdx >= 0 || lastIdx >= 0)) {
      name = [firstIdx >= 0 ? r[firstIdx] : "", lastIdx >= 0 ? r[lastIdx] : ""].filter(Boolean).join(" ");
    }

    // Every remaining column becomes a merge field keyed by its header.
    const fields = {};
    if (headers.length) {
      headers.forEach((h, i) => {
        if (i === emailIdx || !h) return;
        const v = (r[i] || "").trim();
        if (v) fields[h.replace(/\s+/g, "_")] = v;
      });
    }

    contacts.push({ email, name: (name || "").trim(), fields });
  }

  return { contacts, skipped, total: body.length };
}
