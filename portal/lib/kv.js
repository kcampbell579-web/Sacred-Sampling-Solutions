// Read-only Upstash KV (REST) lookup — used to resolve the customer-facing
// order number (SS-<ABBR>-#####) that the marketing site assigned at checkout
// and stored under `order:sid:<stripe_session_id>`. Returns null if KV isn't
// configured or the key is missing, so callers can fall back gracefully.
function kvConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

export function kvConfigured() {
  const c = kvConfig();
  return !!(c.url && c.token);
}

export async function kvGet(key) {
  const c = kvConfig();
  if (!c.url || !c.token) return null;
  try {
    const r = await fetch(c.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["GET", key]),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = await r.json();
    return (j && j.result) || null;
  } catch {
    return null;
  }
}
