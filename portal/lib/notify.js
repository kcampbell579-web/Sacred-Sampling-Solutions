// Best-effort owner notification for new orders. Uses Resend if configured;
// otherwise silently no-ops (the fulfillment portal + Stripe's own email still
// cover the notification). Never throws — notification must not fail a webhook.
export async function notifyOwnerNewOrder(order) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_EMAIL || "info@sacredsamplingsolutions.com";
  if (!key) return;
  try {
    const lines = [
      `New order ${order.orderNumber}`,
      `Kit: ${order.kit_name || "-"}`,
      `Customer: ${order.customer_name || "-"} (${order.email || "-"})`,
      `Ship to: ${order.ship_name || "-"}, ${order.ship_address || "-"}`,
      `Amount: ${order.amount_total != null ? "$" + (order.amount_total / 100).toFixed(2) : "-"}`,
    ];
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Sacred Sampling <orders@sacredsamplingsolutions.com>",
        to: [to],
        subject: `New order ${order.orderNumber} — ${order.kit_name || "Sacred Sampling kit"}`,
        text: lines.join("\n"),
      }),
    });
  } catch {
    // swallow — notification is best-effort
  }
}
