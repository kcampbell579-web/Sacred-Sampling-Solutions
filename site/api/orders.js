// GET /api/orders — a private, read-only orders feed for the shop owner.
//
// Purpose: let you SEE your orders without ever logging into Stripe. It uses
// the STRIPE_SECRET_KEY already configured in Vercel to list recent Checkout
// Sessions, and shows each order with the same Sacred Sampling order number
// (SS-XXX-#####) the customer received.
//
// SECURITY: protected by a shared password you set once in Vercel as the
// ORDERS_ADMIN_KEY environment variable. The browser sends it as ?key=... (or
// an x-admin-key header); this function compares it and returns 401 otherwise.
// No password env set => the endpoint refuses to run (so it can't leak orders).
//
// Query params:
//   key    — the admin password (required unless sent as x-admin-key header)
//   limit  — how many recent orders to pull (default 100, max 100 per Stripe page)
//   paid   — "1" (default) to show only paid orders; "0" to include unpaid.

var ORDER_START = 91001;

// Same Sample-ID abbreviations as /api/order, keyed by the product name Stripe
// stores on each line item. Keep in sync with api/order.js.
var ABBREV = {
  'Heavy Metals Kit': 'BAS',
  'Metals & Minerals Kit': 'MNM',
  'Comprehensive Kit': 'COM',
  'PFAS Kit': 'PFAS',
  'Essentials Kit': 'ESS',
  'Complete Home Inspection Water Kit': 'PRO',
  'Complete Air Quality Kit': 'IAC',
  'NO₂ Monitor': 'NO2',
  'Aldehyde & Formaldehyde Monitor': 'ALD',
  'VOC Monitor': 'VOC',
  'Ammonia Monitor': 'AMM',
  'Asbestos Core Kit': 'ASB',
  'Asbestos Standard Kit': 'ASP',
  'Asbestos Advanced Kit': 'AST',
  'Cosmetic Screening Panel': 'CSM',
  'Cosmetic Identification Panel': 'CSM',
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

// ---- KV (Upstash REST), read-only lookup of an already-assigned number ----
function kvConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  };
}
async function kvGet(key) {
  var c = kvConfig();
  if (!c.url || !c.token) return null;
  try {
    var r = await fetch(c.url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + c.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', key])
    });
    if (!r.ok) return null;
    var j = await r.json();
    return j && j.result;
  } catch (e) { return null; }
}

function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  var out = 0;
  for (var i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

module.exports = async function handler(req, res) {
  var stripeKey = process.env.STRIPE_SECRET_KEY;
  var adminKey = process.env.ORDERS_ADMIN_KEY;

  if (!stripeKey) return res.status(500).json({ error: 'Not configured: STRIPE_SECRET_KEY missing.' });
  if (!adminKey) {
    return res.status(500).json({ error: 'Set an ORDERS_ADMIN_KEY environment variable in Vercel to enable the orders page.' });
  }

  var q = req.query || {};
  function param(name) {
    if (q[name] != null) return q[name];
    try { return new URL(req.url, 'http://x').searchParams.get(name); } catch (e) { return null; }
  }
  var provided = req.headers['x-admin-key'] || param('key') || '';
  if (!safeEqual(provided, adminKey)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  var limit = parseInt(param('limit'), 10);
  if (!(limit > 0)) limit = 100;
  limit = Math.min(limit, 100);
  var paidOnly = param('paid') !== '0';

  try {
    var url = 'https://api.stripe.com/v1/checkout/sessions?limit=' + limit +
      '&expand[]=data.line_items';
    var resp = await fetch(url, { headers: { 'Authorization': 'Bearer ' + stripeKey } });
    var data = await resp.json();
    if (!resp.ok || !data || !Array.isArray(data.data)) {
      return res.status(502).json({ error: (data && data.error && data.error.message) || 'Could not load orders.' });
    }

    var sessions = data.data;
    var out = [];
    for (var n = 0; n < sessions.length; n++) {
      var s = sessions[n];
      var isPaid = s.payment_status === 'paid';
      if (paidOnly && !isPaid) continue;
      // Skip empty/expired sessions with no line items.
      var lis = (s.line_items && s.line_items.data) || [];
      if (!lis.length) continue;

      var items = lis.map(function (li) { return { name: li.description, quantity: li.quantity }; });
      var abbr = abbrevFor(items);

      // Prefer the number already assigned in KV (what the customer saw);
      // otherwise show the deterministic fallback code.
      var orderNo = null;
      try { orderNo = await kvGet('order:sid:' + s.id); } catch (e) { orderNo = null; }
      if (!orderNo) orderNo = fallbackNumber(s.id, abbr);

      var ship = s.shipping_details || {};
      var addr = ship.address || {};
      var cust = s.customer_details || {};
      out.push({
        order_number: orderNo,
        created: s.created ? s.created * 1000 : null,   // ms epoch
        paid: isPaid,
        payment_status: s.payment_status,
        amount_total: (typeof s.amount_total === 'number') ? s.amount_total / 100 : null,
        currency: (s.currency || 'usd').toUpperCase(),
        email: cust.email || null,
        name: ship.name || cust.name || null,
        phone: cust.phone || null,
        address: {
          line1: addr.line1 || '', line2: addr.line2 || '',
          city: addr.city || '', state: addr.state || '',
          postal_code: addr.postal_code || '', country: addr.country || ''
        },
        items: items
      });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ count: out.length, orders: out });
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach the payment processor.' });
  }
};
