// PIN gate for the mailer — same pattern as the portal's fulfillment/lab gates.
// The PIN lives only in MAILER_PIN; a hash of it is stored in an httpOnly cookie.
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";

const COOKIE = "sss_mailer";
const EIGHT_HOURS = 60 * 60 * 8;

function pinHash() {
  return createHash("sha256").update("sss-mailer:" + (process.env.MAILER_PIN || "")).digest("hex");
}

export function mailerConfigured() {
  return !!process.env.MAILER_PIN;
}

export function verifyPin(pin) {
  if (!mailerConfigured()) return false;
  const a = Buffer.from(String(pin));
  const b = Buffer.from(String(process.env.MAILER_PIN));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function mailerAuthed() {
  if (!mailerConfigured()) return false;
  const c = cookies().get(COOKIE)?.value;
  return !!c && c === pinHash();
}

export function setMailerCookie() {
  cookies().set(COOKIE, pinHash(), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: EIGHT_HOURS,
  });
}

export function clearMailerCookie() {
  cookies().set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}
