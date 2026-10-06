"use client";

import { useState } from "react";
import { track } from "@/lib/track";

export function ShareButtons({ url, text, kind }: { url: string; text: string; kind: "receipt" | "campaign" }) {
  const [copied, setCopied] = useState(false);
  const full = typeof window !== "undefined" && url.startsWith("/") ? window.location.origin + url : url;
  const enc = encodeURIComponent;
  const targets = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} ${full}`)}`, cls: "bg-[#25D366] text-white" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(full)}`, cls: "bg-[#1877F2] text-white" },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(full)}`, cls: "bg-black text-white" },
  ];
  const native = async () => {
    track("share", { kind, via: "native" });
    try {
      await navigator.share({ title: "Janaseva Ashrama", text, url: full });
    } catch {}
  };
  return (
    <div className="flex flex-wrap gap-2 no-print">
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button onClick={native} className="focus-ring rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-bold text-white">Share…</button>
      )}
      {targets.map((t) => (
        <a key={t.label} href={t.href} target="_blank" rel="noopener" onClick={() => track("share", { kind, via: t.label })} className={`focus-ring rounded-xl px-4 py-2.5 text-sm font-bold ${t.cls}`}>
          {t.label}
        </a>
      ))}
      <button
        onClick={async () => {
          await navigator.clipboard?.writeText(full).catch(() => {});
          setCopied(true);
          track("share", { kind, via: "copy" });
          setTimeout(() => setCopied(false), 2000);
        }}
        className="focus-ring rounded-xl border-2 border-teal-800/30 px-4 py-2 text-sm font-bold text-teal-900"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
      <span className="basis-full text-xs text-teal-950/50">Instagram: copy the link and paste it in your story or bio.</span>
    </div>
  );
}
