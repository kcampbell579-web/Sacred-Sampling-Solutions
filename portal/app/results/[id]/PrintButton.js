"use client";

export default function PrintButton() {
  return (
    <button className="btn btn-ghost" type="button" onClick={() => window.print()}>
      ⤓ Save as PDF
    </button>
  );
}
