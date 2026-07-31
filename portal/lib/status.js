// The 7-stage sample status model (master spec §5).
// `status` is stored as the human label; helpers map it to a step index for
// the progress bar and next-step routing.

export const STAGES = [
  { key: "order_received", label: "Order Received",               hint: "We received your order" },
  { key: "shipped",        label: "Shipped",                      hint: "Your kit is on the way" },
  { key: "with_customer",  label: "With Customer for Collection", hint: "Register, train, and collect" },
  { key: "in_route",       label: "In Route to Lab",              hint: "Your sample is heading to the lab" },
  { key: "received_by_lab", label: "Received by Lab",             hint: "The lab has your sample" },
  { key: "in_analysis",    label: "In Analysis",                  hint: "Certified analysis underway" },
  { key: "results_ready",  label: "Results Ready",                hint: "Your report is available" },
];

export const STATUS_LABELS = STAGES.map((s) => s.label);

// Tolerant text → 0-based stage index (mirrors the dashboard mockup).
export function statusIndex(status) {
  const k = String(status || "").toLowerCase().replace(/[^a-z]/g, "");
  const map = {
    orderreceived: 0,
    shipped: 1,
    withcustomerforcollection: 2, withcustomer: 2, registered: 2,
    inroutetolab: 3, intransit: 3,
    receivedbylab: 4, receivedatlab: 4,
    inanalysis: 5,
    resultsready: 6, complete: 6,
  };
  return k in map ? map[k] : 2;
}

export function stepNumber(status) {
  return statusIndex(status) + 1;
}

export function isResultsReady(status) {
  return statusIndex(status) >= 6;
}

// The canonical label for a given index (used when a page advances status).
export function labelForIndex(i) {
  return STATUS_LABELS[Math.max(0, Math.min(STATUS_LABELS.length - 1, i))];
}
