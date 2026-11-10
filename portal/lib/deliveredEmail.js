// "Your kit was delivered" email, sent automatically when UPS reports delivery.
// Same design as email-templates/order-delivered.html (the Mailjet version);
// here the first name is filled in directly and it goes out through Resend,
// with replies going to the owner's inbox.
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const APP = "https://app.sacredsamplingsolutions.com";
const SITE = "https://www.sacredsamplingsolutions.com";

function step(n, title, text) {
  return `<tr>
    <td width="40" valign="top" style="padding:0 0 16px;"><div style="width:30px;height:30px;border-radius:15px;background:#1071ef;color:#ffffff;font-size:14px;font-weight:800;line-height:30px;text-align:center;">${n}</div></td>
    <td valign="top" style="padding:3px 0 16px;font-size:15px;line-height:1.55;color:#304663;"><b style="color:#10264a;">${title}</b> ${text}</td>
  </tr>`;
}

export function deliveredEmailHtml(name) {
  const first = esc(String(name || "").trim().split(/\s+/)[0] || "there");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your Sacred Sampling Solutions kit was delivered</title>
<style>@media only screen and (max-width:640px){.container{width:100%!important}.px-40{padding-left:22px!important;padding-right:22px!important}.hide-mobile{display:none!important}.btn{display:block!important;width:100%!important;box-sizing:border-box!important;text-align:center!important}h1{font-size:34px!important;line-height:1.08!important}}</style></head>
<body style="margin:0;padding:0;background:#eef4fb;font-family:Arial,Helvetica,sans-serif;color:#10264a;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">I see your kit was delivered! Here&rsquo;s how to get started &mdash; and just reply if you have any questions.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef4fb;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="container" style="width:640px;max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;">
  <tr><td class="px-40" style="padding:24px 36px;border-bottom:1px solid #e8eef6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle"><img src="${SITE}/assets/logo-color.png" width="200" alt="Sacred Sampling Solutions" style="display:block;width:200px;max-width:100%;height:auto;border:0;"></td>
      <td align="right" valign="middle" class="hide-mobile" style="font-size:11px;letter-spacing:2px;color:#7c8da6;font-weight:700;text-transform:uppercase;line-height:1.5;">Cleaner Environments.<br>Healthier Tomorrows.&reg;</td>
    </tr></table>
  </td></tr>
  <tr><td class="px-40" style="padding:34px 36px 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;"><tr><td width="52" height="52" align="center" valign="middle" style="width:52px;height:52px;border-radius:26px;background:#e3f4ea;color:#2b8a56;font-size:26px;font-weight:800;line-height:52px;">&#10003;</td></tr></table>
    <div style="font-size:13px;line-height:1.4;font-weight:800;letter-spacing:2.5px;color:#2b8a56;text-transform:uppercase;margin-bottom:12px;">Your kit was delivered</div>
    <h1 style="margin:0 0 18px;font-size:42px;line-height:1.05;letter-spacing:-1.2px;color:#10264a;font-weight:800;">Your test kit <span style="color:#1071ef;">has arrived.</span></h1>
    <p style="margin:0 0 14px;font-size:17px;line-height:1.6;color:#304663;">Hi ${first},</p>
    <p style="margin:0 0 14px;font-size:17px;line-height:1.6;color:#304663;">I see your order was delivered! Your Sacred Sampling Solutions kit should be waiting for you. When you&rsquo;re ready, here&rsquo;s how to get started:</p>
  </td></tr>
  <tr><td class="px-40" style="padding:6px 36px 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${step(1, "Activate your kit.", "Find the Sample ID on the sticker inside your box and register it in your portal.")}
    ${step(2, "Watch the quick training.", "It shows exactly how to collect your sample so the lab results are accurate.")}
    ${step(3, "Collect and send it back.", "Use the prepaid return label and ship it the same day you collect.")}
  </table></td></tr>
  <tr><td class="px-40" style="padding:8px 36px 10px;">
    <a class="btn" href="${APP}/sampleregistration" target="_blank" style="display:inline-block;background:#1071ef;color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;padding:16px 28px;border-radius:10px;">Activate my kit &rarr;</a>
    <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#5d7391;"><a href="${APP}/instructions" style="color:#1071ef;font-weight:700;text-decoration:none;">Collection instructions</a> &nbsp;&middot;&nbsp; <a href="${APP}/dashboard" style="color:#1071ef;font-weight:700;text-decoration:none;">Track your kit&rsquo;s progress</a></p>
  </td></tr>
  <tr><td class="px-40" style="padding:22px 36px 30px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#eef4fb;border-radius:12px;padding:18px 20px;font-size:15px;line-height:1.6;color:#304663;"><b style="color:#10264a;">Questions? Just reply to this email.</b><br>It comes straight to me, and I&rsquo;m happy to help with anything &mdash; from where to sample to what your results will show.</td></tr></table>
    <p style="margin:22px 0 0;font-size:15px;line-height:1.6;color:#304663;">Thank you for testing with us,<br><b style="color:#10264a;">Kelly</b><br><span style="color:#7c8da6;font-size:13px;">Founder, Sacred Sampling Solutions</span></p>
  </td></tr>
  <tr><td style="padding:20px 34px 26px;background:#f7fbff;border-top:1px solid #e8eef6;font-size:11px;line-height:1.6;color:#9aa9bd;" align="center">
    You&rsquo;re receiving this because you ordered a test kit from Sacred Sampling Solutions.<br>Sacred Sampling Solutions LLC &middot; 44 Drake Ave, Bellport, NY 11713
  </td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendDeliveredEmail({ email, name }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !email) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Sacred Sampling Solutions <orders@sacredsamplingsolutions.com>",
        to: [email],
        reply_to: process.env.OWNER_EMAIL || "info@sacredsamplingsolutions.com",
        subject: "Your Sacred Sampling kit has arrived 📦",
        html: deliveredEmailHtml(name),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
