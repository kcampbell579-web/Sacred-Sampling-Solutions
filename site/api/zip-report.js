// Emails the visitor their ZIP / area environmental profile plus a plain-language
// "what to test" checklist — the "Email my profile" button on the area-lookup
// tool. The old handler only pinged info@ via FormSubmit, so the CUSTOMER never
// received anything. This uses Resend (the same sender the order emails use) so
// the email actually reaches the person, then drops a lead notice to info@ and
// mirrors the lead into the portal. Dependency-free CommonJS, like the other
// site/api functions.

var SITE = 'https://www.sacredsamplingsolutions.com';
var FROM = 'Sacred Sampling Solutions <orders@sacredsamplingsolutions.com>';
var INBOX = 'info@sacredsamplingsolutions.com';

function readBody(req) {
  return new Promise(function (resolve) {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    var data = '';
    req.on('data', function (c) { data += c; });
    req.on('end', function () { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); } });
    req.on('error', function () { resolve({}); });
  });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c];
  });
}

function customerHtml(d) {
  var area = esc(d.area || 'your area');
  var zip = esc(d.zip || '');
  var concern = esc(d.primary_concern || '');
  return '' +
  '<div style="font-family:Arial,Helvetica,sans-serif;max-width:580px;margin:0 auto;color:#13203a;line-height:1.55">' +
    '<h2 style="color:#1f3a5f;margin:0 0 4px">Your area environmental profile</h2>' +
    '<p style="margin:0 0 16px;color:#52607a">' + area + (zip ? ' &middot; ZIP ' + zip : '') + '</p>' +
    (concern ? '<p style="margin:0 0 16px"><b>Primary concern flagged for your area:</b> ' + concern + '</p>' : '') +
    '<p style="margin:0 0 14px">This profile is based on public environmental records and geographic indicators. ' +
      'It does <b>not</b> determine what is actually present in your home — only a laboratory test of a sample from your ' +
      'property can do that. Here is a simple checklist of what is worth testing:</p>' +
    '<h3 style="color:#1f3a5f;margin:18px 0 6px">Water</h3>' +
    '<ul style="margin:0 0 14px;padding-left:20px">' +
      '<li><b>Lead &amp; heavy metals</b> — usually picked up from your home\'s own pipes and solder. <a href="' + SITE + '/kit-heavy-metals">Heavy Metals Kit</a></li>' +
      '<li><b>Bacteria &amp; nitrate</b> — essential for private wells. <a href="' + SITE + '/kit-essentials">Essentials Kit</a></li>' +
      '<li><b>PFAS &quot;forever chemicals&quot;</b> — new EPA limits are in parts per trillion. <a href="' + SITE + '/kit-pfas">PFAS Kit</a></li>' +
      '<li><b>Full chemistry picture</b> — VOCs, metals &amp; minerals in one panel. <a href="' + SITE + '/kit-comprehensive">Comprehensive Kit</a></li>' +
    '</ul>' +
    '<h3 style="color:#1f3a5f;margin:18px 0 6px">Air</h3>' +
    '<ul style="margin:0 0 14px;padding-left:20px">' +
      '<li><b>Formaldehyde &amp; carbonyls</b> — off-gas from new cabinetry, flooring &amp; furniture. <a href="' + SITE + '/kit-formaldehyde">Formaldehyde Monitor</a></li>' +
      '<li><b>VOCs / solvents</b> — 25 solvents named individually. <a href="' + SITE + '/kit-voc-air">VOC Monitor</a></li>' +
      '<li><b>Whole-room profile</b> — solvents + formaldehyde + ammonia + nitrogen dioxide. <a href="' + SITE + '/kit-iaq-comprehensive">Complete Air Quality Kit</a></li>' +
    '</ul>' +
    '<h3 style="color:#1f3a5f;margin:18px 0 6px">Surfaces &amp; materials</h3>' +
    '<ul style="margin:0 0 16px;padding-left:20px">' +
      '<li><b>Asbestos</b> — know before you sand, drill or demo a pre-1980 home. <a href="' + SITE + '/kit-asbestos-core">Asbestos Kits</a></li>' +
      '<li><b>Lead dust</b> — settled dust on floors &amp; window sills. <a href="' + SITE + '/kit-lead-dust-wipe">Lead Dust Wipe Kit</a></li>' +
    '</ul>' +
    '<p style="margin:0 0 18px"><a href="' + SITE + '/assets/whole-home-safety-check.pdf" ' +
      'style="background:#2c94fc;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;display:inline-block;font-weight:bold">' +
      'Download the full checklist (PDF)</a></p>' +
    '<p style="margin:0 0 6px">Not sure where to start? <a href="' + SITE + '/quiz">Take the 60-second kit quiz</a> ' +
      'or <a href="' + SITE + '/kits">browse all kits</a>.</p>' +
    '<p style="margin:18px 0 0;color:#8a94a6;font-size:12px">Sacred Sampling Solutions · Analyzed by accredited NYS ELAP ' +
      'laboratories. You received this because you requested an area profile at sacredsamplingsolutions.com.</p>' +
  '</div>';
}

async function resendSend(key, payload) {
  var r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return r.ok;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }

  var b = await readBody(req);
  var email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid email' });
  }
  var zip = String(b.zip || '').replace(/[^0-9]/g, '').slice(0, 5);
  var area = String(b.area || '').slice(0, 120);
  var concern = String(b.primary_concern || '').slice(0, 160);

  var key = process.env.RESEND_API_KEY;
  var emailed = false;

  if (key) {
    // 1) The email the customer is actually waiting for.
    try {
      emailed = await resendSend(key, {
        from: FROM,
        to: [email],
        reply_to: INBOX,
        subject: 'Your area profile & what to test' + (zip ? ' — ZIP ' + zip : ''),
        html: customerHtml({ area: area, zip: zip, primary_concern: concern })
      });
    } catch (e) { /* noop */ }
    // 2) Lead notice to the business inbox.
    try {
      await resendSend(key, {
        from: FROM,
        to: [INBOX],
        reply_to: email,
        subject: 'ZIP profile request — ' + (zip || '?'),
        text: 'Email: ' + email + '\nZIP: ' + zip + '\nArea: ' + area + '\nPrimary concern: ' + concern
      });
    } catch (e) { /* noop */ }
  } else {
    // No Resend key configured — at least capture the lead so it isn't lost.
    try {
      await fetch('https://formsubmit.co/ajax/' + INBOX, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ _subject: 'ZIP profile request — ' + (zip || '?'), email: email, zip: zip, area: area, primary_concern: concern })
      });
    } catch (e) { /* noop */ }
  }

  // Mirror into the portal leads inbox (best-effort, never blocks the response).
  try {
    await fetch('https://app.sacredsamplingsolutions.com/api/lead', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'profile', email: email, source: 'zip-report',
        message: 'ZIP ' + zip + ' / ' + area + (concern ? ' / ' + concern : ''),
        meta: { zip: zip, area: area, concern: concern }
      })
    });
  } catch (e) { /* noop */ }

  // ok:true means the request was accepted and the lead captured; emailed
  // reflects whether the customer email was actually dispatched via Resend.
  return res.status(200).json({ ok: true, emailed: emailed });
};
