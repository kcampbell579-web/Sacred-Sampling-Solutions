"use server";

import { sql } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";

function safeNext(v) {
  const s = (v || "").toString();
  return s.startsWith("/") ? s : "/dashboard"; // only allow internal paths
}

// Set a password via a one-time token (welcome link for auto-created accounts,
// or a password reset). Logs the user in on success.
export async function setPassword(formData) {
  const token = (formData.get("token") || "").toString();
  const password = (formData.get("password") || "").toString();
  const back = (msg) => `/set-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(msg)}`;
  if (password.length < 8) redirect(back("Choose a password of at least 8 characters."));
  const rows = await sql`select user_id, expires_at from password_resets where token=${token}`;
  if (!rows.length || new Date(rows[0].expires_at) < new Date()) {
    redirect(`/set-password?error=${encodeURIComponent("That link is invalid or has expired. Please request a new one.")}`);
  }
  const userId = rows[0].user_id;
  await sql`update users set password_hash=${hashPassword(password)} where id=${userId}`;
  await sql`delete from password_resets where token=${token}`;
  await createSession(userId);
  redirect("/dashboard");
}

export async function signup(formData) {
  const name = (formData.get("name") || "").toString().trim();
  const email = (formData.get("email") || "").toString().trim().toLowerCase();
  const phone = (formData.get("phone") || "").toString().trim();
  const password = (formData.get("password") || "").toString();
  const next = safeNext(formData.get("next"));
  const q = (msg) => `/signup?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`;

  if (!name || !email || password.length < 8) {
    redirect(q("Enter your name, email, and a password of at least 8 characters."));
  }
  const existing = await sql`select id from users where email=${email}`;
  if (existing.length) redirect(q("An account with that email already exists. Try logging in."));

  const rows = await sql`
    insert into users (name, email, phone, password_hash)
    values (${name}, ${email}, ${phone || null}, ${hashPassword(password)})
    returning id`;
  await createSession(rows[0].id);
  redirect(next);
}

export async function login(formData) {
  const email = (formData.get("email") || "").toString().trim().toLowerCase();
  const password = (formData.get("password") || "").toString();
  const next = safeNext(formData.get("next"));
  const rows = await sql`select id, password_hash from users where email=${email}`;
  if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
    redirect(`/login?error=${encodeURIComponent("Invalid email or password.")}&next=${encodeURIComponent(next)}`);
  }
  await createSession(rows[0].id);
  redirect(next);
}

export async function logout() {
  await destroySession();
  redirect("/");
}
