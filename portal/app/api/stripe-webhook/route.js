import { sql } from "@/lib/db";
import { verifyStripeSignature, stripeGet, orderNumber } from "@/lib/stripe";
import { notifyOwnerNewOrder } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Stripe calls this on every checkout. We record paid orders into `orders`
// so they appear in the fulfillment portal. Security is the signature check.
export async function POST(request) {
  const raw = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!verifyStripeSignature(raw, sig, secret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object || {};

    // Product name(s) — needs the secret key to expand line items.
    let kit = "";
    let qty = 1;
    try {
      const li = await stripeGet(`checkout/sessions/${s.id}/line_items?limit=20`);
      const items = li.data || [];
      qty = items.reduce((n, x) => n + (x.quantity || 1), 0) || 1;
      kit = items.map((x) => `${x.quantity || 1}× ${x.description || "Kit"}`).join(", ");
    } catch {
      // fall back to nothing; order still recorded
    }

    const cd = s.customer_details || {};
    const ship = s.shipping_details || (s.collected_information && s.collected_information.shipping_details) || {};
    const addr = ship.address || cd.address || {};
    const shipAddress = [
      addr.line1,
      addr.line2,
      [addr.city, addr.state, addr.postal_code].filter(Boolean).join(" "),
      addr.country,
    ].filter(Boolean).join(", ");

    const rows = await sql`
      insert into orders
        (stripe_session_id, email, customer_name, amount_total, currency, kit_name, quantity, ship_name, ship_address, phone, status)
      values
        (${s.id}, ${cd.email || null}, ${cd.name || null}, ${s.amount_total ?? null}, ${s.currency || "usd"},
         ${kit || null}, ${qty}, ${ship.name || cd.name || null}, ${shipAddress || null}, ${cd.phone || null}, 'new')
      on conflict (stripe_session_id) do nothing
      returning id`;

    if (rows.length) {
      await notifyOwnerNewOrder({
        orderNumber: orderNumber(rows[0].id),
        kit_name: kit,
        customer_name: cd.name,
        email: cd.email,
        ship_name: ship.name || cd.name,
        ship_address: shipAddress,
        amount_total: s.amount_total,
      });
    }
  }

  return new Response("ok", { status: 200 });
}
