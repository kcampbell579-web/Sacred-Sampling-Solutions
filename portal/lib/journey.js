// Turns an order + its tracking + the customer's sample into the six-step
// journey bar on the fulfillment Orders tab. Pure function (easy to test).
import { statusIndex } from "./status";

const short = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
};

// order: { status, created_at, shipped_at, tracking_number }
// out:   live outbound tracking row (or null)  { status, status_date, eta, location }
// reg:   the customer's sample registration (or null) { status, tracking_number }
// back:  live return tracking row (or null)
export function buildJourney({ order, out, reg, back }) {
  const os = String(order.status || "");
  const live = out && out.status;
  const sampleIdx = reg ? statusIndex(reg.status) : -1;

  const steps = [
    { key: "ordered", label: "Ordered", done: true, note: short(order.created_at) },
    { key: "shipped", label: "Shipped", done: false, note: "" },
    { key: "delivered", label: "Delivered", done: false, note: "" },
    { key: "returning", label: "Sample on the way", done: false, note: "" },
    { key: "lab", label: "At the lab", done: false, note: "" },
    { key: "results", label: "Results", done: false, note: "" },
  ];
  const [, shipped, delivered, returning, lab, results] = steps;

  // Outbound leg (kit → customer)
  if (order.tracking_number || os === "shipped" || os === "fulfilled" || live) {
    shipped.done = true;
    shipped.note = short(order.shipped_at) || "";
  }
  if (live === "PRE_TRANSIT" || live === "UNKNOWN") {
    shipped.note = "Label created";
  } else if (live === "TRANSIT") {
    shipped.note = out.location ? `In transit · ${out.location}` : "In transit";
    delivered.note = out.eta ? `ETA ${short(out.eta)}` : "";
  } else if (live === "DELIVERED") {
    delivered.done = true;
    delivered.note = short(out.status_date) || "Delivered";
  } else if (live === "RETURNED" || live === "FAILURE") {
    delivered.error = true;
    delivered.note = live === "RETURNED" ? "Returned to sender" : "Delivery problem";
  }
  // No live UPS data but the order was closed out by hand → treat as delivered.
  if (!delivered.done && !delivered.error && os === "fulfilled") {
    delivered.done = true;
    delivered.note = "Confirmed";
  }

  // Return leg (sample → lab) and results
  const backLive = back && back.status;
  if ((reg && reg.tracking_number) || sampleIdx >= 3 || backLive) {
    returning.done = true;
    returning.note = backLive === "TRANSIT" && back.location ? `In transit · ${back.location}` : "";
  }
  if (backLive === "DELIVERED" || sampleIdx >= 4) {
    returning.done = true;
    lab.done = true;
    lab.note = backLive === "DELIVERED" ? short(back.status_date) : "";
  }
  if (sampleIdx >= 6) {
    returning.done = lab.done = results.done = true;
    results.note = "Released";
  }
  // Anything later being done implies the earlier steps happened.
  for (let i = steps.length - 1; i > 0; i--) {
    if (steps[i].done) for (let j = 0; j < i; j++) if (!steps[j].error) steps[j].done = true;
  }

  // The step to watch: the first one not done yet.
  const next = steps.findIndex((s) => !s.done);
  if (next !== -1 && !steps[next].error) steps[next].current = true;
  const reached = next === -1 ? steps.length : next;
  return { steps, reached, delivered: delivered.done, problem: !!delivered.error };
}
