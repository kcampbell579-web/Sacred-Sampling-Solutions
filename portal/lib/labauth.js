// Lightweight PIN gate for the lab portal (master spec §4.7).
// The PIN lives only in the LAB_PORTAL_PIN env var and never reaches the
// browser; a hash of it is stored in an httpOnly cookie once verified.
import { cookies } from "next/headers";
import { createHash } from "crypto";

const COOKIE = "sss_lab";
const EIGHT_HOURS = 60 * 60 * 8;

function pinHash() {
  const pin = process.env.LAB_PORTAL_PIN || "";
  return createHash("sha256").update("sss-lab:" + pin).digest("hex");
}

export function labConfigured() {
  return !!process.env.LAB_PORTAL_PIN;
}

export function verifyPin(pin) {
  return labConfigured() && String(pin) === String(process.env.LAB_PORTAL_PIN);
}

export function labAuthed() {
  if (!labConfigured()) return false;
  const c = cookies().get(COOKIE)?.value;
  return !!c && c === pinHash();
}

export function setLabCookie() {
  cookies().set(COOKIE, pinHash(), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: EIGHT_HOURS,
  });
}

export function clearLabCookie() {
  cookies().set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}
