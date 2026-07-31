import { STAGES, statusIndex } from "@/lib/status";

export function pillClass(i) {
  return i >= 6 ? "good" : i <= 2 ? "warn" : "blue";
}

// 7-segment progress bar.
export function Stepbar({ status }) {
  const idx = statusIndex(status);
  return (
    <div className="stepbar" role="img" aria-label={`Step ${idx + 1} of 7 — ${STAGES[idx].label}`}>
      {STAGES.map((s, j) => {
        const cls = j < idx ? "done" : j === idx ? (idx >= 6 ? "ready" : "on") : "";
        return <span key={s.key} className={`seg ${cls}`} title={s.label} />;
      })}
    </div>
  );
}

// Status label pill, colored by stage.
export function StageBadge({ status }) {
  const idx = statusIndex(status);
  return <span className={`pill p-${pillClass(idx)}`}>{STAGES[idx].label}</span>;
}
