import { STATUS_STEPS, statusIndex } from "@/lib/products";

export default function Timeline({ status }) {
  const current = statusIndex(status); // -1 when inactive
  return (
    <div className="timeline">
      {STATUS_STEPS.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "";
        return (
          <div className={`tstep ${state}`} key={step.key}>
            <span className="bar" />
            <div className="dot">{i <= current ? "✓" : i + 1}</div>
            <div className="tlabel">{step.label}</div>
            <div className="thint">{step.hint}</div>
          </div>
        );
      })}
    </div>
  );
}

export function StatusPill({ status }) {
  const label = {
    inactive: "Not activated", activated: "Registered", received: "Received at lab",
    analyzing: "In analysis", ready: "Report ready",
  }[status] || status;
  return <span className={`pill s-${status}`}>{label}</span>;
}
