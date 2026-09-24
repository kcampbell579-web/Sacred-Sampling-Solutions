// POST /api/stripe-webhook — Stripe calls this the instant an order is paid.
// It emails info@sacredsamplingsolutions.com with the Sacred Sampling order
// number, items, customer, and shipping address — so a sale is never missed,
// even if the buyer closes the tab before the thank-you page loads.
//
// SETUP (one time):
//   1. Stripe Dashboard → Developers → Webhooks → Add endpoint
//      URL:    https://www.sacredsamplingsolutions.com/api/stripe-webhook
//      Events: checkout.session.completed
//              checkout.session.async_payment_succeeded  (optional)
//   2. Copy the endpoint's "Signing secret" (whsec_...) and add it in Vercel as
//      STRIPE_WEBHOOK_SECRET. (Optional but recommended — if it's set, incoming
//      events are signature-verified. Either way, every event is re-fetched from
//      Stripe with the secret key before an email is sent, so forged calls can't
//      trigger a notification.)
//
// Uses STRIPE_SECRET_KEY (already set). Optional: RESEND_API_KEY to send via
// Resend instead of formsubmit.co.

var crypto = require('crypto');

var ORDER_START = 91001;
var ABBREV = {
  'Heavy Metals Kit': 'BAS', 'Metals & Minerals Kit': 'MNM', 'Comprehensive Kit': 'COM',
  'PFAS Kit': 'PFAS', 'Essentials Kit': 'ESS', 'Complete Home Inspection Water Kit': 'PRO',
  'Complete Air Quality Kit': 'IAC', 'NO₂ Monitor': 'NO2', 'Aldehyde & Formaldehyde Monitor': 'ALD',
  'VOC Monitor': 'VOC', 'Ammonia Monitor': 'AMM', 'Asbestos Core Kit': 'ASB',
  'Asbestos Standard Kit': 'ASP', 'Asbestos Advanced Kit': 'AST',
  'Cosmetic Screening Panel': 'CSM', 'Cosmetic Identification Panel': 'CSM',
  'Fentanyl Surface Residue Kit': 'SRC'
};
function abbrevFor(items) {
  var names = {};
  (items || []).forEach(function (i) { if (i && i.name) names[i.name] = true; });
  var keys = Object.keys(names);
  if (keys.length === 1) return ABBREV[keys[0]] || 'KIT';
  if (keys.length > 1) return 'MIX';
  return 'KIT';
}
function fallbackNumber(sessionId, abbr) {
  var tail = String(sessionId || '').replace(/^cs_(live|test)_/, '');
  var clean = tail.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return 'SS-' + abbr + '-' + (clean.slice(-6) || 'ORDER');
}

// ---- KV (Upstash REST) — sequential number + email de-dup ----------------
function kvConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  };
}
async function kv(command) {
  var c = kvConfig();
  if (!c.url || !c.token) return null;
  try {
    var r = await fetch(c.url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + c.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}
async function sequentialNumber(sessionId, abbr) {
  var existing = await kv(['GET', 'order:sid:' + sessionId]);
  if (existing === null) return null;
  if (existing.result) return existing.result;
  var inc = await kv(['INCR', 'order:counter']);
  if (!inc || typeof inc.result !== 'number') return null;
  var number = 'SS-' + abbr + '-' + (ORDER_START - 1 + inc.result);
  await kv(['SET', 'order:sid:' + sessionId, number]);
  return number;
}

function readRawBody(req) {
  return new Promise(function (resolve) {
    var data = '';
    req.on('data', function (c) { data += c; });
    req.on('end', function () { resolve(data); });
    req.on('error', function () { resolve(''); });
  });
}

function money(cents) { return (typeof cents === 'number') ? '$' + (cents / 100).toFixed(2) : ''; }

async function sendEmail(fields) {
  // Preferred: Resend (set RESEND_API_KEY). Fallback: formsubmit.co (the same
  // pipeline the site's contact form already uses to reach info@).
  var subject = fields._subject;
  var text = Object.keys(fields).filter(function (k) { return k !== '_subject'; })
    .map(function (k) { return k.replace(/_/g, ' ') + ': ' + fields[k]; }).join('\n');
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Sacred Sampling Orders <orders@sacredsamplingsolutions.com>',
          to: ['info@sacredsamplingsolutions.com'],
          subject: subject,
          text: text
        })
      });
      return;
    } catch (e) { /* fall through to formsubmit */ }
  }
  await fetch('https://formsubmit.co/ajax/info@sacredsamplingsolutions.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(fields)
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  var key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(200).json({ ok: false, reason: 'not configured' });

  var raw = await readRawBody(req);
  var event;
  try { event = raw ? JSON.parse(raw) : (req.body || {}); }
  catch (e) { event = req.body || {}; }

  // Optional signature check (only when the secret is configured and we have the
  // raw body). The re-fetch below is the real safeguard, so we don't hard-require it.
  var secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (secret && raw) {
    try {
      var sigHeader = req.headers['stripe-signature'] || '';
      var parts = {};
      sigHeader.split(',').forEach(function (p) { var i = p.indexOf('='); if (i > 0) parts[p.slice(0, i)] = p.slice(i + 1); });
      var expected = crypto.createHmac('sha256', secret).update(parts.t + '.' + raw, 'utf8').digest('hex');
      var ok = parts.v1 && expected.length === parts.v1.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
      if (!ok) return res.status(400).json({ error: 'signature verification failed' });
    } catch (e) { return res.status(400).json({ error: 'signature error' }); }
  }

  try {
    var type = event && event.type;
    if (type !== 'checkout.session.completed' && type !== 'checkout.session.async_payment_succeeded') {
      return res.status(200).json({ ignored: type || 'unknown' });
    }
    var sessId = event.data && event.data.object && event.data.object.id;
    if (!sessId) return res.status(200).json({ ok: false });

    // Authoritative re-fetch from Stripe (confirms the order is real + paid, and
    // gives line items + shipping the event doesn't include).
    var r = await fetch('https://api.stripe.com/v1/checkout/sessions/' +
      encodeURIComponent(sessId) + '?expand[]=line_items', { headers: { 'Authorization': 'Bearer ' + key } });
    var s = await r.json();
    if (!r.ok || !s || s.id !== sessId || s.payment_status !== 'paid') {
      return res.status(200).json({ ok: false, reason: 'not paid' });
    }

    // De-dup: Stripe retries events; only email once per session.
    var flag = await kv(['GET', 'email:sid:' + sessId]);
    if (flag && flag.result) return res.status(200).json({ ok: true, deduped: true });

    var items = (s.line_items && s.line_items.data || []).map(function (li) {
      return { name: li.description, quantity: li.quantity };
    });
    var abbr = abbrevFor(items);
    var orderNo = null;
    try { orderNo = await sequentialNumber(s.id, abbr); } catch (e) { orderNo = null; }
    if (!orderNo) orderNo = fallbackNumber(s.id, abbr);

    var cust = s.customer_details || {}, ship = s.shipping_details || {}, addr = ship.address || {};
    var lines = items.map(function (i) { return (i.quantity > 1 ? i.quantity + '× ' : '') + i.name; }).join(', ');
    var addrStr = [addr.line1, addr.line2, [addr.city, addr.state].filter(Boolean).join(', '), addr.postal_code]
      .filter(Boolean).join(' · ');

    await sendEmail({
      _subject: 'New order ' + orderNo + ' — ' + (ship.name || cust.name || cust.email || 'Sacred Sampling'),
      order_number: orderNo,
      total: money(s.amount_total),
      items: lines,
      customer: ship.name || cust.name || '',
      email: cust.email || '',
      phone: cust.phone || '',
      ship_to: addrStr,
      view_all_orders: 'https://www.sacredsamplingsolutions.com/orders'
    });

    await kv(['SET', 'email:sid:' + sessId, '1']);
    return res.status(200).json({ ok: true, order: orderNo });
  } catch (e) {
    // Return 200 so Stripe doesn't hammer retries on our transient errors.
    return res.status(200).json({ ok: false, error: String(e && e.message || e) });
  }
};
