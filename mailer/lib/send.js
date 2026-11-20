// Outbound transport. Resend, because the portal already uses it — one API key
// covers both apps. Returns a result object rather than throwing so a single
// bad address can never abort a run.
export function transportConfigured() {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail({ from, replyTo, to, subject, html, text, unsubscribeUrl }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };

  const headers = {};
  if (unsubscribeUrl) {
    // RFC 8058 one-click unsubscribe — mailbox providers surface this as the
    // native "Unsubscribe" button and it materially helps deliverability.
    headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        html,
        text,
        headers,
      }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: payload?.message || payload?.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true, id: payload?.id || null };
  } catch (e) {
    return { ok: false, error: e?.message || "network error" };
  }
}

export function fromHeader(name, email) {
  const n = (name || "").trim();
  return n ? `${n.replace(/["<>]/g, "")} <${email}>` : email;
}
