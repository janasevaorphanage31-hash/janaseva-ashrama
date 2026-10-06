"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="focus-ring rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white no-print hover:bg-teal-900">
      ⬇ Download receipt (PDF)
    </button>
  );
}
