// GET /api/order?session_id=cs_... — reads a completed Stripe Checkout
// Session back so the thank-you page can (a) fire the purchase conversion
// with the REAL amount paid and (b) show a Sacred Sampling order number
// (derived from the session, not Stripe's raw id) that maps to a Sample ID.
//
// Requires the STRIPE_SECRET_KEY environment variable (same one used by
// /api/checkout). No npm dependencies — calls the Stripe REST API directly.

// Turn a Stripe session id into a short, stable, human-friendly order number.
// Deterministic (same session -> same number) and unique per order, e.g.
// "cs_live_a1B2c3D4e5F6" -> "SSS-3D4E5F6".  Not sequential — see /api/order
// notes if you want 1001, 1002… (that needs a small counter/database).
function orderNumber(sessionId) {
  var tail = String(sessionId || '').replace(/^cs_(live|test)_/, '');
  var clean = tail.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  var code = clean.slice(-7) || 'ORDER';
  return 'SSS-' + code;
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
    return res.status(200).json({
      order_number: orderNumber(s.id),
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
