// Prepaid UPS return labels via the Shippo REST API.
//
// The Shippo token lives ONLY in the SHIPPO_API_TOKEN env var (Vercel → Settings
// → Environment Variables). Use your LIVE token (shippo_live_…) to buy real
// labels; a TEST token (shippo_test_…) returns a sample label without charging.
import { LAB_ADDRESS, PARCEL, CARRIERS } from "./shipconfig";

const BASE = "https://api.goshippo.com";

function token() {
  const t = process.env.SHIPPO_API_TOKEN;
  if (!t) {
    throw new Error(
      "SHIPPO_API_TOKEN is not set. Add it in Vercel → Settings → Environment Variables (Shippo dashboard → Settings → API → your Live token, starts with shippo_live_)."
    );
  }
  return t;
}

async function shippo(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: {
      Authorization: "ShippoToken " + token(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.detail || data?.__all__ || `Shippo request failed (${res.status}).`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

// customer: { name, street1, street2, city, state, zip, phone, email }
// Returns { carrier, service, rate, tracking, labelUrl }.
export async function createReturnLabel(customer) {
  const shipment = await shippo("/shipments/", {
    address_from: { country: "US", ...customer },
    address_to: LAB_ADDRESS,
    parcels: [PARCEL],
    extra: { is_return: true },
    async: false,
  });

  const rates = Array.isArray(shipment.rates) ? shipment.rates : [];
  if (!rates.length) {
    throw new Error(
      "No shipping rates came back. Check the return address, and confirm a UPS carrier is connected in your Shippo account."
    );
  }

  const pool = rates.filter((r) => CARRIERS.includes((r.provider || "").toUpperCase()));
  const choose = (pool.length ? pool : rates).sort(
    (a, b) => parseFloat(a.amount) - parseFloat(b.amount)
  )[0];

  const tx = await shippo("/transactions/", {
    rate: choose.object_id,
    label_file_type: "PDF",
    async: false,
  });

  if (tx.status !== "SUCCESS" || !tx.label_url) {
    const msgs = Array.isArray(tx.messages)
      ? tx.messages.map((m) => m.text || m).filter(Boolean).join("; ")
      : "";
    throw new Error(msgs || "Shippo could not create the label. Please try again.");
  }

  return {
    carrier: choose.provider || "UPS",
    service: choose.servicelevel?.name || "",
    rate: choose.amount || "",
    tracking: tx.tracking_number || "",
    labelUrl: tx.label_url || "",
  };
}
