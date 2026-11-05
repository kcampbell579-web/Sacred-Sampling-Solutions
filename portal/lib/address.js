// Best-effort parse of orders.ship_address, which the Stripe webhook stores as
// a single string: "line1, [line2,] city state zip, country".
// Used to pre-fill the outbound-label form; the operator confirms before buying.
export function parseShipAddress(s) {
  const out = { street1: "", street2: "", city: "", state: "", zip: "" };
  if (!s) return out;
  const parts = String(s).split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length && /^(us|usa|united states)$/i.test(parts[parts.length - 1])) parts.pop();
  const csz = parts.pop() || "";
  const m = csz.match(/^(.*?)\s+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (m) {
    out.city = m[1].trim();
    out.state = m[2].toUpperCase();
    out.zip = m[3];
  } else {
    out.city = csz;
  }
  out.street1 = parts.shift() || "";
  out.street2 = parts.join(", ");
  return out;
}
