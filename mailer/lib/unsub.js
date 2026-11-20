// Signed unsubscribe links. The token is an HMAC of the address, so links are
// stateless (nothing extra to store) and can't be guessed or enumerated.
import { createHmac, timingSafeEqual } from "crypto";

function secret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.MAILER_PIN || "sss-mailer-dev";
}

export function unsubToken(email) {
  return createHmac("sha256", secret()).update(String(email).trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function verifyUnsubToken(email, token) {
  const a = Buffer.from(String(token || ""));
  const b = Buffer.from(unsubToken(email));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function appBaseUrl() {
  const explicit = process.env.MAILER_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

export function unsubUrl(email) {
  const e = encodeURIComponent(String(email).trim().toLowerCase());
  return `${appBaseUrl()}/unsubscribe?e=${e}&t=${unsubToken(email)}`;
}
