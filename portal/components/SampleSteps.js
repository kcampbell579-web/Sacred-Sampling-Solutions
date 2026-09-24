import { statusIndex } from "@/lib/status";

// Persistent per-sample step sidebar. Every step is clickable so a customer can
// jump back to the collection training (or ahead) at any time. Wrap a page's
// main content as children; it renders the sidebar beside it.
export default function SampleSteps({ sampleId, kitSlug, status, cocUrl, current, children }) {
  const idx = statusIndex(status);          // 0-6 stage index
  const collected = !!cocUrl;
  const id = encodeURIComponent(sampleId || "");
  const slug = kitSlug || "";

  const steps = [
    {
      key: "register", n: 1, label: "Register kit",
      sub: "Your kit details", href: "/sampleregistration",
      done: true,
    },
    {
      key: "training", n: 2, label: "Collection training",
      sub: "Watch & review the steps", href: slug ? `/training/${slug}?id=${id}` : "/instructions",
      done: collected || idx >= 3,
    },
    {
      key: "collect", n: 3, label: "Chain of custody",
      sub: "Fill out & sign", href: `/collect?id=${id}`,
      done: collected,
    },
    {
      key: "ship", n: 4, label: "Ship your sample",
      sub: "Print label & send", href: `/shipping?id=${id}`,
      done: idx >= 3,
    },
    {
      key: "results", n: 5, label: "Results",
      sub: idx >= 6 ? "View your report" : "When analysis is done", href: `/results/${id}`,
      done: idx >= 6,
    },
  ];

  return (
    <div className="samplelayout">
      <aside className="ssteps-wrap">
        <div className="ssteps-h">Your steps</div>
        <nav className="ssteps" aria-label="Sample steps">
          {steps.map((s) => {
            const isCurrent = s.key === current;
            const cls = isCurrent ? "sstep on" : s.done ? "sstep done" : "sstep";
            return (
              <a className={cls} href={s.href} key={s.key} aria-current={isCurrent ? "step" : undefined}>
                <span className="sstep-n">{s.done && !isCurrent ? "✓" : s.n}</span>
                <span className="sstep-tx">
                  <span className="sstep-t">{s.label}</span>
                  <span className="sstep-s">{s.sub}</span>
                </span>
              </a>
            );
          })}
        </nav>
        <a className="ssteps-help" href="/instructions">📄 Full collection instructions</a>
      </aside>
      <div className="ssmain">{children}</div>
    </div>
  );
}
