// GET /api/order?session_id=cs_... — reads a completed Stripe Checkout
// Session back so the thank-you page can (a) fire the purchase conversion
// with the REAL amount paid and (b) show a Sacred Sampling order number
// that maps to a Sample ID.
//
// Order numbers are SEQUENTIAL (SS-XX-91001, 91002, …) when a KV store is
// connected (env KV_REST_API_URL + KV_REST_API_TOKEN, or the UPSTASH_* pair).
// The counter is atomic and each order gets its number once (idempotent per
// session). Without a KV store it falls back to a unique non-sequential code
// so nothing breaks.
//
// Requires STRIPE_SECRET_KEY (same key as /api/checkout).

var ORDER_START = 91001;       // first sequential number (global across kits)

// Kit abbreviation used in the order number: SS-<ABBR>-<number>.
// Keyed by the product name Stripe stores on each line item. Edit freely.
// A cart with more than one distinct kit uses 'MIX'.
var ABBREV = {
  'Ammonia Monitor': 'AMM',
  'Asbestos Advanced Kit': 'ASBA',
  'Asbestos Core Kit': 'ASBC',
  'Asbestos Standard Kit': 'ASBS',
  'Comprehensive Kit': 'COMP',
  'Cosmetic Identification Panel': 'COSI',
  'Cosmetic Screening Panel': 'COSS',
  'Essentials Kit': 'ESS',
  'Fentanyl Surface Residue Kit': 'FEN',
  'Aldehyde & Formaldehyde Monitor': 'FORM',
  'Heavy Metals Kit': 'HM',
  'Baseline Residential IAQ Kit': 'IAQB',
  'Comprehensive Residential IAQ Kit': 'IAQC',
  'Standard Residential IAQ Kit': 'IAQS',
  'Metals & Minerals Kit': 'MM',
  'PFAS Kit': 'PFAS',
  'Complete Home Inspection Water Kit': 'CHI',
  'VOC Monitor': 'VOC'
};
function abbrevFor(items) {
  var names = {};
  (items || []).forEach(function (i) { if (i && i.name) names[i.name] = true; });
  var keys = Object.keys(names);
  if (keys.length === 1) return ABBREV[keys[0]] || 'KIT';
  if (keys.length > 1) return 'MIX';
  return 'KIT';
}

// ---- KV (Upstash REST) helpers — dependency-free ------------------------
function kvConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  };
}
async function kv(command) {           // command: ["INCR","key"] etc.
  var c = kvConfig();
  if (!c.url || !c.token) return null; // KV not connected
  try {
    var r = await fetch(c.url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + c.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    });
    if (!r.ok) return null;
    return await r.json();             // { result: ... }
  } catch (e) { return null; }
}

// Assign (or re-read) the sequential number for a paid session. Idempotent:
// the same session always returns the same number.
async function sequentialNumber(sessionId, abbr) {
  var existing = await kv(['GET', 'order:sid:' + sessionId]);
  if (existing === null) return null;                 // KV not connected → caller falls back
  if (existing.result) return existing.result;        // already assigned
  var inc = await kv(['INCR', 'order:counter']);      // atomic, global sequence
  if (!inc || typeof inc.result !== 'number') return null;
  var number = 'SS-' + abbr + '-' + (ORDER_START - 1 + inc.result);
  await kv(['SET', 'order:sid:' + sessionId, number]);
  return number;
}

// Fallback: a stable, unique, non-sequential code from the session id.
function fallbackNumber(sessionId, abbr) {
  var tail = String(sessionId || '').replace(/^cs_(live|test)_/, '');
  var clean = tail.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return 'SS-' + abbr + '-' + (clean.slice(-6) || 'ORDER');
}

module.exports = async function handler(req, res) {
  var key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'Not configured.' });

  var sessionId = (req.query && req.query.session_id) ||
    (function () { try { return new URL(req.url, 'http://x').searchParams.get('session_id'); } catch (e) { return null; } })();
  if (!sessionId || !/^cs_/.test(sessionId)) {
    return res.status(400).json({ error: 'Missing or invalid session_id.' });
  }

  try {
    var url = 'https://api.stripe.com/v1/checkout/sessions/' +
      encodeURIComponent(sessionId) + '?expand[]=line_items';
    var resp = await fetch(url, { headers: { 'Authorization': 'Bearer ' + key } });
    var s = await resp.json();
    if (!resp.ok || !s || !s.id) {
      return res.status(502).json({ error: (s && s.error && s.error.message) || 'Could not load order.' });
    }

    var items = (s.line_items && s.line_items.data || []).map(function (li) {
      return { name: li.description, quantity: li.quantity };
    });
    var abbr = abbrevFor(items);

    // Only assign a sequential number to a genuinely paid order (so abandoned
    // checkouts never consume a number). Fall back to a unique code otherwise.
    var orderNo = null;
    if (s.payment_status === 'paid') {
      try { orderNo = await sequentialNumber(s.id, abbr); } catch (e) { orderNo = null; }
    }
    if (!orderNo) orderNo = fallbackNumber(s.id, abbr);
    return res.status(200).json({
      order_number: orderNo,
      amount_total: (typeof s.amount_total === 'number') ? s.amount_total / 100 : undefined,
      currency: (s.currency || 'usd').toUpperCase(),
      payment_status: s.payment_status,
      email: s.customer_details && s.customer_details.email || undefined,
      items: items
    });
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach the payment processor.' });
  }
};
