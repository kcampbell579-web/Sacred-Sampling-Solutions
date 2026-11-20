// Merge fields + text-to-HTML. Kept deliberately small: a campaign body is
// plain text with {{token}} placeholders unless the author ticks "HTML".
import { unsubUrl } from "@/lib/unsub";

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function firstName(name, email) {
  const n = (name || "").trim();
  if (n) return n.split(/\s+/)[0];
  return (email || "").split("@")[0];
}

// {{name}}, {{first_name}}, {{email}} plus any column from the uploaded CSV.
// An unknown token renders empty rather than leaking "{{foo}}" into the email.
export function mergeTokens(template, contact) {
  const vars = {
    email: contact.email || "",
    name: (contact.name || "").trim() || firstName(contact.name, contact.email),
    first_name: firstName(contact.name, contact.email),
    ...(contact.fields || {}),
  };
  return String(template).replace(/\{\{\s*([a-z0-9_ -]+)\s*\}\}/gi, (_, key) => {
    const k = key.trim().toLowerCase().replace(/[\s-]+/g, "_");
    return vars[k] != null ? String(vars[k]) : "";
  });
}

function textToHtml(text) {
  const linked = escapeHtml(text).replace(
    /(https?:\/\/[^\s<]+)/g,
    (u) => `<a href="${u}" style="color:#155ec2">${u}</a>`
  );
  return linked
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

// Wrap the body in a plain, single-column shell and append the unsubscribe
// line. CAN-SPAM requires a working opt-out and a physical postal address, so
// both are added to every message — there is no way to send without them.
export function renderEmail({ body, bodyIsHtml, contact }) {
  const merged = mergeTokens(body, contact);
  const inner = bodyIsHtml ? merged : textToHtml(merged);
  const link = unsubUrl(contact.email);
  const address = process.env.MAILER_POSTAL_ADDRESS || "Sacred Sampling Solutions";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#eef4fc">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4fc;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dde5f0;border-radius:16px;padding:32px;font-family:'Manrope',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#0e1520">
<tr><td>
${inner}
</td></tr>
<tr><td style="padding-top:24px;border-top:1px solid #dde5f0;margin-top:24px;font-size:12px;line-height:1.5;color:#7a869a">
${escapeHtml(address)}<br>
<a href="${link}" style="color:#7a869a;text-decoration:underline">Unsubscribe</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = (bodyIsHtml ? merged.replace(/<[^>]+>/g, "") : merged)
    + `\n\n—\n${address}\nUnsubscribe: ${link}\n`;

  return { html, text, unsubscribeUrl: link };
}
