"use client";

import Link from "next/link";
import { useState } from "react";


export function ReceiptActions({ donationPublicId }: { donationPublicId: string }) {
  const [certName, setCertName] = useState("");
  const [certRef, setCertRef] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function createCertificate() {
    setBusy("cert");
    setError("");
    try {
      const r = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationPublicId, displayName: certName }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not generate certificate");
      setCertRef(d.reference);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      <div className="rounded-2xl bg-sand p-4">
        <h3 className="font-display text-lg font-bold text-teal-900">Impact Certificate</h3>
        <p className="text-xs text-teal-950/65">Server-generated from your verified donation.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input value={certName} onChange={(e) => setCertName(e.target.value)} placeholder="Optional display name" className="focus-ring rounded-xl border border-teal-900/20 bg-white px-3 py-2 text-sm" />
          <button onClick={createCertificate} disabled={!!busy} className="focus-ring rounded-xl bg-teal-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {busy === "cert" ? "Generating…" : "Generate certificate"}
          </button>
          {certRef && <Link href={`/certificate/${certRef}`} className="rounded-xl bg-saffron px-4 py-2 text-sm font-bold text-white">Open certificate</Link>}
        </div>
      </div>

      <div className="rounded-2xl bg-sand p-4">
        <h3 className="font-display text-lg font-bold text-teal-900">Gift an Impact</h3>
        <p className="text-xs text-teal-950/65">For a new gift, choose the recipient and occasion before payment so the gift stays connected to the contribution.</p>
        <Link href="/gift-impact" className="mt-3 inline-block rounded-xl bg-teal-800 px-4 py-2 text-sm font-bold text-white">Start a new gift</Link>
      </div>
    </div>
  );
}
