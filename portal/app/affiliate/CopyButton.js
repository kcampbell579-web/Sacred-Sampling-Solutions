"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "Copy" }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={copy} aria-live="polite">
      {done ? "Copied ✓" : label}
    </button>
  );
}
