// POST /api/checkout — creates a Stripe Checkout Session from the cart.
//
// Deployed automatically by Vercel as a Serverless Function (the /api folder).
// No npm dependencies: it calls the Stripe REST API directly with fetch.
//
// REQUIRED: the STRIPE_SECRET_KEY environment variable, set in
//   Vercel → Project → Settings → Environment Variables (Production + Preview).
// The key is never stored in this repo.
//
// Security: the browser only sends { slug, qty }. Every price is looked up
// here from CATALOG (the source of truth), so amounts can't be tampered with
// client-side.

// slug → { name, amount(cents) }.  Keep in sync with the kit pages' prices.
var CATALOG = {
  'kit-ammonia':                { name: 'Ammonia Monitor',                    amount: 12500 },
  'kit-asbestos-advanced':      { name: 'Asbestos Advanced Kit',              amount: 24900 },
  'kit-asbestos-core':          { name: 'Asbestos Core Kit',                  amount: 9900 },
  'kit-asbestos-standard':      { name: 'Asbestos Standard Kit',              amount: 14900 },
  'kit-comprehensive':          { name: 'Comprehensive Kit',                  amount: 27500 },
  'kit-cosmetic-identification':{ name: 'Cosmetic Identification Panel',      amount: 59900 },
  'kit-cosmetic-screening':     { name: 'Cosmetic Screening Panel',           amount: 24900 },
  'kit-essentials':             { name: 'Essentials Kit',                     amount: 19900 },
  'kit-fentanyl-surface':       { name: 'Fentanyl Surface Residue Kit',       amount: 29900 },
  'kit-formaldehyde':           { name: 'Aldehyde & Formaldehyde Monitor',    amount: 14900 },
  'kit-heavy-metals':           { name: 'Heavy Metals Kit',                   amount: 17400 },
  'kit-iaq-baseline':           { name: 'Baseline Residential IAQ Kit',       amount: 27500 },
  'kit-iaq-comprehensive':      { name: 'Comprehensive Residential IAQ Kit',  amount: 59900 },
  'kit-iaq-standard':           { name: 'Standard Residential IAQ Kit',       amount: 34900 },
  'kit-metals-minerals':        { name: 'Metals & Minerals Kit',              amount: 24900 },
  'kit-pfas':                   { name: 'PFAS Kit',                           amount: 32900 },
  'kit-professional':           { name: 'Complete Home Inspection Water Kit', amount: 119500 },
  'kit-voc-air':                { name: 'VOC Monitor',                        amount: 19900 }
};

// Flatten a nested object into Stripe's form-encoded bracket notation.
function encodeForm(obj, params, prefix) {
  params = params || new URLSearchParams();
  Object.keys(obj).forEach(function (k) {
    var v = obj[k];
    if (v === null || v === undefined) return;
    var key = prefix ? prefix + '[' + k + ']' : k;
    if (Array.isArray(v)) {
      v.forEach(function (item, i) {
        if (item !== null && typeof item === 'object') encodeForm(item, params, key + '[' + i + ']');
        else params.append(key + '[' + i + ']', String(item));
      });
    } else if (typeof v === 'object') {
      encodeForm(v, params, key);
    } else {
      params.append(key, String(v));
    }
  });
  return params;
}

function readRawBody(req) {
  return new Promise(function (resolve) {
    var data = '';
    req.on('data', function (chunk) { data += chunk; });
    req.on('end', function () { resolve(data); });
    req.on('error', function () { resolve(''); });
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  var key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Checkout is not configured yet. Add STRIPE_SECRET_KEY in Vercel.' });
  }

  // Body may arrive pre-parsed (Vercel) or as a raw stream.
  var body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || (await readRawBody(req)) || '{}'); }
    catch (e) { body = {}; }
  }

  var items = (body && Array.isArray(body.items)) ? body.items : [];
  var email = body && typeof body.email === 'string' ? body.email.trim() : '';

  var lineItems = [];
  items.forEach(function (it) {
    var product = it && CATALOG[it.slug];
    if (!product) return;
    var qty = parseInt(it.qty, 10);
    if (!(qty > 0)) qty = 1;
    qty = Math.min(qty, 10);
    lineItems.push({
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: product.amount,
        product_data: { name: product.name }
      }
    });
  });

  if (!lineItems.length) {
    return res.status(400).json({ error: 'Your cart is empty or contains no valid kits.' });
  }

  var proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  var host = req.headers['x-forwarded-host'] || req.headers.host;
  var base = proto + '://' + host;

  var payload = {
    mode: 'payment',
    line_items: lineItems,
    allow_promotion_codes: true,                       // WELCOME25 etc.
    shipping_address_collection: { allowed_countries: ['US'] },
    shipping_options: [{
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 0, currency: 'usd' },
        display_name: 'Free shipping'
      }
    }],
    success_url: base + '/thank-you?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: base + '/kits'
  };
  if (email) payload.customer_email = email;

  try {
    var resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: encodeForm(payload).toString()
    });
    var data = await resp.json();
    if (!resp.ok || !data || !data.url) {
      var msg = (data && data.error && data.error.message) || 'Could not create checkout session.';
      return res.status(502).json({ error: msg });
    }
    return res.status(200).json({ url: data.url });
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach the payment processor. Please try again.' });
  }
};
