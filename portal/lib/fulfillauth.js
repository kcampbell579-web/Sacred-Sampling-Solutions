// PIN gate for the fulfillment portal — same pattern as the lab portal.
// PIN lives only in FULFILLMENT_PIN; a hash is stored in an httpOnly cookie.
import { cookies } from "next/headers";
import { createHash } from "crypto";

const COOKIE = "sss_fulfill";
const EIGHT_HOURS = 60 * 60 * 8;

function pinHash() {
  const pin = process.env.FULFILLMENT_PIN || "";
  return createHash("sha256").update("sss-fulfill:" + pin).digest("hex");
}

export function fulfillConfigured() {
  return !!process.env.FULFILLMENT_PIN;
}

export function verifyPin(pin) {
  return fulfillConfigured() && String(pin) === String(process.env.FULFILLMENT_PIN);
}

export function fulfillAuthed() {
  if (!fulfillConfigured()) return false;
  const c = cookies().get(COOKIE)?.value;
  return !!c && c === pinHash();
}

export function setFulfillCookie() {
  cookies().set(COOKIE, pinHash(), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: EIGHT_HOURS,
  });
}

export function clearFulfillCookie() {
  cookies().set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}
