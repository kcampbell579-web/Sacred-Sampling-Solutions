export function humanInterval(seconds) {
  const s = Number(seconds) || 0;
  const units = [["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  for (const [label, size] of units) {
    if (s >= size && s % size === 0) {
      const n = s / size;
      return `${n} ${label}${n === 1 ? "" : "s"}`;
    }
  }
  return `${s} seconds`;
}

export function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 16);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

// Rough finish estimate: how long the remaining queue takes at the set pace.
export function estimateRemaining(queued, batchSize, intervalSeconds) {
  const b = Math.max(1, batchSize || 1);
  const ticks = Math.ceil((queued || 0) / b);
  if (ticks <= 0) return "—";
  const secs = ticks * (intervalSeconds || 0);
  if (secs < 90) return `about ${Math.round(secs)} seconds`;
  if (secs < 5400) return `about ${Math.round(secs / 60)} minutes`;
  if (secs < 172800) return `about ${Math.round(secs / 3600)} hours`;
  return `about ${Math.round(secs / 86400)} days`;
}
