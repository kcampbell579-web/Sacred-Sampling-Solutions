// Customer account provisioning — auto-create a portal account from a paid
// order and email a "set your password" link. Best-effort and self-contained
// so it can't break the Stripe webhook.
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { randomBytes } from "crypto";

const PORTAL_BASE = process.env.PORTAL_BASE_URL || "https://app.sacredsamplingsolutions.com";

// Create a one-time password-set token for a user (default 14-day expiry).
export async function createPasswordToken(userId, days = 14) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + days * 86400000).toISOString();
  await sql`insert into password_resets (token, user_id, expires_at) values (${token}, ${userId}, ${expires})`;
  return token;
}

// Ensure a portal account exists for this email.
// Returns { userId, isNew, token } — token is set only when a new account was created.
export async function ensureAccountForEmail({ email, name, phone }) {
  const em = String(email || "").trim().toLowerCase();
  if (!em) return null;
  const existing = await sql`select id from users where email=${em}`;
  if (existing.length) return { userId: existing[0].id, isNew: false, token: null };
  // Unusable random password; the customer sets a real one via the emailed link.
  const placeholder = hashPassword(randomBytes(24).toString("hex"));
  const rows = await sql`
    insert into users (name, email, phone, password_hash)
    values (${name || em}, ${em}, ${phone || null}, ${placeholder})
    returning id`;
  const token = await createPasswordToken(rows[0].id);
  return { userId: rows[0].id, isNew: true, token };
}

// Email the welcome / set-password link via Resend. No-ops without RESEND_API_KEY.
export async function sendWelcomeSetPassword({ email, name, token }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !token || !email) return;
  const link = `${PORTAL_BASE}/set-password?token=${encodeURIComponent(token)}`;
  const first = String(name || "there").trim().split(/\s+/)[0] || "there";
  const from = process.env.RESEND_FROM || "Sacred Sampling Solutions <orders@sacredsamplingsolutions.com>";
  const html = `<!doctype html><html><body style="margin:0;background:#eef4fb;font-family:Arial,Helvetica,sans-serif;color:#10264a">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(16,38,74,.08)">
        <tr><td style="padding:26px 34px;border-bottom:1px solid #e8eef6">
          <img src="https://www.sacredsamplingsolutions.com/assets/logo-color.png" width="190" alt="Sacred Sampling Solutions" style="display:block;width:190px;height:auto;border:0">
        </td></tr>
        <tr><td style="padding:30px 34px">
          <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:#10264a">Your account is ready, ${first}.</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#304663">Thanks for your order! We created a Sacred Sampling account for you so you can register your kit, track its progress, and view your results — all in one place. Set a password to get started:</p>
          <a href="${link}" style="display:inline-block;background:#1071ef;color:#fff;text-decoration:none;font-weight:800;font-size:16px;padding:15px 26px;border-radius:9px">Set my password &rarr;</a>
          <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#8897aa">This link is valid for 14 days. If you didn't place an order, you can ignore this email.</p>
        </td></tr>
        <tr><td style="padding:20px 34px;background:#0e2a4d;color:#a9bdd3;font-size:11px">&copy; ${new Date().getFullYear()} Sacred Sampling Solutions</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email], subject: "Set up your Sacred Sampling account", html }),
    });
  } catch {
    // best-effort
  }
}
