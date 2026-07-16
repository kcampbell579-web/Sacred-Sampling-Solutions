import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";

const COOKIE = "sss_session";
const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

export function hashPassword(pw) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw, stored) {
  try {
    const [salt, hash] = String(stored).split(":");
    const expected = Buffer.from(hash, "hex");
    const actual = scryptSync(pw, salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + THIRTY_DAYS);
  await sql`insert into sessions (token, user_id, expires_at) values (${token}, ${userId}, ${expires.toISOString()})`;
  cookies().set(COOKIE, token, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", expires,
  });
}

export async function destroySession() {
  const token = cookies().get(COOKIE)?.value;
  if (token) await sql`delete from sessions where token=${token}`;
  cookies().set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const rows = await sql`
    select u.id, u.name, u.email, u.phone
    from sessions s join users u on u.id = s.user_id
    where s.token=${token} and s.expires_at > now()`;
  return rows[0] || null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
